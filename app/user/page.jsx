"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { HealthService } from "../../lib/healthService";

export default function UserPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [showQuestions, setShowQuestions] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});

  const [selectedDate, setSelectedDate] = useState(null);
  const [dailyData, setDailyData] = useState({});
  const [currentDays, setCurrentDays] = useState([]);

  // ✅ Presence refs
  const presenceIntervalRef = useRef(null);
  const isPresenceStartedRef = useRef(false);

  // --- Helpers ---
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

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  // ✅ Presence: upsert heartbeat
  const upsertPresence = async (userId, isOnline) => {
    if (!userId) return;

    const nowIso = new Date().toISOString();
    const payload = {
      user_id: userId,
      is_online: !!isOnline,
      last_seen_at: nowIso,
      updated_at: nowIso,
    };

    const { error } = await supabase
      .from("user_presence_last_seen")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      console.error("Presence upsert error:", error);
    }
  };

  const startPresenceHeartbeat = async (userId) => {
    if (!userId) return;
    if (isPresenceStartedRef.current) return;
    isPresenceStartedRef.current = true;

    await upsertPresence(userId, true);

    presenceIntervalRef.current = setInterval(() => {
      upsertPresence(userId, true);
    }, 60 * 1000);

    const handleBeforeUnload = () => {
      upsertPresence(userId, false);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    startPresenceHeartbeat._cleanup = () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  };

  const stopPresenceHeartbeat = async (userId) => {
    try {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
        presenceIntervalRef.current = null;
      }
      if (startPresenceHeartbeat._cleanup) startPresenceHeartbeat._cleanup();
      await upsertPresence(userId, false);
    } catch (e) {
      console.error("stopPresenceHeartbeat error:", e);
    } finally {
      isPresenceStartedRef.current = false;
    }
  };

  useEffect(() => {
    initializePage();

    return () => {
      if (user?.id) stopPresenceHeartbeat(user.id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initializePage() {
    try {
      setLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        router.push("/");
        return;
      }

      setUser(session.user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData || null);

      if (profileData?.role === "admin") {
        router.push("/admin");
        return;
      }

      await startPresenceHeartbeat(session.user.id);

      const days = getLast7Days();
      setCurrentDays(days);

      const today = days[days.length - 1].date;
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
        if (!newDailyData[day.date]) {
          newDailyData[day.date] = {
            mood: 7,
            sleep: 7,
            energy: 7,
            nutrition: 7,
            exercise: 35,
            healthScore: 75,
            water: 8,
            meals: 3,
          };
        }
      });

      setDailyData(newDailyData);
    } catch (err) {
      console.error("Error loading database data:", err);
    }
  }

  // ✅ Questions
  const questions = [
    {
      id: 1,
      question: "How are you feeling today?",
      type: "mood",
      options: [
        { emoji: "😢", text: "Bad", value: 3 },
        { emoji: "😐", text: "Okay", value: 6 },
        { emoji: "😊", text: "Good", value: 8 },
        { emoji: "🤩", text: "Excellent", value: 10 },
      ],
    },
    {
      id: 2,
      question: "How was your sleep quality?",
      type: "sleep",
      options: [
        { emoji: "😴", text: "Poor", value: 4 },
        { emoji: "🛌", text: "Average", value: 7 },
        { emoji: "💤", text: "Good", value: 9 },
        { emoji: "🌟", text: "Excellent", value: 10 },
      ],
    },
    {
      id: 3,
      question: "What's your energy level today?",
      type: "energy",
      options: [
        { emoji: "😫", text: "Low", value: 4 },
        { emoji: "😌", text: "Medium", value: 7 },
        { emoji: "💪", text: "Good", value: 9 },
        { emoji: "⚡️", text: "High", value: 10 },
      ],
    },
    {
      id: 4,
      question: "How many minutes did you exercise today?",
      type: "exercise",
      options: [
        { emoji: "🚶", text: "0-15 min", value: 15 },
        { emoji: "🏃", text: "16-30 min", value: 30 },
        { emoji: "💪", text: "31-45 min", value: 45 },
        { emoji: "🔥", text: "45+ min", value: 60 },
      ],
    },
    {
      id: 5,
      question: "How was your food intake today?",
      type: "nutrition",
      options: [
        { emoji: "🍔", text: "Unhealthy", value: 4 },
        { emoji: "🥗", text: "Average", value: 7 },
        { emoji: "🍎", text: "Healthy", value: 9 },
        { emoji: "🌈", text: "Excellent", value: 10 },
      ],
    },
    {
      id: 6,
      question: "How many glasses of water did you drink today?",
      type: "water",
      options: [
        { emoji: "🥤", text: "0-3", value: 3 },
        { emoji: "💧", text: "4-6", value: 6 },
        { emoji: "🚰", text: "7-9", value: 9 },
        { emoji: "🌊", text: "10+", value: 10 },
      ],
    },
    {
      id: 7,
      question: "How many meals did you have today?",
      type: "meals",
      options: [
        { emoji: "🍽️", text: "1 meal", value: 1 },
        { emoji: "🥪", text: "2 meals", value: 2 },
        { emoji: "🍛", text: "3 meals", value: 3 },
        { emoji: "🍱", text: "4+ meals", value: 4 },
      ],
    },
  ];

  const getCurrentDayData = () => {
    const data = dailyData[selectedDate];
    if (data) return data;
    return {
      mood: 7,
      sleep: 7,
      energy: 7,
      nutrition: 7,
      exercise: 35,
      healthScore: 75,
      water: 8,
      meals: 3,
    };
  };

  const currentData = getCurrentDayData();

  const getSelectedHealthScore = () => {
    const selectedDayData = dailyData[selectedDate];
    return selectedDayData ? selectedDayData.healthScore : 75;
  };

  const radarData = [
    { subject: "Mood", A: currentData.mood * 10, fullMark: 100 },
    { subject: "Sleep", A: currentData.sleep * 10, fullMark: 100 },
    { subject: "Energy", A: currentData.energy * 10, fullMark: 100 },
    { subject: "Nutrition", A: currentData.nutrition * 10, fullMark: 100 },
    { subject: "Exercise", A: currentData.exercise, fullMark: 100 },
  ];

  const moodData = currentDays.map((day) => {
    const dayData = dailyData[day.date];
    return {
      day: `${day.month} ${day.day}`,
      date: day.date,
      mood: dayData ? dayData.mood : 7,
      isToday: day.isToday,
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const found = moodData.find((d) => d.day === label);
      const dayData = found ? dailyData[found.date] : null;

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm"
        >
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          <p className="text-sm text-indigo-600">
            Mood: <span className="font-semibold">{payload[0].value}/10</span>
          </p>
          {dayData && (
            <>
              <p className="text-sm text-blue-500">Sleep: {dayData.sleep}/10</p>
              <p className="text-sm text-yellow-500">
                Energy: {dayData.energy}/10
              </p>
              <p className="text-sm text-slate-500">
                Water: {dayData.water} • Meals: {dayData.meals}
              </p>
            </>
          )}
        </motion.div>
      );
    }
    return null;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
    hover: { scale: 1.02, transition: { duration: 0.2 } },
  };

  const handleLogout = async () => {
    try {
      if (user?.id) await stopPresenceHeartbeat(user.id);
      await supabase.auth.signOut();
    } finally {
      router.push("/");
    }
  };

  // ✅ Loading Overlay
  const LoadingOverlay = () => (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/25" />
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="relative bg-white rounded-2xl shadow-xl px-8 py-7 flex flex-col items-center gap-4"
          >
            <div className="w-14 h-14 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-800">
                Preparing your dashboard
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Loading your latest health data...
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const finishAndSave = async (newAnswers) => {
    try {
      setLoading(true);

      const exerciseMinutes = Number(newAnswers.exercise || 0);
      const waterGlasses =
        newAnswers.water === 10 ? 10 : Number(newAnswers.water || 0);
      const mealsCount =
        Number(newAnswers.meals || 0) >= 4 ? 4 : Number(newAnswers.meals || 0);

      await HealthService.saveDailyLog(user.id, {
        mood: Number(newAnswers.mood || 7),
        sleep: Number(newAnswers.sleep || 7),
        energy: Number(newAnswers.energy || 7),
        exercise: exerciseMinutes,
        nutrition: Number(newAnswers.nutrition || 7),
        water: waterGlasses,
        meals: mealsCount,
      });

      const days = getLast7Days();
      setCurrentDays(days);

      const today = days[days.length - 1].date;
      setSelectedDate(today);

      await loadDatabaseData(user.id, days);

      setShowQuestions(false);
      setAnswers({});
      setCurrentQuestion(0);

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

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      await finishAndSave(newAnswers);
    }
  };

  // --- UI ---
  if (showQuestions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <LoadingOverlay />

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-2xl font-bold text-gray-800 mb-2"
            >
              HealthSight
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600"
            >
              Let's learn about your health today
            </motion.div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Progress</span>
              <span>
                {currentQuestion + 1} / {questions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
                className="bg-green-500 h-2 rounded-full"
              />
            </div>
          </div>

          <div className="text-center mb-8">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-xl font-semibold text-gray-800 mb-4"
            >
              {questions[currentQuestion].question}
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-4"
            >
              {questions[currentQuestion].options.map((option, index) => (
                <motion.button
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    handleAnswer(option.value, questions[currentQuestion].type)
                  }
                  className="flex flex-col items-center p-4 border-2 border-gray-100 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-200"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-3xl mb-2"
                  >
                    {option.emoji}
                  </motion.span>
                  <span className="text-sm font-medium text-gray-700">
                    {option.text}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-sm text-gray-500"
          >
            Choose the answer that best describes your day
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      <LoadingOverlay />

      {/* Header (✅ fixed mobile layout) */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 bg-white border-b border-gray-200"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* ✅ Mobile: wrap + spacing, no overlap */}
          <div className="flex flex-wrap items-center justify-between gap-2 py-3 sm:h-20 sm:py-0">
            {/* Brand */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 min-w-[140px]"
            >
              <div className="text-xl sm:text-2xl font-extrabold leading-none">
                <span className="text-blue-600">Health</span>
                <span className="text-slate-800 ml-1">Sight</span>
              </div>
            </motion.div>

            {/* Right actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 sm:gap-4"
            >
              {/* Profile (✅ compact on mobile) */}
              <div className="flex items-center gap-2 pr-2 sm:pr-4 sm:border-r sm:border-gray-100">
                {profile ? (
                  <>
                    {profile.avatar_url ? (
                      <motion.img
                        whileHover={{ scale: 1.06 }}
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover"
                      />
                    ) : (
                      <motion.div
                        whileHover={{ scale: 1.06 }}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs sm:text-sm"
                      >
                        {profile.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "U"}
                      </motion.div>
                    )}

                    {/* ✅ hide text on mobile, show from sm */}
                    <div className="hidden sm:flex flex-col">
                      <span className="text-sm font-semibold">
                        {profile?.full_name}
                      </span>
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                        {profile?.role === "admin" ? "Admin" : "User"}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <motion.div
                      whileHover={{ scale: 1.06 }}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs sm:text-sm"
                    >
                      NA
                    </motion.div>
                    <div className="hidden sm:flex flex-col">
                      <span className="text-sm font-semibold">Guest</span>
                      <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full w-fit">
                        Visitor
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* ✅ Cute Chat Icon Button */}
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
                animate={{ y: [0, -4, 0], rotate: [0, 3, -3, 0] }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut",
                }}
                onClick={() => router.push("/assistant")}
                className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 hover:shadow-md border border-indigo-100"
                aria-label="Open AI Assistant"
                title="AI Assistant"
              >
                <motion.span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-indigo-500"
                  animate={{ scale: [1, 1.6, 1], opacity: [0.9, 0.35, 0.9] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  initial={{ scale: 0.95 }}
                  whileHover={{ scale: 1.06 }}
                  className="drop-shadow-sm"
                >
                  <rect
                    x="4"
                    y="7"
                    width="16"
                    height="10"
                    rx="2"
                    fill="#EEF2FF"
                    stroke="#6366F1"
                    strokeWidth="1.2"
                  />
                  <circle cx="9" cy="11" r="1" fill="#4F46E5" />
                  <circle cx="15" cy="11" r="1" fill="#4F46E5" />
                  <path
                    d="M8 17H16"
                    stroke="#6366F1"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <rect
                    x="10"
                    y="4"
                    width="4"
                    height="3"
                    rx="1"
                    fill="#C7D2FE"
                    stroke="#6366F1"
                    strokeWidth="0.8"
                  />
                </motion.svg>
              </motion.button>

              {/* Logout (✅ icon on mobile) */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleLogout}
                className="rounded-xl border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 transition-colors flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2"
                aria-label="Logout"
                title="Logout"
              >
                <span className="hidden sm:inline text-sm text-gray-600 hover:text-red-600">
                  Logout
                </span>
                <svg
                  className="sm:hidden"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 7V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-1"
                    stroke="#6B7280"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 12H3m0 0l3-3M3 12l3 3"
                    stroke="#6B7280"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-between mb-4"
        >
          <motion.h2 className="text-lg font-semibold">
            Your Daily Statistics
          </motion.h2>
          <div className="text-sm text-gray-500">
            {formatMonthYear(selectedDate || new Date().toISOString())}
          </div>
        </motion.div>

        {/* Days row */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex gap-3 overflow-x-auto pb-3 mb-6 pt-3"
        >
          {currentDays.map((day) => (
            <motion.button
              key={day.date}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDate(day.date)}
              className={`relative flex-none w-14 h-14 rounded-full flex flex-col items-center justify-center text-xs shadow-sm transition-all ${
                selectedDate === day.date
                  ? "bg-white border-2 border-indigo-200 text-slate-900 shadow-md"
                  : "bg-gray-100 text-gray-500"
              } ${day.isToday ? "ring-2 ring-green-400" : ""}`}
              aria-pressed={selectedDate === day.date}
            >
              <span className="text-sm font-bold">{day.day}</span>
              <span className="mt-0.5">{day.label}</span>
              {day.isToday && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
                />
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* (rest of your page stays the same) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-6 md:grid-cols-12"
        >
          {/* Overall Score */}
          <motion.section
            variants={cardVariants}
            whileHover="hover"
            className="md:col-span-12 bg-blue-50 rounded-xl p-6 shadow-sm mb-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <span className="w-3 h-3 rounded-full bg-pink-400" />
                  Overall Health Score - {formatDisplayDate(selectedDate)}
                </div>

                <motion.div
                  key={getSelectedHealthScore()}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="text-5xl font-extrabold text-green-500 mb-2"
                >
                  {getSelectedHealthScore()}
                </motion.div>

                <div className="text-lg font-semibold text-gray-800 mb-1">
                  {getSelectedHealthScore() >= 90
                    ? "Excellent"
                    : getSelectedHealthScore() >= 80
                    ? "Very Good"
                    : getSelectedHealthScore() >= 70
                    ? "Good"
                    : "Needs Improvement"}
                </div>

                <p className="text-sm text-gray-500">
                  {selectedDate === currentDays[currentDays.length - 1]?.date
                    ? "Based on your daily assessment"
                    : "Historical data"}
                </p>
              </div>

              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-center w-16 h-16 bg-green-50 rounded-full"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 12l4 4 8-8 6 6"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            </div>
          </motion.section>

          {/* Metrics */}
          <motion.section
            variants={cardVariants}
            className="md:col-span-12 bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Metric
                title="Mood"
                value={`${currentData.mood}/10`}
                color="bg-pink-500"
                progress={currentData.mood * 10}
              />
              <Metric
                title="Sleep"
                value={`${currentData.sleep}/10`}
                color="bg-blue-500"
                progress={currentData.sleep * 10}
              />
              <Metric
                title="Energy"
                value={`${currentData.energy}/10`}
                color="bg-yellow-500"
                progress={currentData.energy * 10}
              />
              <Metric
                title="Exercise"
                value={`${currentData.exercise} min`}
                color="bg-green-500"
                progress={Math.min(
                  100,
                  (Number(currentData.exercise || 0) / 60) * 100
                )}
              />
            </div>
          </motion.section>

          {/* Radar */}
          <motion.section
            variants={cardVariants}
            whileHover="hover"
            className="md:col-span-4 bg-white rounded-xl p-6 shadow-sm"
          >
            <h3 className="font-semibold text-gray-800 mb-2">
              Mental Health Radar
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Your current mental wellness profile
            </p>
            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                  />
                  <Radar
                    name="Mental Health"
                    dataKey="A"
                    stroke="#4F46E5"
                    fill="#4F46E5"
                    fillOpacity={0.3}
                    strokeWidth={1.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.section>

          {/* Line */}
          <motion.section
            variants={cardVariants}
            whileHover="hover"
            className="md:col-span-5 bg-white rounded-xl p-6 shadow-sm"
          >
            <h3 className="font-semibold text-gray-800 mb-2">7-Day Mood Trend</h3>
            <p className="text-sm text-gray-500 mb-4">
              Your mood over the past week
            </p>
            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    stroke="#4F46E5"
                    strokeWidth={2.5}
                    dot={{ fill: "#4F46E5", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#4F46E5" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.section>

          {/* Habits */}
          <motion.section
            variants={cardVariants}
            whileHover="hover"
            className="md:col-span-3 bg-white rounded-xl p-6 shadow-sm"
          >
            <h3 className="font-semibold text-gray-800 mb-2">
              Daily Habits Tracker
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Monitor your physical health habits
            </p>

            <Habit
              name="Water Intake"
              value={`${currentData.water} glasses`}
              goal="10 glasses/day"
              color="bg-blue-500"
              percent={Math.min(100, (Number(currentData.water || 0) / 10) * 100)}
            />

            <Habit
              name="Exercise"
              value={`${currentData.exercise} min`}
              goal="60 min/day"
              color="bg-green-500"
              percent={Math.min(
                100,
                (Number(currentData.exercise || 0) / 60) * 100
              )}
            />

            <Habit
              name="Meals"
              value={`${currentData.meals} meals`}
              goal="4 meals/day"
              color="bg-orange-500"
              percent={Math.min(100, (Number(currentData.meals || 0) / 4) * 100)}
            />
          </motion.section>
        </motion.div>
      </main>
    </div>
  );
}

/* Metric */
function Metric({ title, value, color = "bg-blue-500", progress = 60 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      className="bg-gray-50 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.span
            whileHover={{ scale: 1.2 }}
            className={`w-3 h-3 rounded-full ${color}`}
          />
          <div className="text-sm font-medium text-gray-700">{title}</div>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg font-bold text-gray-900"
        >
          {value}
        </motion.div>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, delay: 0.3 }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </motion.div>
  );
}

/* Habit */
function Habit({ name, value, goal, color = "bg-blue-500", percent = 50 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="mb-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-700">{name}</div>
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="text-sm font-semibold text-gray-900"
        >
          {value}
        </motion.div>
      </div>
      <div className="text-xs text-gray-500 mb-2">Goal: {goal}</div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, delay: 0.3 }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </motion.div>
  );
}

function formatMonthYear(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}
