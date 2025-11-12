"use client";

import React, { useState, useMemo } from 'react';
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
  Legend,
} from 'recharts';

export default function AnalysisPanel() {
  // sample/mock data — replace with real dataset wiring as needed
  const epidemicData = [
    { date: '2025-04-01', cases: 200 },
    { date: '2025-04-15', cases: 600 },
    { date: '2025-05-01', cases: 1200 },
    { date: '2025-05-15', cases: 900 },
    { date: '2025-06-01', cases: 1400 },
    { date: '2025-06-15', cases: 1100 },
    { date: '2025-07-01', cases: 800 },
    { date: '2025-07-15', cases: 500 },
    { date: '2025-08-01', cases: 300 },
  ];

  const ageData = [
    { group: '0-10', cases: 120 },
    { group: '11-22', cases: 300 },
    { group: '23-35', cases: 420 },
    { group: '36+', cases: 260 },
  ];

  const diseaseData = [
    { name: 'Influenza', value: 1200 },
    { name: 'Cholera', value: 800 },
    { name: 'Measles', value: 300 },
    { name: 'Dengue', value: 600 },
    { name: 'COVID-19', value: 900 },
  ];

  const populationData = [
    { name: 'Women', value: 56 },
    { name: 'Men', value: 34 },
    { name: 'Child', value: 10 },
  ];

  const riskFactors = [
    { name: 'Water Quality', value: 95 },
    { name: 'Population Density', value: 80 },
    { name: 'Sanitation system', value: 70 },
    { name: 'Health Awareness', value: 45 },
    { name: 'Vaccination Coverage', value: 45 },
  ];

  const COLORS = ['#dd24d7', '#2f63fd', '#ffdb43', '#84ebb4', '#e28500'];

  const [selectedDisease, setSelectedDisease] = useState('All');
  const [timeRange, setTimeRange] = useState('Last 30 days');
  const [viewMonths, setViewMonths] = useState(6); // 6,3,1 months

  // compute time multiplier from selected time range (mock behaviour)
  const timeMultiplier = useMemo(() => {
    switch (timeRange) {
      case 'Today':
        return 0.2;
      case 'Last 7 days':
        return 0.7;
      case 'Last 30 days':
      default:
        return 1;
    }
  }, [timeRange]);

  const viewMultiplier = useMemo(() => {
    // map months 1,3,6 to a multiplier relative to our base mock (6 months)
    if (viewMonths === 6) return 1;
    if (viewMonths === 3) return 0.6;
    if (viewMonths === 1) return 0.2;
    return 1;
  }, [viewMonths]);

  // disease data adjusted for the selected timeRange (mock)
  const displayedDiseaseData = useMemo(() => {
    return diseaseData.map((d) => {
      const base = d.value;
      // if a disease is selected, emphasize it and dim others
      const emphasis = selectedDisease === 'All' ? 1 : selectedDisease === d.name ? 1 : 0.3;
      // combine timeRange and viewMonths multipliers for a more realistic adjustment
      return { ...d, value: Math.max(0, Math.round(base * timeMultiplier * viewMultiplier * emphasis)) };
    });
  }, [diseaseData, timeMultiplier, selectedDisease, viewMultiplier]);

  const totalDiseaseSum = useMemo(() => displayedDiseaseData.reduce((s, d) => s + d.value, 0), [displayedDiseaseData]);

  // scale factor based on selected disease (mock behaviour), incorporate timeMultiplier
  const scale = useMemo(() => {
    if (selectedDisease === 'All') return 1 * timeMultiplier;
    const found = displayedDiseaseData.find((d) => d.name === selectedDisease);
    if (!found) return 1 * timeMultiplier;
    const share = found.value / Math.max(1, totalDiseaseSum);
    return Math.max(0.4, Math.min(2, share * 3.5)) * timeMultiplier;
  }, [selectedDisease, displayedDiseaseData, totalDiseaseSum, timeMultiplier]);

  // scaled datasets derived from base mocks
  const scaledEpidemic = useMemo(() => epidemicData.map((d) => ({ ...d, cases: Math.round(d.cases * scale * viewMultiplier) })), [epidemicData, scale, viewMultiplier]);
  const scaledAge = useMemo(() => ageData.map((d) => ({ ...d, cases: Math.round(d.cases * scale * viewMultiplier) })), [ageData, scale, viewMultiplier]);
  // scale risk factors and normalize to 0-100 for chart values
  const scaledRisk = useMemo(() => {
    const baseMax = Math.max(...riskFactors.map((r) => r.value), 1);
    return riskFactors.map((r) => {
      const scaled = Math.round((r.value * scale / baseMax) * 100);
      return { ...r, value: Math.max(0, Math.min(100, scaled)) };
    });
  }, [riskFactors, scale]);

  return (
    <section className="p-4">
      <div className="rounded-lg bg-white p-6 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Analysis</h2>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">View</div>
            <select value={viewMonths} onChange={(e) => setViewMonths(Number(e.target.value))} className="rounded-md border px-3 py-1 text-sm">
              <option value={6}>6 months</option>
              <option value={3}>3 months</option>
              <option value={1}>1 month</option>
            </select>
          </div>
        </div>

        {/* Statistical indicators + disease selector (top) */}
        <div className="rounded-lg border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-md bg-white p-4 text-sm flex flex-col">
              <div className="text-xs text-gray-500">Monthly Growth Rate</div>
              <div className="mt-2 text-lg font-bold text-red-600">{Math.round(12.3 * scale * 10) / 10}%</div>
            </div>
            <div className="rounded-md bg-white p-4 text-sm flex flex-col">
              <div className="text-xs text-gray-500">Prediction Accuracy</div>
              <div className="mt-2 text-lg font-bold text-green-600">{Math.max(50, Math.round(86.7 * (1 - (1 - scale) * 0.25)))}%</div>
            </div>
            <div className="rounded-md bg-white p-4 text-sm flex flex-col">
              <div className="text-xs text-gray-500">Total cases</div>
              <div className="mt-2 text-lg font-bold text-red-600">{(Math.round((diseaseData.reduce((s, d) => s + d.value, 0) * scale))).toLocaleString()}</div>
            </div>
            <div className="rounded-md bg-white p-4 text-sm flex flex-col">
              <div className="text-xs text-gray-500">Response Time</div>
              <div className="mt-2 text-lg font-bold text-blue-600">{Math.max(0.5, (2.1 / Math.max(0.5, scale))).toFixed(1)} days</div>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <label className="text-sm text-gray-500 mr-2">Filter by disease</label>
            <select value={selectedDisease} onChange={(e) => setSelectedDisease(e.target.value)} className="rounded-md border px-3 py-1 text-sm">
              <option value="All">All</option>
              {diseaseData.map((d) => (
                <option key={d.name} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Top charts: Epidemic curve + Age distribution */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold">Epidemic Curve</h3>
              <div className="text-xs text-gray-500">6 months</div>
            </div>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={scaledEpidemic} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="cases" stroke="#3B82F6" fillOpacity={1} fill="url(#colorCases)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold">Age Distribution of cases</h3>
              <div className="text-xs text-gray-500">By age group</div>
            </div>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={scaledAge} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="group" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cases" fill="#60A5FA" radius={[6, 6, 0, 0]}>
                    <LabelList dataKey="cases" position="top" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Middle row: disease distribution + donut */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Disease Distribution</h3>
              <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="rounded-md border px-2 py-1 text-sm">
                <option>Today</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </div>
            <div className="mt-4 flex flex-col md:flex-row items-center gap-4">
              {/* Left: larger pie */}
              <div className="w-full md:w-1/2 flex items-center justify-center">
                <ResponsiveContainer width="80%" height={220}>
                  <PieChart>
                        <Pie
                          data={displayedDiseaseData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={selectedDisease === 'All' ? 90 : 100}
                          innerRadius={selectedDisease === 'All' ? 40 : 45}
                          paddingAngle={3}
                          label
                          onClick={(data, index) => {
                            // clicking a slice sets it as selected disease (toggle)
                            const name = data && data.name;
                            if (!name) return;
                            setSelectedDisease((prev) => (prev === name ? 'All' : name));
                          }}
                        >
                          {displayedDiseaseData.map((entry, index) => {
                            const isActive = selectedDisease !== 'All' && selectedDisease === entry.name;
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                fillOpacity={selectedDisease === 'All' ? 1 : isActive ? 1 : 0.35}
                                stroke={isActive ? '#111827' : 'transparent'}
                                strokeWidth={isActive ? 2 : 0}
                              />
                            );
                          })}
                        </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Right: legend with counts */}
              <div className="w-full md:w-1/2">
                <div className="grid gap-3">
                  {displayedDiseaseData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-4 h-4 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                        <div className="text-sm font-medium">{d.name}</div>
                      </div>
                      <div className="text-sm text-gray-700 font-semibold">{d.value.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">Population by Sex</h3>
            <div className="mt-4">
              {/* Use Card + ChartContainer style similar to shadcn example */}
              <div className="flex flex-col">
                <div className="mb-2 text-sm text-gray-500">January - June 2024</div>
                <div className="flex items-center gap-4">
                  <div className="w-1/2 flex items-center justify-center">
                    <ResponsiveContainer width="90%" height={160}>
                      <PieChart>
                        <Pie data={populationData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4}>
                              {populationData.map((entry, index) => (
                                <Cell key={`cell-pop-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="w-1/2">
                    <div className="grid gap-3">
                      {populationData.map((p, i) => (
                        <div key={p.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-4 h-4 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                            <div className="text-sm font-medium">{p.name}</div>
                          </div>
                          <div className="text-sm text-gray-700 font-semibold">{p.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      

        {/* Main risk factors chart */}
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-4">Main Risk Factors</h3>
          <div className="mt-2 h-52">
              <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scaledRisk} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2f63fd" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={160} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 8, 8]}>
                  {scaledRisk.map((entry, index) => (
                    <Cell key={`cell-r-${index}`} fill={`url(#blueGrad)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
