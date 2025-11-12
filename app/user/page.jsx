"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Responsive HealthSight user dashboard (Next.js + Tailwind)
 * Place this file at: app/user/page.js
 *
 * Tailwind must be configured in the project (tailwind.config.js + globals.css)
 */

export default function UserPage() {
  const router = useRouter();
  const [showQuestions, setShowQuestions] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [healthScore, setHealthScore] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dailyData, setDailyData] = useState({});
  const [currentDays, setCurrentDays] = useState([]);

  // توليد التواريخ الحقيقية لآخر 7 أيام - تتغير يومياً
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      days.push({
        date: date.toISOString().split('T')[0],
        day: date.getDate(),
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        isToday: i === 0,
        isYesterday: i === 1,
        fullDate: date
      });
    }
    return days;
  };

  // تحديث الأيام عندما يتغير التاريخ
  useEffect(() => {
    const days = getLast7Days();
    setCurrentDays(days);
    setSelectedDate(days[days.length - 1].date); // اليوم الحالي
    
    // تحميل البيانات المحفوظة من localStorage
    const savedData = localStorage.getItem('healthSightData');
    if (savedData) {
      setDailyData(JSON.parse(savedData));
    } else {
      // إذا لم توجد بيانات محفوظة، نولد بيانات عشوائية للأيام السابقة
      setDailyData(generateHistoricalData(days));
    }
  }, []);

  const questions = [
    {
      id: 1,
      question: "How are you feeling today?",
      type: "mood",
      options: [
        { emoji: "😢", text: "Bad", value: 3 },
        { emoji: "😐", text: "Okay", value: 6 },
        { emoji: "😊", text: "Good", value: 8 },
        { emoji: "🤩", text: "Excellent", value: 10 }
      ]
    },
    {
      id: 2,
      question: "How was your sleep quality?",
      type: "sleep",
      options: [
        { emoji: "😴", text: "Poor", value: 4 },
        { emoji: "🛌", text: "Average", value: 7 },
        { emoji: "💤", text: "Good", value: 9 },
        { emoji: "🌟", text: "Excellent", value: 10 }
      ]
    },
    {
      id: 3,
      question: "What's your energy level today?",
      type: "energy",
      options: [
        { emoji: "😫", text: "Low", value: 4 },
        { emoji: "😌", text: "Medium", value: 7 },
        { emoji: "💪", text: "Good", value: 9 },
        { emoji: "⚡️", text: "High", value: 10 }
      ]
    },
    {
      id: 4,
      question: "How many minutes did you exercise today?",
      type: "exercise",
      options: [
        { emoji: "🚶", text: "0-15 min", value: 5 },
        { emoji: "🏃", text: "16-30 min", value: 7 },
        { emoji: "💪", text: "31-45 min", value: 9 },
        { emoji: "🔥", text: "45+ min", value: 10 }
      ]
    },
    {
      id: 5,
      question: "How was your food intake today?",
      type: "nutrition",
      options: [
        { emoji: "🍔", text: "Unhealthy", value: 4 },
        { emoji: "🥗", text: "Average", value: 7 },
        { emoji: "🍎", text: "Healthy", value: 9 },
        { emoji: "🌈", text: "Excellent", value: 10 }
      ]
    }
  ];
  // بيانات عشوائية للأيام السابقة (للمحاكاة)
  const generateHistoricalData = (days) => {
    const historicalData = {};
    
    days.forEach((day) => {
      if (!day.isToday) {
        // بيانات عشوائية للأيام السابقة
        historicalData[day.date] = {
          mood: Math.floor(Math.random() * 4) + 6, // 6-9
          sleep: Math.floor(Math.random() * 4) + 6,
          energy: Math.floor(Math.random() * 4) + 6,
          exercise: Math.floor(Math.random() * 30) + 30, // 30-59
          nutrition: Math.floor(Math.random() * 4) + 6,
          healthScore: Math.floor(Math.random() * 20) + 70 // 70-89
        };
      }
    });
    
    return historicalData;
  };

  const handleAnswer = (value, type) => {
    const newAnswers = { ...answers, [type]: value };
    setAnswers(newAnswers);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // حساب النتيجة النهائية وحفظ بيانات اليوم
      const totalScore = Object.values(newAnswers).reduce((sum, score) => sum + score, 0);
      const averageScore = Math.round((totalScore / questions.length) * 8.6);
      setHealthScore(averageScore);
      
      // حفظ بيانات اليوم الحالي
      const todayData = {
        mood: newAnswers.mood ?? 7,
        sleep: newAnswers.sleep ?? 7,
        energy: newAnswers.energy ?? 7,
        exercise: newAnswers.exercise ? Math.round(newAnswers.exercise * 5) : 35,
        nutrition: newAnswers.nutrition ?? 7,
        healthScore: averageScore,
        timestamp: new Date().toISOString()
      };
      
      const today = currentDays[currentDays.length - 1].date;
      const newDailyData = {
        ...dailyData,
        [today]: todayData
      };
      
      setDailyData(newDailyData);
      
      // حفظ البيانات في localStorage
      localStorage.setItem('healthSightData', JSON.stringify(newDailyData));
      
      setShowQuestions(false);
    }
  };

  const getCurrentDayData = () => {
    const selectedDayData = dailyData[selectedDate];
    if (selectedDayData) {
      return selectedDayData;
    }
    
    // إذا لم توجد بيانات، نعيد بيانات افتراضية
    return {
      mood: 7,
      sleep: 7,
      energy: 7,
      exercise: 35,
      nutrition: 7,
      healthScore: 75
    };
  };

  const currentData = getCurrentDayData();

  // بيانات الرادار تشارت بناءً على اليوم المحدد
  const radarData = [
    { subject: 'Mood', A: currentData.mood * 10, fullMark: 100 },
    { subject: 'Sleep', A: currentData.sleep * 10, fullMark: 100 },
    { subject: 'Energy', A: currentData.energy * 10, fullMark: 100 },
    { subject: 'Nutrition', A: currentData.nutrition * 10, fullMark: 100 },
    { subject: 'Exercise', A: currentData.exercise, fullMark: 100 },
  ];

  // بيانات خط المزاج لآخر 7 أيام
  const moodData = currentDays.map(day => {
    const dayData = dailyData[day.date];
    return {
      day: `${day.month} ${day.day}`,
      date: day.date,
      mood: dayData ? dayData.mood : Math.floor(Math.random() * 3) + 6,
      fullDate: day.date,
      isToday: day.isToday
    };
  });

  // الحصول على الـ health score للتاريخ المحدد
  const getSelectedHealthScore = () => {
    const selectedDayData = dailyData[selectedDate];
    return selectedDayData ? selectedDayData.healthScore : healthScore;
  };
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dayData = dailyData[moodData.find(d => d.day === label)?.date];
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
              <p className="text-sm text-yellow-500">Energy: {dayData.energy}/10</p>
            </>
          )}
        </motion.div>
      );
    }
    return null;
  };

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4
      }
    },
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2
      }
    }
  };

  // تنسيق التاريخ لعرضه بشكل جميل
  const formatDisplayDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (showQuestions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
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
              <span>{currentQuestion + 1} / {questions.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
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
                  onClick={() => handleAnswer(option.value, questions[currentQuestion].type)}
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
                  <span className="text-sm font-medium text-gray-700">{option.text}</span>
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

  // الصفحة الرئيسية بعد الانتهاء من الأسئلة
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 bg-white border-b border-gray-200"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between h-20">
            {/* brand */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4"
            >
              <div className="text-2xl font-extrabold">
                <span className="text-blue-600">Health</span>
                <span className="text-slate-800 ml-1">Sight</span>
              </div>
            </motion.div>

            {/* center spacer to keep alignment like design */}
            <div className="flex-1 hidden md:block" />

            {/* right: user / robot / notifications */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4"
            >
              {/* user block */}
              <div className="flex items-center gap-3 pr-4 border-r border-gray-100">
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm"
                >
                  NA
                </motion.div>
                <div className="hidden md:flex flex-col">
                  <span className="text-sm font-semibold">Noor Ahmed</span>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">User</span>
                </div>
              </div>
              {/* robot assistant icon */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                aria-label="ai-assistant"
                title="AI Assistant"
                className="relative flex items-center justify-center w-11 h-11 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 hover:shadow-md border border-indigo-100"
                onClick={() => router.push("/assistant")}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="7" width="16" height="10" rx="2" fill="#EEF2FF" stroke="#6366F1" strokeWidth="1.2"/>
                  <circle cx="9" cy="11" r="1" fill="#4F46E5"/>
                  <circle cx="15" cy="11" r="1" fill="#4F46E5"/>
                  <path d="M8 17H16" stroke="#6366F1" strokeWidth="1.2" strokeLinecap="round"/>
                  <rect x="10" y="4" width="4" height="3" rx="1" fill="#C7D2FE" stroke="#6366F1" strokeWidth="0.8"/>
                </svg>
              </motion.button>

              {/* notifications */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="notifications"
                title="Notifications"
                className="relative flex items-center justify-center w-11 h-11 rounded-lg bg-white border border-gray-100 hover:bg-gray-50"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" 
                        stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" 
                        stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="18" cy="6" r="3" fill="#EF4444" stroke="white" strokeWidth="1"/>
                </svg>
              </motion.button>

              {/* mobile menu removed */}
          
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
          <motion.h2 className="text-lg font-semibold">Your Daily Statistics</motion.h2>
          <div className="text-sm text-gray-500">
            {formatMonthYear(selectedDate || new Date().toISOString())}
          </div>
        </motion.div>
        {/* Days row - تواريخ حقيقية وديناميكية */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          /* أضفت padding-top لرفع المسافة وتحريك الدواير إلى الأسفل قليلاً */
          className="flex gap-3 overflow-x-auto pb-3 mb-6 pt-3"
        >
          {currentDays.map((day, i) => (
            <motion.button
              key={day.date}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDate(day.date)}
              /* أضفت relative حتى يعمل البادج (النقطة) بشكل صحيح */
              className={`relative flex-none w-14 h-14 rounded-full flex flex-col items-center justify-center text-xs shadow-sm transition-all ${
                selectedDate === day.date
                  ? "bg-white border-2 border-indigo-200 text-slate-900 shadow-md"
                  : "bg-gray-100 text-gray-500"
              } ${day.isToday ? 'ring-2 ring-green-400' : ''}`}
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

        {/* Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-6 md:grid-cols-12"
        >
          {/* Overall Health Score */}
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
                  transition={{ delay: 0.6, type: "spring" }}
                  className="text-5xl font-extrabold text-green-500 mb-2"
                >
                  {getSelectedHealthScore()}
                </motion.div>
                <div className="text-lg font-semibold text-gray-800 mb-1">
                  {getSelectedHealthScore() >= 90 ? "Excellent" : getSelectedHealthScore() >= 80 ? "Very Good" : getSelectedHealthScore() >= 70 ? "Good" : "Needs Improvement"}
                </div>
                <p className="text-sm text-gray-500">
                  {selectedDate === currentDays[currentDays.length - 1].date 
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
                  <path d="M3 12l4 4 8-8 6 6" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
              <Metric title="Mood" value={`${currentData.mood}/10`} color="bg-pink-500" progress={currentData.mood * 10} />
              <Metric title="Sleep" value={`${currentData.sleep}/10`} color="bg-blue-500" progress={currentData.sleep * 10} />
              <Metric title="Energy" value={`${currentData.energy}/10`} color="bg-yellow-500" progress={currentData.energy * 10} />
              <Metric title="Exercise" value={`${currentData.exercise} min`} color="bg-green-500" progress={currentData.exercise} />
            </div>
          </motion.section>

          {/* Lower row */}
          <motion.section
            variants={cardVariants}
            whileHover="hover"
            className="md:col-span-4 bg-white rounded-xl p-6 shadow-sm"
          >
            <h3 className="font-semibold text-gray-800 mb-2">Mental Health Radar</h3>
            <p className="text-sm text-gray-500 mb-4">Your current mental wellness profile</p>
            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
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

          <motion.section
            variants={cardVariants}
            whileHover="hover"
            className="md:col-span-5 bg-white rounded-xl p-6 shadow-sm"
          >
            <h3 className="font-semibold text-gray-800 mb-2">7-Day Mood Trend</h3>
            <p className="text-sm text-gray-500 mb-4">Your mood over the past week</p>
            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={false}
                  />
                  <YAxis 
                    domain={[0, 10]}
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    stroke="#4F46E5"
                    strokeWidth={2.5}
                    dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#4F46E5' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.section>
          <motion.section
            variants={cardVariants}
            whileHover="hover"
            className="md:col-span-3 bg-white rounded-xl p-6 shadow-sm"
          >
            <h3 className="font-semibold text-gray-800 mb-2">Daily Habits Tracker</h3>
            <p className="text-sm text-gray-500 mb-4">Monitor your physical health habits</p>
            <Habit name="Water Intake" value="8 glasses" goal="10 glasses/day" color="bg-blue-500" percent={80} />
            <Habit name="Exercise" value={`${currentData.exercise} min`} goal="60 min/day" color="bg-green-500" percent={Math.min(100, (currentData.exercise / 60) * 100)} />
            <Habit name="Meals" value="3 meals" goal="4 meals/day" color="bg-orange-500" percent={75} />
          </motion.section>
        </motion.div>
      </main>
    </div>
  );
}

/* Metric Component مع Animations */
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
          transition={{ delay: 0.3 }}
          className="text-lg font-bold text-gray-900"
        >
          {value}
        </motion.div>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, delay: 0.5 }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </motion.div>
  );
}

/* Habit Component مع Animations */
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
          transition={{ duration: 1, delay: 0.7 }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </motion.div>
  );
}

// تنسيق الشهر والسنة (ديناميكي)
function formatMonthYear(dateStr) {
  const d = new Date(dateStr);
  // يعرض اسم الشهر كامل والسنة، يتأقلم مع لغة المستخدم المتصفح
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}