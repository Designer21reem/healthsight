"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, LabelList,
  PieChart, Pie, Cell,
} from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const COLORS = [
  "#dd24d7", "#2f63fd", "#ffdb43", "#84ebb4", "#e28500",
  "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#10b981",
];

const r2 = (n) => Math.round(((n || 0) * 100)) / 100;

// ── Generic fetch hook ────────────────────────────────────────────────────────
function useFetch(url) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    if (!url) return;
    try {
      setError(null);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  return { data, loading, error, refetch: load };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AnalysisPanel() {
  const [selectedDisease, setSelectedDisease] = useState("All");
  const [viewYears, setViewYears]             = useState(14);

  // API still uses sex=Total/Female/Male internally — UI shows "gender"
  const totalUrl =
    selectedDisease === "All"
      ? `${API_BASE}/predictions?sex=Total`
      : `${API_BASE}/predictions/disease/${encodeURIComponent(selectedDisease)}?sex=Total`;

  const { data: predictions, loading, error, refetch } = useFetch(totalUrl);

  const femaleUrl =
    selectedDisease === "All"
      ? `${API_BASE}/predictions?sex=Female`
      : `${API_BASE}/predictions/disease/${encodeURIComponent(selectedDisease)}?sex=Female`;
  const { data: femaleData } = useFetch(femaleUrl);

  const maleUrl =
    selectedDisease === "All"
      ? `${API_BASE}/predictions?sex=Male`
      : `${API_BASE}/predictions/disease/${encodeURIComponent(selectedDisease)}?sex=Male`;
  const { data: maleData } = useFetch(maleUrl);

  // ── Diseases from DB ──────────────────────────────────────────────────────
  const diseasesInDB = useMemo(
    () => [...new Set(predictions.map((r) => r.disease))].sort(),
    [predictions]
  );

  // ── Year range ────────────────────────────────────────────────────────────
  const allYears = useMemo(
    () => [...new Set(predictions.map((r) => r.year))].sort(),
    [predictions]
  );

  const filteredYears = useMemo(() => {
    if (!allYears.length) return [];
    const cutoff = allYears[allYears.length - 1] - viewYears;
    return allYears.filter((y) => y > cutoff);
  }, [allYears, viewYears]);

  const rowsInView = useMemo(
    () => predictions.filter(
      (r) =>
        filteredYears.includes(r.year) &&
        (selectedDisease === "All" || r.disease === selectedDisease)
    ),
    [predictions, filteredYears, selectedDisease]
  );

  // ── Epidemic curve ────────────────────────────────────────────────────────
  const epidemicData = useMemo(
    () =>
      filteredYears.map((year) => {
        const rows = rowsInView.filter((r) => r.year === year);
        return {
          year,
          observed:  Math.round(rows.reduce((s, r) => s + (r.count           || 0), 0)),
          predicted: Math.round(rows.reduce((s, r) => s + (r.predicted_cases || 0), 0)),
        };
      }),
    [rowsInView, filteredYears]
  );

  // Max 4 evenly-spaced year ticks on XAxis
  const xAxisTicks = useMemo(() => {
    if (filteredYears.length <= 4) return filteredYears;
    const step = Math.ceil((filteredYears.length - 1) / 3);
    const ticks = [];
    for (let i = 0; i < filteredYears.length; i += step) ticks.push(filteredYears[i]);
    if (ticks[ticks.length - 1] !== filteredYears[filteredYears.length - 1])
      ticks.push(filteredYears[filteredYears.length - 1]);
    return ticks;
  }, [filteredYears]);

  // ── Disease distribution ──────────────────────────────────────────────────
  const diseaseData = useMemo(
    () =>
      diseasesInDB
        .map((name) => ({
          name,
          value: Math.round(
            predictions
              .filter((r) => r.disease === name && filteredYears.includes(r.year))
              .reduce((s, r) => s + (r.predicted_cases || 0), 0)
          ),
        }))
        .filter((d) => d.value > 0),
    [predictions, filteredYears, diseasesInDB]
  );

  const displayedDiseaseData = useMemo(
    () =>
      diseaseData.map((d) => ({
        ...d,
        value:
          selectedDisease === "All"
            ? d.value
            : selectedDisease === d.name
            ? d.value
            : Math.round(d.value * 0.3),
      })),
    [diseaseData, selectedDisease]
  );

  // ── Gender breakdown (Female vs Male observed per year) ───────────────────
  const genderChartData = useMemo(() => {
    return filteredYears.map((year) => {
      const fRows = femaleData.filter(
        (r) => r.year === year && (selectedDisease === "All" || r.disease === selectedDisease)
      );
      const mRows = maleData.filter(
        (r) => r.year === year && (selectedDisease === "All" || r.disease === selectedDisease)
      );
      return {
        year,
        Female: Math.round(fRows.reduce((s, r) => s + (r.count || 0), 0)),
        Male:   Math.round(mRows.reduce((s, r) => s + (r.count || 0), 0)),
      };
    });
  }, [femaleData, maleData, filteredYears, selectedDisease]);

  // ── Risk indicators ───────────────────────────────────────────────────────
  const riskFactors = useMemo(() => {
    if (!rowsInView.length)
      return [
        { name: "Outbreak Risk",      value: 0 },
        { name: "High outbreaks",     value: 0 },
        { name: "Moderate outbreaks", value: 0 },
        { name: "Normal level",       value: 0 },
        { name: "With prediction",    value: 0 },
      ];

    const n       = rowsInView.length;
    const avgZ    = rowsInView.reduce((s, r) => s + Math.abs(r.zscore || 0), 0) / n;
    const redPct  = Math.round((rowsInView.filter((r) => r.outbreak_level === "red").length    / n) * 100);
    const yPct    = Math.round((rowsInView.filter((r) => r.outbreak_level === "yellow").length / n) * 100);
    const gPct    = Math.max(0, 100 - redPct - yPct);
    const hasPred = rowsInView.filter((r) => (r.predicted_cases || 0) > 0).length;

    return [
      { name: "Outbreak Risk",      value: Math.min(100, Math.round(avgZ * 35)) },
      { name: "High outbreaks",     value: redPct },
      { name: "Moderate outbreaks", value: yPct  },
      { name: "Normal level",       value: gPct  },
      { name: "With prediction",    value: Math.round((hasPred / n) * 100) },
    ];
  }, [rowsInView]);

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalPredicted = useMemo(
    () => rowsInView.reduce((s, r) => s + (r.predicted_cases || 0), 0),
    [rowsInView]
  );
  const totalObserved = useMemo(
    () => rowsInView.reduce((s, r) => s + (r.count || 0), 0),
    [rowsInView]
  );
  const yearlyGrowth = useMemo(() => {
    if (epidemicData.length < 2) return 0;
    const last = epidemicData[epidemicData.length - 1]?.predicted || 0;
    const prev = epidemicData[epidemicData.length - 2]?.predicted || 1;
    return r2(((last - prev) / Math.max(prev, 1)) * 100);
  }, [epidemicData]);

  const accuracy = useMemo(() => {
    const valid = rowsInView.filter((r) => r.count > 0);
    if (!valid.length) return 0;
    const mape = valid.reduce((s, r) =>
      s + Math.abs((r.predicted_cases - r.count) / r.count), 0) / valid.length;
    return Math.round(Math.max(0, (1 - mape) * 100));
  }, [rowsInView]);

  const avgZscore = useMemo(() => {
    if (!rowsInView.length) return 0;
    return r2(rowsInView.reduce((s, r) => s + Math.abs(r.zscore || 0), 0) / rowsInView.length);
  }, [rowsInView]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <section className="p-3 sm:p-4">
      <div className="rounded-lg bg-white p-4 sm:p-6 shadow-sm space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold">Analysis</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Predicted cases · auto-refresh every 60s
              {loading && <span className="ml-2 text-blue-400">loading…</span>}
              {error   && <span className="ml-2 text-red-500">Error: {error}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refetch} disabled={loading}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
            >
              Refresh
            </button>
            <label className="text-sm text-gray-600">View</label>
            <select
              value={viewYears} onChange={(e) => setViewYears(Number(e.target.value))}
              className="rounded-md border px-2 py-1.5 text-sm"
            >
              <option value={14}>All years</option>
              <option value={6}>Last 6 yrs</option>
              <option value={3}>Last 3 yrs</option>
              <option value={1}>Last year</option>
            </select>
          </div>
        </div>

        {!loading && predictions.length === 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            No data. Run <code className="bg-yellow-100 px-1 rounded">POST /load-csv</code> to load the dataset.
          </div>
        )}

        {/* Stat cards + filter */}
        <div className="rounded-lg border p-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {[
              {
                label: "Yearly Growth",
                value: `${yearlyGrowth >= 0 ? "+" : ""}${yearlyGrowth}%`,
                color: yearlyGrowth >= 0 ? "text-red-600" : "text-green-600",
              },
              { label: "Prediction Accuracy", value: `${accuracy}%`,                               color: "text-green-600"  },
              { label: "Total Predicted",      value: Math.round(totalPredicted).toLocaleString(), color: "text-blue-600"   },
              { label: "Avg Z-score",          value: avgZscore,                                   color: "text-orange-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-md border p-3 sm:p-4">
                <div className="text-xs text-gray-500">{label}</div>
                <div className={`mt-2 text-lg font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <label className="block text-sm text-gray-600 mb-1">Filter by disease</label>
              <select
                value={selectedDisease}
                onChange={(e) => setSelectedDisease(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="All">All</option>
                {diseasesInDB.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="sm:col-span-6">
              <label className="block text-sm text-gray-600 mb-1">Total observed (reference)</label>
              <div className="rounded-md border px-3 py-2 text-sm bg-gray-50 font-medium text-gray-700">
                {Math.round(totalObserved).toLocaleString()} cases
              </div>
            </div>
          </div>
        </div>

        {/* Epidemic curve + Gender breakdown */}
        <div className="grid gap-6 md:grid-cols-2">

          {/* Epidemic Curve */}
          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2 mb-4">
              <h3 className="font-semibold">Epidemic Curve</h3>
              <span className="text-xs text-gray-400">{filteredYears.length} years · Total</span>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={epidemicData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gObs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#9CA3AF" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gPred" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" ticks={xAxisTicks} tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    width={52}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  />
                  <Tooltip
                    labelFormatter={(v) => `Year: ${v}`}
                    formatter={(v, name) => [Number(v).toLocaleString(), name === "predicted" ? "Predicted" : "Observed"]}
                  />
                  <Area type="monotone" dataKey="observed"  stroke="#9CA3AF" fill="url(#gObs)"  name="observed" />
                  <Area type="monotone" dataKey="predicted" stroke="#3B82F6" fill="url(#gPred)" name="predicted" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-0.5 bg-gray-400 inline-block rounded" />Observed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-0.5 bg-blue-500 inline-block rounded" />Predicted
              </span>
            </div>
          </div>

          {/* Cases by Gender — renamed from "Cases by Sex" */}
          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2 mb-4">
              <h3 className="font-semibold">Cases by Gender</h3>
              <span className="text-xs text-gray-400">Female vs Male · observed</span>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genderChartData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" ticks={xAxisTicks} tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    width={52}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  />
                  <Tooltip
                    labelFormatter={(v) => `Year: ${v}`}
                    formatter={(v, name) => [Number(v).toLocaleString(), name]}
                  />
                  <Bar dataKey="Female" fill="#dd24d7" radius={[4, 4, 0, 0]} name="Female">
                    <LabelList dataKey="Female" position="top" fontSize={9}
                      formatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v || ""} />
                  </Bar>
                  <Bar dataKey="Male" fill="#2f63fd" radius={[4, 4, 0, 0]} name="Male">
                    <LabelList dataKey="Male" position="top" fontSize={9}
                      formatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v || ""} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#dd24d7" }} />Female
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#2f63fd" }} />Male
              </span>
            </div>
          </div>
        </div>

        {/* Disease Distribution — no labels on pie */}
        <div className="rounded-lg border p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h3 className="font-semibold">Disease Distribution</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Loaded from database — updates automatically when new diseases are added.
              </p>
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">Click to filter</span>
          </div>

          {diseaseData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">
              No data for this selection.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={displayedDiseaseData}
                      dataKey="value" nameKey="name"
                      cx="50%" cy="50%"
                      outerRadius={90} innerRadius={40}
                      paddingAngle={3}
                      label={false} labelLine={false}
                      onClick={(d) => {
                        if (!d?.name) return;
                        setSelectedDisease((p) => p === d.name ? "All" : d.name);
                      }}
                    >
                      {displayedDiseaseData.map((entry, i) => {
                        const active = selectedDisease !== "All" && selectedDisease === entry.name;
                        return (
                          <Cell
                            key={`c-${i}`}
                            fill={COLORS[i % COLORS.length]}
                            fillOpacity={selectedDisease === "All" ? 1 : active ? 1 : 0.2}
                            stroke={active ? "#111827" : "transparent"}
                            strokeWidth={active ? 2 : 0}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip formatter={(v) => [Number(v).toLocaleString(), "Predicted"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid gap-1.5 max-h-56 overflow-auto pr-1">
                {displayedDiseaseData.map((d, i) => (
                  <button
                    key={d.name}
                    onClick={() => setSelectedDisease((p) => p === d.name ? "All" : d.name)}
                    className={`flex items-center justify-between rounded-md border px-3 py-2 text-left transition-colors ${
                      selectedDisease === d.name ? "bg-blue-50 border-blue-300" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-sm font-medium truncate">{d.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800 ml-2 flex-shrink-0">
                      {d.value.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Outbreak Risk Indicators */}
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-3">Outbreak Risk Indicators</h3>
          <div className="h-[200px] sm:h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={riskFactors} layout="vertical"
                margin={{ top: 4, right: 36, left: 0, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#2f63fd" />
                    <stop offset="100%" stopColor="#60A5FA" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis
                  type="category" dataKey="name"
                  width={110} tick={{ fontSize: 10 }} tickLine={false}
                />
                <Tooltip formatter={(v) => [`${v}%`, "Score"]} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="url(#blueGrad)">
                  <LabelList dataKey="value" position="right" fontSize={10} formatter={(v) => `${v}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </section>
  );
}