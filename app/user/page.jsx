"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { HealthService } from "../../lib/healthService";
import Header from "../../components/Layout/HeaderUser";

// Dynamic import for recharts to avoid SSR issues
import dynamic from 'next/dynamic';

const Radar = dynamic(() => import('recharts').then(mod => mod.Radar), { ssr: false });
const RadarChart = dynamic(() => import('recharts').then(mod => mod.RadarChart), { ssr: false });
const PolarGrid = dynamic(() => import('recharts').then(mod => mod.PolarGrid), { ssr: false });
const PolarAngleAxis = dynamic(() => import('recharts').then(mod => mod.PolarAngleAxis), { ssr: false });
const PolarRadiusAxis = dynamic(() => import('recharts').then(mod => mod.PolarRadiusAxis), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });

export default function UserPage() {
  const router = useRouter();
  const daysRowRef = useRef(null);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const [showQuestions, setShowQuestions] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});

  const [selectedDate, setSelectedDate] = useState(null);
  const [dailyData, setDailyData] = useState({});
  const [currentDays, setCurrentDays] = useState([]);

  const presenceIntervalRef = useRef(null);
  const isPresenceStartedRef = useRef(false);
  const beforeUnloadHandlerRef = useRef(null);

  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      days.push({
        date: date.toISOString().split("T")[0],
        day: date.getDate(),
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        month: date.toLocaleDateString("en-US", { month: "short" }),
        isToday: i === 0,
        isYesterday: i === 1,
        fullDate: date,
      });
    }
    return days;
  };

  const formatDisplayDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  };

  const formatMonthYear = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, { month: "long", year: "numeric" });
  };

  const upsertPresence = async (_ignored, isOnline, opts = {}) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from("user_presence_last_seen")
        .upsert({ user_id: uid, is_online: !!isOnline, last_seen_at: nowIso, updated_at: nowIso }, { onConflict: "user_id" });
      if (error && !opts?.silent) console.error("Presence upsert error:", error);
    } catch (e) {
      if (!opts?.silent) console.error("Presence upsert unexpected error:", e);
    }
  };

  const startPresenceHeartbeat = async (userId) => {
    if (!userId || isPresenceStartedRef.current) return;
    isPresenceStartedRef.current = true;
    await upsertPresence(userId, true);
    presenceIntervalRef.current = setInterval(() => upsertPresence(userId, true), 60 * 1000);
    const handler = () => upsertPresence(userId, false, { silent: true });
    beforeUnloadHandlerRef.current = handler;
    window.addEventListener("beforeunload", handler);
  };

  const stopPresenceHeartbeat = async (userId) => {
    try {
      if (presenceIntervalRef.current) { clearInterval(presenceIntervalRef.current); presenceIntervalRef.current = null; }
      if (beforeUnloadHandlerRef.current) { window.removeEventListener("beforeunload", beforeUnloadHandlerRef.current); beforeUnloadHandlerRef.current = null; }
      await upsertPresence(userId, false);
    } catch (e) { console.error("stopPresenceHeartbeat error:", e); }
    finally { isPresenceStartedRef.current = false; }
  };

  useEffect(() => {
    initializePage();
    return () => { if (user?.id) stopPresenceHeartbeat(user.id); };
  }, []);

  async function initializePage() {
    try {
      setLoading(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) { 
        router.push("/"); 
        return; 
      }
      
      setUser(session.user);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error("Profile fetch error:", profileError);
      }
      
      setProfile(profileData || null);

      if (profileData?.role === "admin") { 
        router.push("/admin"); 
        return; 
      }

      await startPresenceHeartbeat(session.user.id);

      const days = getLast7Days();
      const today = days[days.length - 1].date;
      setCurrentDays(days);
      setSelectedDate(today);

      await loadDatabaseData(session.user.id, days);

      const hasLogged = await HealthService.hasLoggedToday(session.user.id);
      setShowQuestions(!hasLogged);
      setLoading(false);
    } catch (err) {
      console.error("Error initializing page:", err);
      router.push("/");
    }
  }

  async function loadDatabaseData(userId, days) {
    try {
      const logs = await HealthService.getLast7DaysLogs(userId);
      const newDailyData = {};
      logs.forEach((log) => {
        newDailyData[log.log_date] = {
          mood: log.mood_score ?? 7,
          sleep: log.sleep_score ?? 7,
          energy: log.energy_score ?? 7,
          nutrition: log.nutrition_score ?? 7,
          exercise: log.exercise_minutes ?? 35,
          healthScore: log.overall_score ?? 75,
          water: log.water_glasses ?? 8,
          meals: log.meals_count ?? 3,
        };
      });
      days.forEach((day) => {
        if (!newDailyData[day.date])
          newDailyData[day.date] = { mood:7, sleep:7, energy:7, nutrition:7, exercise:35, healthScore:75, water:8, meals:3 };
      });
      setDailyData(newDailyData);
    } catch (err) { console.error("Error loading database data:", err); }
  }

  const handleLogout = async () => {
    if (logoutLoading) return;
    setLogoutLoading(true);
    try {
      if (user?.id) await stopPresenceHeartbeat(user.id);
      await supabase.auth.signOut();
    } catch (e) { console.error("Logout error:", e); }
    finally { router.push("/"); }
  };

  const questions = [
    { id:1, question:"How are you feeling today?", type:"mood", options:[{emoji:"😢",text:"Bad",value:3},{emoji:"😐",text:"Okay",value:6},{emoji:"😊",text:"Good",value:8},{emoji:"🤩",text:"Excellent",value:10}] },
    { id:2, question:"How was your sleep quality?", type:"sleep", options:[{emoji:"😴",text:"Poor",value:4},{emoji:"🛌",text:"Average",value:7},{emoji:"💤",text:"Good",value:9},{emoji:"🌟",text:"Excellent",value:10}] },
    { id:3, question:"What's your energy level today?", type:"energy", options:[{emoji:"😫",text:"Low",value:4},{emoji:"😌",text:"Medium",value:7},{emoji:"💪",text:"Good",value:9},{emoji:"⚡️",text:"High",value:10}] },
    { id:4, question:"How many minutes did you exercise today?", type:"exercise", options:[{emoji:"🚶",text:"0-15 min",value:15},{emoji:"🏃",text:"16-30 min",value:30},{emoji:"💪",text:"31-45 min",value:45},{emoji:"🔥",text:"45+ min",value:60}] },
    { id:5, question:"How was your food intake today?", type:"nutrition", options:[{emoji:"🍔",text:"Unhealthy",value:4},{emoji:"🥗",text:"Average",value:7},{emoji:"🍎",text:"Healthy",value:9},{emoji:"🌈",text:"Excellent",value:10}] },
    { id:6, question:"How many glasses of water did you drink?", type:"water", options:[{emoji:"🥤",text:"0-3",value:3},{emoji:"💧",text:"4-6",value:6},{emoji:"🚰",text:"7-9",value:9},{emoji:"🌊",text:"10+",value:10}] },
    { id:7, question:"How many meals did you have today?", type:"meals", options:[{emoji:"🍽️",text:"1 meal",value:1},{emoji:"🥪",text:"2 meals",value:2},{emoji:"🍛",text:"3 meals",value:3},{emoji:"🍱",text:"4+ meals",value:4}] },
  ];

  const getCurrentDayData = () => dailyData[selectedDate] || { mood:7,sleep:7,energy:7,nutrition:7,exercise:35,healthScore:75,water:8,meals:3 };
  const currentData = getCurrentDayData();
  const getSelectedHealthScore = () => dailyData[selectedDate]?.healthScore ?? 75;

  const radarData = [
    { subject:"Mood", A: currentData.mood * 10, fullMark:100 },
    { subject:"Sleep", A: currentData.sleep * 10, fullMark:100 },
    { subject:"Energy", A: currentData.energy * 10, fullMark:100 },
    { subject:"Nutrition", A: currentData.nutrition * 10, fullMark:100 },
    { subject:"Exercise", A: currentData.exercise, fullMark:100 },
  ];

  const moodData = currentDays.map((day) => ({
    day: `${day.month} ${day.day}`,
    shortDay: day.label,
    date: day.date,
    mood: dailyData[day.date]?.mood ?? 7,
    isToday: day.isToday,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const found = moodData.find((d) => d.day === label || d.shortDay === label);
    const dayData = found ? dailyData[found.date] : null;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
        <p className="text-sm font-semibold text-gray-800">{found?.day || label}</p>
        <p className="text-sm text-indigo-600">Mood: <span className="font-semibold">{payload[0].value}/10</span></p>
        {dayData && (
          <>
            <p className="text-sm text-blue-500">Sleep: {dayData.sleep}/10</p>
            <p className="text-sm text-yellow-500">Energy: {dayData.energy}/10</p>
          </>
        )}
      </div>
    );
  };

  const containerVariants = { hidden:{ opacity:0 }, visible:{ opacity:1, transition:{ staggerChildren:0.1 } } };
  const itemVariants = { hidden:{ opacity:0, y:20 }, visible:{ opacity:1, y:0, transition:{ duration:0.5 } } };
  const cardVariants = { hidden:{ opacity:0, scale:0.8 }, visible:{ opacity:1, scale:1, transition:{ duration:0.4 } }, hover:{ scale:1.02, transition:{ duration:0.2 } } };

  const finishAndSave = async (newAnswers) => {
    try {
      setLoading(true);
      await HealthService.saveDailyLog(user.id, {
        mood: Number(newAnswers.mood || 7),
        sleep: Number(newAnswers.sleep || 7),
        energy: Number(newAnswers.energy || 7),
        exercise: Number(newAnswers.exercise || 0),
        nutrition: Number(newAnswers.nutrition || 7),
        water: newAnswers.water === 10 ? 10 : Number(newAnswers.water || 0),
        meals: Number(newAnswers.meals || 0) >= 4 ? 4 : Number(newAnswers.meals || 0),
      });
      const days = getLast7Days();
      setCurrentDays(days);
      setSelectedDate(days[days.length - 1].date);
      await loadDatabaseData(user.id, days);
      setShowQuestions(false); setAnswers({}); setCurrentQuestion(0);
      setLoading(false);
    } catch (err) {
      console.error("Error saving data:", err);
      setLoading(false);
      alert("Error saving your data. Please try again.");
    }
  };

  const handleAnswer = async (value, type) => {
    const newAnswers = { ...answers, [type]: value };
    setAnswers(newAnswers);
    if (currentQuestion < questions.length - 1) setCurrentQuestion(currentQuestion + 1);
    else await finishAndSave(newAnswers);
  };

  const LoadingOverlay = () => (
    <AnimatePresence>
      {(loading || logoutLoading) && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/25" />
          <motion.div initial={{ scale:0.92, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.92, opacity:0 }}
            className="relative bg-white rounded-2xl shadow-xl px-8 py-7 flex flex-col items-center gap-4">
            <div className="w-14 h-14 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-800">
                {logoutLoading ? "Signing you out" : "Preparing your dashboard"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {logoutLoading ? "Please wait a moment…" : "Loading your latest health data…"}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (showQuestions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <LoadingOverlay />
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-2xl font-bold text-gray-800 mb-2">HealthSight</div>
            <div className="text-gray-600">Let's learn about your health today</div>
          </div>
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Progress</span>
              <span>{currentQuestion + 1} / {questions.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
            </div>
          </div>
          <div className="text-center mb-8">
            <div className="text-xl font-semibold text-gray-800 mb-4">
              {questions[currentQuestion].question}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {questions[currentQuestion].options.map((option, index) => (
                <button key={index}
                  onClick={() => handleAnswer(option.value, questions[currentQuestion].type)}
                  className="flex flex-col items-center p-4 border-2 border-gray-100 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-200">
                  <span className="text-3xl mb-2">{option.emoji}</span>
                  <span className="text-sm font-medium text-gray-700">{option.text}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="text-center text-sm text-gray-500">
            Choose the answer that best describes your day
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      <LoadingOverlay />

      <Header
        profile={profile}
        user={user}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
        showAssistantBtn={false}
        showBackBtn={false}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-8">
        {/* Header section with title and assistant button */}
        <div className="flex flex-row items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">Your Daily Statistics</h2>
            <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">{formatMonthYear(selectedDate || new Date().toISOString())}</p>
          </div>
          
          {/* Assistant Button */}
          <button
            onClick={() => router.push("/assistant")}
            className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 hover:shadow-lg transition-all duration-300"
            aria-label="Open AI Assistant"
            title="AI Assistant"
          >
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="8" width="14" height="10" rx="2" fill="white" stroke="white" strokeWidth="1.2" />
              <circle cx="9.5" cy="12.5" r="1" fill="#6366F1" />
              <circle cx="14.5" cy="12.5" r="1" fill="#6366F1" />
              <path d="M9 16H15" stroke="#6366F1" strokeWidth="1.2" strokeLinecap="round" />
              <rect x="10.5" y="5" width="3" height="3" rx="0.8" fill="#C7D2FE" stroke="#6366F1" strokeWidth="0.8" />
            </svg>
          </button>
        </div>

        {/* Days row */}
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-3 mb-5 sm:mb-6 pt-2">
          {currentDays.map((day) => (
            <button 
              key={day.date} 
              onClick={() => setSelectedDate(day.date)}
              className={`snap-center relative flex-none w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center text-xs shadow-sm transition-all ${
                selectedDate === day.date ? "bg-white border-2 border-indigo-200 text-slate-900 shadow-md" : "bg-gray-100 text-gray-500"
              } ${day.isToday ? "ring-2 ring-green-400" : ""}`}
            >
              <span className="text-sm sm:text-base font-bold">{day.day}</span>
              <span className="text-[10px] sm:text-xs mt-0.5">{day.label}</span>
              {day.isToday && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-12">

          {/* Overall Score Card */}
          <div className="md:col-span-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 shadow-sm mb-4 sm:mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">
                  <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-pink-400" />
                  Overall Health Score — {formatDisplayDate(selectedDate)}
                </div>
                <div className="text-3xl sm:text-5xl font-extrabold text-green-500 mb-1 sm:mb-2">
                  {getSelectedHealthScore()}
                </div>
                <div className="text-base sm:text-lg font-semibold text-gray-800 mb-0.5 sm:mb-1">
                  {getSelectedHealthScore() >= 90 ? "Excellent" : getSelectedHealthScore() >= 80 ? "Very Good" : getSelectedHealthScore() >= 70 ? "Good" : "Needs Improvement"}
                </div>
                <p className="text-xs text-gray-500">
                  {selectedDate === currentDays[currentDays.length - 1]?.date ? "Based on your daily assessment" : "Historical data"}
                </p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-50 rounded-full">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 12l4 4 8-8 6 6" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="md:col-span-12 bg-white rounded-xl p-4 sm:p-6 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-pink-500" />
                    <div className="text-xs sm:text-sm font-medium text-gray-700">Mood</div>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-gray-900">{currentData.mood}/10</div>
                </div>
                <div className="w-full h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-500 rounded-full" style={{ width: `${currentData.mood * 10}%` }} />
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500" />
                    <div className="text-xs sm:text-sm font-medium text-gray-700">Sleep</div>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-gray-900">{currentData.sleep}/10</div>
                </div>
                <div className="w-full h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${currentData.sleep * 10}%` }} />
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500" />
                    <div className="text-xs sm:text-sm font-medium text-gray-700">Energy</div>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-gray-900">{currentData.energy}/10</div>
                </div>
                <div className="w-full h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${currentData.energy * 10}%` }} />
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500" />
                    <div className="text-xs sm:text-sm font-medium text-gray-700">Exercise</div>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-gray-900">{currentData.exercise} min</div>
                </div>
                <div className="w-full h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, (currentData.exercise / 60) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="md:col-span-12 lg:col-span-4 bg-white rounded-xl p-4 sm:p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">Mental Health Radar</h3>
            <p className="text-xs text-gray-500 mb-3 sm:mb-4">Your current mental wellness profile</p>
            <div className="w-full h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#6B7280" }} />
                  <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fontSize: 9, fill: "#9CA3AF" }} />
                  <Radar name="Mental Health" dataKey="A" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.3} strokeWidth={1.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line Chart */}
          <div className="md:col-span-12 lg:col-span-5 bg-white rounded-xl p-4 sm:p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">7-Day Mood Trend</h3>
            <p className="text-xs text-gray-500 mb-3 sm:mb-4">Your mood over the past week</p>
            <div className="w-full h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="shortDay" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis domain={[0,10]} tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={25} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="mood" stroke="#4F46E5" strokeWidth={2} dot={{ fill: "#4F46E5", strokeWidth: 1.5, r: 3 }} activeDot={{ r: 5, fill: "#4F46E5" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Habits Tracker */}
          <div className="md:col-span-12 lg:col-span-3 bg-white rounded-xl p-4 sm:p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">Daily Habits Tracker</h3>
            <p className="text-xs text-gray-500 mb-3 sm:mb-4">Monitor your physical health habits</p>
            
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <div className="text-xs sm:text-sm font-medium text-gray-700">Water Intake</div>
                <div className="text-xs sm:text-sm font-semibold text-gray-900">{currentData.water} glasses</div>
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">Goal: 10 glasses/day</div>
              <div className="w-full h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (currentData.water / 10) * 100)}%` }} />
              </div>
            </div>

            <div className="mb-3 sm:mb-4">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <div className="text-xs sm:text-sm font-medium text-gray-700">Exercise</div>
                <div className="text-xs sm:text-sm font-semibold text-gray-900">{currentData.exercise} min</div>
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">Goal: 60 min/day</div>
              <div className="w-full h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, (currentData.exercise / 60) * 100)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <div className="text-xs sm:text-sm font-medium text-gray-700">Meals</div>
                <div className="text-xs sm:text-sm font-semibold text-gray-900">{currentData.meals} meals</div>
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">Goal: 4 meals/day</div>
              <div className="w-full h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(currentData.meals / 4) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}