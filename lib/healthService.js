import { supabase } from "./supabaseClient";

export const HealthService = {
  // تحقق إذا كان المستخدم قد سجل بيانات اليوم
  async hasLoggedToday(userId) {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("health_daily_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("log_date", today)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking daily log:", error);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error("Error in hasLoggedToday:", err);
      return false;
    }
  },

  // حفظ البيانات اليومية
  async saveDailyLog(userId, answers) {
    try {
      const today = new Date().toISOString().split("T")[0];

      const logData = {
        user_id: userId,
        log_date: today,
        mood_score: answers.mood || 5,
        sleep_score: answers.sleep || 5,
        energy_score: answers.energy || 5,
        nutrition_score: answers.nutrition || 5,
        exercise_minutes: answers.exercise || 0,
        water_glasses: answers.water || 0,
        meals_count: answers.meals || 0,
      };

      console.log("📤 Saving daily log to database:", logData);

      const { data, error } = await supabase
        .from("health_daily_logs")
        .upsert([logData], {
          onConflict: "user_id,log_date",
        })
        .select();

      if (error) {
        console.error("❌ Error saving daily log:", error);
        throw error;
      }

      console.log("✅ Daily log saved successfully:", data);
      return data?.[0] || null;
    } catch (err) {
      console.error("❌ Error in saveDailyLog:", err);
      throw err;
    }
  },

  // جلب بيانات يوم محدد
  async getDailyLog(userId, date) {
    try {
      const { data, error } = await supabase
        .from("health_daily_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("log_date", date)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching daily log:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("Error in getDailyLog:", err);
      return null;
    }
  },

  // جلب بيانات آخر 7 أيام
  async getLast7DaysLogs(userId) {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const startDate = sevenDaysAgo.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("health_daily_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("log_date", startDate)
        .order("log_date", { ascending: true });

      if (error) {
        console.error("Error fetching last 7 days logs:", error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error("Error in getLast7DaysLogs:", err);
      return [];
    }
  },
};
