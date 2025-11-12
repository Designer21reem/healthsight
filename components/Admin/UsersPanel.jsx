"use client"

import React, { useMemo, useState } from 'react';

export default function UsersPanel() {
  // sample users (random-ish names) — replace with real data later
  const sampleUsers = useMemo(() => [
    { id: 1, name: 'Aisha Al-Sayed', email: 'aisha.sayed@example.com', location: 'Baghdad', joinDate: '2025-01-12', lastActive: '2 hours ago', score: 92, active: true },
    { id: 2, name: 'Omar Khalil', email: 'omar.khalil@example.com', location: 'Mosul', joinDate: '2025-03-04', lastActive: '5 hours ago', score: 78, active: true },
    { id: 3, name: 'Lina Hassan', email: 'lina.hassan@example.com', location: 'Basra', joinDate: '2025-02-20', lastActive: '1 day ago', score: 65, active: false },
    { id: 4, name: 'Yousef Karim', email: 'yousef.karim@example.com', location: 'Karbala', joinDate: '2025-04-11', lastActive: '3 days ago', score: 48, active: false },
    { id: 5, name: 'Sara Mahmoud', email: 'sara.mahmoud@example.com', location: 'Erbil', joinDate: '2025-05-02', lastActive: '10 minutes ago', score: 87, active: true },
    { id: 6, name: 'Hadi Salim', email: 'hadi.salim@example.com', location: 'Amarah', joinDate: '2025-06-18', lastActive: '7 hours ago', score: 73, active: false },
  ], []);

  const [query, setQuery] = useState('');

  const users = sampleUsers;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
  }, [users, query]);

  const totalUsers = users.length;
  const activeToday = users.filter((u) => u.active).length;
  const avgScore = Math.round(users.reduce((s, u) => s + u.score, 0) / Math.max(1, users.length));

  const scoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  return (
    <section>
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">User Management</h3>
            <p className="text-sm text-gray-600 mt-2">Monitor and manage registered users</p>
          </div>
          <div className="w-64">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full rounded-md border px-3 py-2 text-sm placeholder:text-gray-400"
              aria-label="Search users"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">Total Users<br/><span className="text-2xl font-bold">{totalUsers}</span></div>
          <div className="rounded-lg border p-4">Active Today<br/><span className="text-2xl font-bold text-green-600">{activeToday}</span></div>
          <div className="rounded-lg border p-4">Avg Health Score<br/><span className="text-2xl font-bold text-orange-600">{avgScore}</span></div>
          <div className="rounded-lg border p-4">Engagement Rate<br/><span className="text-2xl font-bold text-indigo-600">78%</span></div>
        </div>

        <div className="mt-6 overflow-auto">
          <table className="w-full table-auto text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Email</th>
                <th className="p-3">Location</th>
                <th className="p-3">Join Date</th>
                <th className="p-3">Last Active</th>
                <th className="p-3">Health Score</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.location}</td>
                  <td className="p-3">{u.joinDate}</td>
                  <td className="p-3">{u.lastActive}</td>
                  <td className="p-3 w-48">
                    <div>
                      <div className="relative h-6 w-full bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={u.score}>
                        <div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ width: `${Math.max(0, Math.min(100, u.score))}%`, background: u.score >= 90 ? '#10B981' : u.score >= 75 ? '#60A5FA' : u.score >=50 ? '#F59E0B' : '#EF4444' }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-sm font-medium" style={{ color: u.score >= 50 ? '#ffffff' : '#111827' }}>{u.score}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{scoreLabel(u.score)}</div>
                    </div>
                  </td>
                  <td className="p-3"><button className="rounded border px-3 py-1 text-sm">View Details</button></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-sm text-gray-500">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
