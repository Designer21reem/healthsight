"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function UsersPanel() {
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [presenceMap, setPresenceMap] = useState({}); // user_id -> {is_online,last_seen_at}
  const [avgScoreMap, setAvgScoreMap] = useState({});
  const [loading, setLoading] = useState(true);

  function timeAgo(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    if (diffMs < 60_000) return "Just now";
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }

  async function fetchProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, governorate, role, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch profiles error:", error);
      return [];
    }
    return data || [];
  }

  async function fetchPresence(userIds) {
    if (!userIds.length) return {};
    const { data, error } = await supabase
      .from("user_presence_last_seen")
      .select("user_id, is_online, last_seen_at, updated_at")
      .in("user_id", userIds);

    if (error) {
      console.error("Fetch presence error:", error);
      return {};
    }

    const map = {};
    for (const r of data || []) {
      map[r.user_id] = {
        is_online: !!r.is_online,
        last_seen_at: r.last_seen_at || r.updated_at,
      };
    }
    return map;
  }

  async function fetchAvgScorePerUser(userIds) {
    if (!userIds.length) return {};

    const { data, error } = await supabase
      .from("health_daily_logs")
      .select("user_id, overall_score")
      .in("user_id", userIds);

    if (error) {
      console.error("Fetch avg score error:", error);
      return {};
    }

    const sums = {};
    const counts = {};
    for (const r of data || []) {
      const v = Number(r.overall_score);
      if (Number.isNaN(v)) continue;
      sums[r.user_id] = (sums[r.user_id] || 0) + v;
      counts[r.user_id] = (counts[r.user_id] || 0) + 1;
    }

    const avgMap = {};
    for (const uid of Object.keys(sums)) {
      avgMap[uid] = Math.round(sums[uid] / Math.max(1, counts[uid]));
    }
    return avgMap;
  }

  async function refreshAll() {
    setLoading(true);

    const profs = await fetchProfiles();
    setProfiles(profs);

    const ids = profs.map((p) => p.id);

    const pres = await fetchPresence(ids);
    setPresenceMap(pres);

    const avgMap = await fetchAvgScorePerUser(ids);
    setAvgScoreMap(avgMap);

    setLoading(false);
  }

  useEffect(() => {
    refreshAll();

    const ch1 = supabase
      .channel("rt_profiles_admin_users")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => refreshAll())
      .subscribe();

    const ch2 = supabase
      .channel("rt_health_logs_admin_users")
      .on("postgres_changes", { event: "*", schema: "public", table: "health_daily_logs" }, () => refreshAll())
      .subscribe();

    const ch3 = supabase
      .channel("rt_presence_admin_users")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence_last_seen" }, () => refreshAll())
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
      supabase.removeChannel(ch3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const users = useMemo(() => {
    return (profiles || []).map((p) => {
      const pres = presenceMap[p.id] || {};
      const score = avgScoreMap[p.id] ?? 0;

      return {
        id: p.id,
        name: p.full_name || "—",
        email: p.email || "—",
        location: p.governorate || "—",
        role: p.role || "user",
        joinDate: p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : "—",
        isOnline: !!pres.is_online,
        lastSeen: pres.last_seen_at ? timeAgo(pres.last_seen_at) : "—",
        score,
      };
    });
  }, [profiles, presenceMap, avgScoreMap]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.location || "").toLowerCase().includes(q)
    );
  }, [users, query]);

  const totalUsers = users.length;
  const onlineNow = users.filter((u) => u.isOnline).length;
  const avgScore = Math.round(users.reduce((s, u) => s + (u.score || 0), 0) / Math.max(1, users.length));

  const scoreLabel = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 50) return "Fair";
    return "Poor";
  };

  return (
    <section>
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">User Management</h3>
            <p className="text-sm text-gray-600 mt-2">Monitor and manage registered users</p>
          </div>

          <div className="w-full md:w-72">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users by name, email, location..."
              className="w-full rounded-md border px-3 py-2 text-sm placeholder:text-gray-400"
              aria-label="Search users"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            Total Users<br />
            <span className="text-2xl font-bold">{totalUsers}</span>
          </div>

          <div className="rounded-lg border p-4">
            Online Now<br />
            <span className="text-2xl font-bold text-green-600">{onlineNow}</span>
          </div>

          <div className="rounded-lg border p-4">
            Avg Health Score<br />
            <span className="text-2xl font-bold text-orange-600">{avgScore}</span>
          </div>

          <div className="rounded-lg border p-4">
            Engagement Rate<br />
            <span className="text-2xl font-bold text-indigo-600">
              {totalUsers ? Math.round((onlineNow / totalUsers) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="mt-6 overflow-auto">
          {loading ? (
            <div className="text-sm text-gray-600 p-4">Loading users...</div>
          ) : (
            <table className="w-full table-auto text-sm min-w-[900px]">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Join Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Last seen</th>
                  <th className="p-3">Health Score</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-gray-500">{(u.role || "user").toLowerCase()}</div>
                    </td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">{u.location}</td>
                    <td className="p-3">{u.joinDate}</td>

                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${
                          u.isOnline ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${u.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                        {u.isOnline ? "Online" : "Offline"}
                      </span>
                    </td>

                    <td className="p-3">{u.lastSeen}</td>

                    <td className="p-3 w-56">
                      <div>
                        <div
                          className="relative h-6 w-full bg-gray-100 rounded-full overflow-hidden"
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={u.score}
                        >
                          <div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{
                              width: `${Math.max(0, Math.min(100, u.score))}%`,
                              background:
                                u.score >= 90
                                  ? "#10B981"
                                  : u.score >= 75
                                  ? "#60A5FA"
                                  : u.score >= 50
                                  ? "#F59E0B"
                                  : "#EF4444",
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-sm font-medium text-white">{u.score}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{scoreLabel(u.score)}</div>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-sm text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
