"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  LabelList,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AnalysisPanel() {
  // sample/mock data — replace with real dataset wiring as needed
  const epidemicData = [
    { date: "2025-04-01", cases: 200 },
    { date: "2025-04-15", cases: 600 },
    { date: "2025-05-01", cases: 1200 },
    { date: "2025-05-15", cases: 900 },
    { date: "2025-06-01", cases: 1400 },
    { date: "2025-06-15", cases: 1100 },
    { date: "2025-07-01", cases: 800 },
    { date: "2025-07-15", cases: 500 },
    { date: "2025-08-01", cases: 300 },
  ];

  const ageData = [
    { group: "0-10", cases: 120 },
    { group: "11-22", cases: 300 },
    { group: "23-35", cases: 420 },
    { group: "36+", cases: 260 },
  ];

  const diseaseData = [
    { name: "Influenza", value: 1200 },
    { name: "Cholera", value: 800 },
    { name: "Measles", value: 300 },
    { name: "Dengue", value: 600 },
    { name: "COVID-19", value: 900 },
  ];

  const populationData = [
    { name: "Women", value: 56 },
    { name: "Men", value: 34 },
    { name: "Child", value: 10 },
  ];

  const riskFactors = [
    { name: "Water Quality", value: 95 },
    { name: "Population Density", value: 80 },
    { name: "Sanitation system", value: 70 },
    { name: "Health Awareness", value: 45 },
    { name: "Vaccination Coverage", value: 45 },
  ];

  const COLORS = ["#dd24d7", "#2f63fd", "#ffdb43", "#84ebb4", "#e28500"];

  const [selectedDisease, setSelectedDisease] = useState("All");
  const [timeRange, setTimeRange] = useState("Last 30 days");
  const [viewMonths, setViewMonths] = useState(6); // 6,3,1 months

  const timeMultiplier = useMemo(() => {
    switch (timeRange) {
      case "Today":
        return 0.2;
      case "Last 7 days":
        return 0.7;
      case "Last 30 days":
      default:
        return 1;
    }
  }, [timeRange]);

  const viewMultiplier = useMemo(() => {
    if (viewMonths === 6) return 1;
    if (viewMonths === 3) return 0.6;
    if (viewMonths === 1) return 0.2;
    return 1;
  }, [viewMonths]);

  const displayedDiseaseData = useMemo(() => {
    return diseaseData.map((d) => {
      const base = d.value;
      const emphasis =
        selectedDisease === "All" ? 1 : selectedDisease === d.name ? 1 : 0.3;
      return {
        ...d,
        value: Math.max(
          0,
          Math.round(base * timeMultiplier * viewMultiplier * emphasis)
        ),
      };
    });
  }, [timeMultiplier, selectedDisease, viewMultiplier]);

  const totalDiseaseSum = useMemo(
    () => displayedDiseaseData.reduce((s, d) => s + d.value, 0),
    [displayedDiseaseData]
  );

  const scale = useMemo(() => {
    if (selectedDisease === "All") return 1 * timeMultiplier;
    const found = displayedDiseaseData.find((d) => d.name === selectedDisease);
    if (!found) return 1 * timeMultiplier;
    const share = found.value / Math.max(1, totalDiseaseSum);
    return Math.max(0.4, Math.min(2, share * 3.5)) * timeMultiplier;
  }, [selectedDisease, displayedDiseaseData, totalDiseaseSum, timeMultiplier]);

  const scaledEpidemic = useMemo(
    () =>
      epidemicData.map((d) => ({
        ...d,
        cases: Math.round(d.cases * scale * viewMultiplier),
      })),
    [scale, viewMultiplier]
  );

  const scaledAge = useMemo(
    () =>
      ageData.map((d) => ({
        ...d,
        cases: Math.round(d.cases * scale * viewMultiplier),
      })),
    [scale, viewMultiplier]
  );

  const scaledRisk = useMemo(() => {
    const baseMax = Math.max(...riskFactors.map((r) => r.value), 1);
    return riskFactors.map((r) => {
      const scaled = Math.round(((r.value * scale) / baseMax) * 100);
      return { ...r, value: Math.max(0, Math.min(100, scaled)) };
    });
  }, [scale]);

  const totalCases = useMemo(() => {
    const base = diseaseData.reduce((s, d) => s + d.value, 0);
    return Math.round(base * scale);
  }, [scale]);

  const monthlyGrowth = Math.round(12.3 * scale * 10) / 10;
  const accuracy = Math.max(
    50,
    Math.round(86.7 * (1 - (1 - scale) * 0.25))
  );
  const responseTime = Math.max(0.5, 2.1 / Math.max(0.5, scale)).toFixed(1);

  const formatShortDate = (iso) => {
    // 2025-04-01 -> Apr 01
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
    } catch {
      return iso;
    }
  };

  return (
    <section className="p-3 sm:p-4">
      <div className="rounded-lg bg-white p-4 sm:p-6 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl sm:text-2xl font-semibold">Analysis</h2>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-sm text-gray-600">View</div>
            <select
              value={viewMonths}
              onChange={(e) => setViewMonths(Number(e.target.value))}
              className="w-full sm:w-auto rounded-md border px-3 py-2 text-sm"
            >
              <option value={6}>6 months</option>
              <option value={3}>3 months</option>
              <option value={1}>1 month</option>
            </select>
          </div>
        </div>

        {/* Stats + Filter */}
        <div className="rounded-lg border p-4 flex flex-col gap-4">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            <div className="rounded-md bg-white p-3 sm:p-4 text-sm border">
              <div className="text-[11px] sm:text-xs text-gray-500">
                Monthly Growth Rate
              </div>
              <div className="mt-2 text-base sm:text-lg font-bold text-red-600">
                {monthlyGrowth}%
              </div>
            </div>

            <div className="rounded-md bg-white p-3 sm:p-4 text-sm border">
              <div className="text-[11px] sm:text-xs text-gray-500">
                Prediction Accuracy
              </div>
              <div className="mt-2 text-base sm:text-lg font-bold text-green-600">
                {accuracy}%
              </div>
            </div>

            <div className="rounded-md bg-white p-3 sm:p-4 text-sm border">
              <div className="text-[11px] sm:text-xs text-gray-500">
                Total cases
              </div>
              <div className="mt-2 text-base sm:text-lg font-bold text-red-600">
                {totalCases.toLocaleString()}
              </div>
            </div>

            <div className="rounded-md bg-white p-3 sm:p-4 text-sm border">
              <div className="text-[11px] sm:text-xs text-gray-500">
                Response Time
              </div>
              <div className="mt-2 text-base sm:text-lg font-bold text-blue-600">
                {responseTime} days
              </div>
            </div>
          </div>

          {/* Filters row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <label className="block text-sm text-gray-600 mb-1">
                Filter by disease
              </label>
              <select
                value={selectedDisease}
                onChange={(e) => setSelectedDisease(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="All">All</option>
                {diseaseData.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm text-gray-600 mb-1">
                Time range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option>Today</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Top charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Epidemic curve */}
          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">Epidemic Curve</h3>
              <div className="text-xs text-gray-500">{viewMonths} months</div>
            </div>

            {/* ✅ taller on mobile */}
            <div className="mt-4 h-[280px] sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={scaledEpidemic}
                  margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={formatShortDate}
                    interval="preserveStartEnd"
                    minTickGap={16}
                  />
                  <YAxis tick={{ fontSize: 11 }} width={36} />
                  <Tooltip
                    labelFormatter={(v) => `Date: ${v}`}
                    formatter={(v) => [`${Number(v).toLocaleString()}`, "Cases"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="cases"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorCases)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Age distribution */}
          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">Age Distribution of cases</h3>
              <div className="text-xs text-gray-500">By age group</div>
            </div>

            <div className="mt-4 h-[280px] sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={scaledAge}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="group" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={36} />
                  <Tooltip
                    formatter={(v) => [`${Number(v).toLocaleString()}`, "Cases"]}
                  />
                  <Bar dataKey="cases" fill="#60A5FA" radius={[6, 6, 0, 0]}>
                    <LabelList dataKey="cases" position="top" fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Middle row */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Disease distribution */}
          <div className="md:col-span-2 rounded-lg border p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="font-semibold">Disease Distribution</h3>

              {/* ✅ already have timeRange above, keep this optional */}
              <div className="text-xs text-gray-500">
                Tap a slice to filter
              </div>
            </div>

            {/* ✅ mobile: chart top + legend bottom */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="w-full h-[280px] sm:h-[240px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={displayedDiseaseData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={45}
                      paddingAngle={3}
                      labelLine={false}
                      label={({ name }) => name}
                      onClick={(data) => {
                        const name = data && data.name;
                        if (!name) return;
                        setSelectedDisease((prev) => (prev === name ? "All" : name));
                      }}
                    >
                      {displayedDiseaseData.map((entry, index) => {
                        const isActive =
                          selectedDisease !== "All" &&
                          selectedDisease === entry.name;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            fillOpacity={
                              selectedDisease === "All" ? 1 : isActive ? 1 : 0.35
                            }
                            stroke={isActive ? "#111827" : "transparent"}
                            strokeWidth={isActive ? 2 : 0}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`${Number(v).toLocaleString()}`, "Cases"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full">
                <div className="grid gap-2 sm:gap-3">
                  {displayedDiseaseData.map((d, i) => (
                    <button
                      key={d.name}
                      onClick={() =>
                        setSelectedDisease((prev) => (prev === d.name ? "All" : d.name))
                      }
                      className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-gray-50 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3.5 h-3.5 rounded-sm"
                          style={{ background: COLORS[i % COLORS.length] }}
                        />
                        <div className="text-sm font-medium">{d.name}</div>
                      </div>

                      <div className="text-sm text-gray-800 font-semibold">
                        {d.value.toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Population by sex */}
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">Population by Sex</h3>
            <div className="mt-2 text-sm text-gray-500">January - June 2024</div>

            {/* ✅ mobile stacked */}
            <div className="mt-4 grid grid-cols-1 gap-4">
              <div className="w-full h-[220px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={populationData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={85}
                      paddingAngle={4}
                      labelLine={false}
                      label={({ name, value }) => `${name} ${value}%`}
                    >
                      {populationData.map((_, index) => (
                        <Cell
                          key={`cell-pop-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v}%`, "Share"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid gap-2">
                {populationData.map((p, i) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3.5 h-3.5 rounded-sm"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <div className="text-sm font-medium">{p.name}</div>
                    </div>
                    <div className="text-sm text-gray-800 font-semibold">
                      {p.value}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Risk factors */}
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-3">Main Risk Factors</h3>

          {/* ✅ taller on mobile + allow long labels */}
          <div className="h-[320px] sm:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={scaledRisk}
                layout="vertical"
                margin={{ top: 5, right: 16, left: 12, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2f63fd" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(v) => [`${v}%`, "Risk score"]} />
                <Bar dataKey="value" radius={[8, 8, 8, 8]} fill="url(#blueGrad)">
                  <LabelList dataKey="value" position="right" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
