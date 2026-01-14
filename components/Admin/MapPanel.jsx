"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  "pk.eyJ1IjoicmVlbTIxIiwiYSI6ImNtaGdzc2RpbjBic2gyaXFydzhibDIzenMifQ.3EFdZ0ywTR6lBxkMVcGL4A";

export default function AdvancedDiseaseMapPanel() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const rafRef = useRef(null);
  const autoRefreshRef = useRef(null);

  const [selectedDisease, setSelectedDisease] = useState("All");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [timeIndex, setTimeIndex] = useState(0);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [timeSteps, setTimeSteps] = useState([]);
  const [lastAutoRefreshAt, setLastAutoRefreshAt] = useState(null);

  const initialCityDataset = [
    {
      city: "Baghdad",
      coord: [44.3661, 33.3152],
      series: {
        "2025-10-20": { Influenza: 120, Cholera: 0, Measles: 2, Dengue: 0, "COVID-19": 25 },
        "2025-10-21": { Influenza: 150, Cholera: 0, Measles: 3, Dengue: 0, "COVID-19": 30 },
        "2025-10-22": { Influenza: 200, Cholera: 0, Measles: 1, Dengue: 0, "COVID-19": 40 },
        "2025-10-23": { Influenza: 240, Cholera: 0, Measles: 0, Dengue: 0, "COVID-19": 55 },
        "2025-10-24": { Influenza: 320, Cholera: 2, Measles: 0, Dengue: 0, "COVID-19": 60 },
      },
    },
    {
      city: "Mosul",
      coord: [43.684, 36.34],
      series: {
        "2025-10-20": { Influenza: 10, Cholera: 30, Measles: 0, Dengue: 0, "COVID-19": 5 },
        "2025-10-21": { Influenza: 12, Cholera: 45, Measles: 0, Dengue: 0, "COVID-19": 6 },
        "2025-10-22": { Influenza: 14, Cholera: 60, Measles: 0, Dengue: 0, "COVID-19": 8 },
        "2025-10-23": { Influenza: 15, Cholera: 80, Measles: 0, Dengue: 0, "COVID-19": 9 },
        "2025-10-24": { Influenza: 18, Cholera: 120, Measles: 0, Dengue: 0, "COVID-19": 12 },
      },
    },
    {
      city: "Karbala",
      coord: [44.39, 32.01],
      series: {
        "2025-10-20": { Influenza: 20, Cholera: 0, Measles: 0, Dengue: 0, "COVID-19": 2 },
        "2025-10-21": { Influenza: 30, Cholera: 0, Measles: 0, Dengue: 0, "COVID-19": 3 },
        "2025-10-22": { Influenza: 40, Cholera: 0, Measles: 0, Dengue: 0, "COVID-19": 4 },
        "2025-10-23": { Influenza: 60, Cholera: 0, Measles: 0, Dengue: 0, "COVID-19": 8 },
        "2025-10-24": { Influenza: 80, Cholera: 0, Measles: 0, Dengue: 0, "COVID-19": 10 },
      },
    },
    {
      city: "Amarah",
      coord: [47.165, 31.85],
      series: {
        "2025-10-20": { Influenza: 0, Cholera: 150, Measles: 0, Dengue: 0, "COVID-19": 4 },
        "2025-10-21": { Influenza: 0, Cholera: 160, Measles: 0, Dengue: 0, "COVID-19": 5 },
        "2025-10-22": { Influenza: 0, Cholera: 170, Measles: 0, Dengue: 0, "COVID-19": 6 },
        "2025-10-23": { Influenza: 0, Cholera: 180, Measles: 0, Dengue: 0, "COVID-19": 6 },
        "2025-10-24": { Influenza: 0, Cholera: 200, Measles: 0, Dengue: 0, "COVID-19": 7 },
      },
    },
    {
      city: "Basra",
      coord: [47.78, 30.51],
      series: {
        "2025-10-20": { Influenza: 5, Cholera: 0, Measles: 0, Dengue: 60, "COVID-19": 2 },
        "2025-10-21": { Influenza: 8, Cholera: 0, Measles: 0, Dengue: 80, "COVID-19": 3 },
        "2025-10-22": { Influenza: 12, Cholera: 0, Measles: 0, Dengue: 120, "COVID-19": 5 },
        "2025-10-23": { Influenza: 20, Cholera: 0, Measles: 0, Dengue: 180, "COVID-19": 6 },
        "2025-10-24": { Influenza: 50, Cholera: 0, Measles: 0, Dengue: 230, "COVID-19": 8 },
      },
    },
  ];

  const diseasesList = ["All", "Influenza", "Cholera", "Measles", "Dengue", "COVID-19"];

  const diseaseInfo = {
    All: { incubation: "Varies", transmission: "Multiple modes", vaccination: "Varies", prevention: "Hygiene, surveillance" },
    Influenza: { incubation: "1 - 4 days", transmission: "Airborne droplets", vaccination: "Available", prevention: "Vaccination, masks, hand hygiene" },
    Cholera: { incubation: "1 - 5 days", transmission: "Contaminated water/food", vaccination: "Available (oral)", prevention: "Clean water, sanitation" },
    Measles: { incubation: "10 - 14 days", transmission: "Airborne droplets", vaccination: "Available (MMR)", prevention: "Vaccination, isolation" },
    Dengue: { incubation: "4 - 10 days", transmission: "Mosquito-borne", vaccination: "Limited", prevention: "Mosquito control, nets" },
    "COVID-19": { incubation: "2 - 14 days", transmission: "Airborne droplets & aerosols", vaccination: "Available", prevention: "Vaccination, masks, distancing" },
  };

  // ✅ helper: resize map safely
  const safeResizeMap = useCallback(() => {
    if (!map.current) return;
    // sometimes needs 2 frames to settle layout
    requestAnimationFrame(() => {
      try {
        map.current.resize();
      } catch {}
    });
  }, []);

  useEffect(() => {
    const datesSet = new Set();
    initialCityDataset.forEach((c) => Object.keys(c.series).forEach((d) => datesSet.add(d)));
    const sorted = Array.from(datesSet).sort();
    setTimeSteps(sorted);

    if (sorted.length > 0) {
      setStartDate(sorted[0]);
      setEndDate(sorted[sorted.length - 1]);
      setTimeIndex(sorted.length - 1);
    }
  }, []);

  const buildGeoJSONForDate = useCallback(
    (targetDateIso, diseaseFilter) => {
      const features = [];
      initialCityDataset.forEach((city) => {
        const daySeries = city.series[targetDateIso];
        if (!daySeries) return;

        if (diseaseFilter === "All") {
          const totalCases = Object.values(daySeries).reduce((s, v) => s + (v || 0), 0);
          if (totalCases > 0) {
            features.push({
              type: "Feature",
              geometry: { type: "Point", coordinates: city.coord },
              properties: { city: city.city, disease: "All", cases: totalCases, date: targetDateIso, breakdown: daySeries },
            });
          }
        } else {
          const cases = daySeries[diseaseFilter] || 0;
          if (cases > 0) {
            features.push({
              type: "Feature",
              geometry: { type: "Point", coordinates: city.coord },
              properties: { city: city.city, disease: diseaseFilter, cases, date: targetDateIso },
            });
          }
        }
      });

      return { type: "FeatureCollection", features };
    },
    [initialCityDataset]
  );

  // ✅ init map once
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [44.3661, 33.3152],
      zoom: 5.3,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(new mapboxgl.ScaleControl({ maxWidth: 140, unit: "metric" }), "bottom-left");
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
        showUserHeading: false,
      }),
      "top-right"
    );

    map.current.on("load", () => {
      const date = timeSteps[timeIndex] || null;
      const initialData = date ? buildGeoJSONForDate(date, "All") : { type: "FeatureCollection", features: [] };

      map.current.addSource("diseases", { type: "geojson", data: initialData });

      map.current.addLayer({
        id: "disease-heatmap",
        type: "heatmap",
        source: "diseases",
        maxzoom: 9,
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "cases"], 0, 0, 500, 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 9, 2],
          "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(0,0,255,0)", 0.2, "royalblue", 0.4, "cyan", 0.6, "orange", 1, "red"],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 10, 9, 50],
          "heatmap-opacity": 0.8,
        },
      });

      map.current.addLayer({
        id: "disease-points",
        type: "circle",
        source: "diseases",
        minzoom: 7,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "cases"], 0, 4, 50, 8, 200, 14, 500, 22],
          "circle-color": [
            "case",
            ["==", ["get", "disease"], "Influenza"],
            "#FF4444",
            ["==", ["get", "disease"], "Cholera"],
            "#FFA500",
            ["==", ["get", "disease"], "Measles"],
            "#7C3AED",
            ["==", ["get", "disease"], "Dengue"],
            "#059669",
            ["==", ["get", "disease"], "COVID-19"],
            "#f97316",
            "#8B5CF6",
          ],
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1,
          "circle-opacity": 0.95,
        },
      });

      // ✅ IMPORTANT: resize after load (fix “box moved”)
      setTimeout(() => safeResizeMap(), 0);

      map.current.on("click", "disease-points", (e) => {
        if (!e.features || !e.features[0]) return;
        const props = e.features[0].properties;
        const coords = e.features[0].geometry.coordinates.slice();

        let popupHtml = `<strong>${props.city}</strong><br/>Date: ${props.date || ""}<br/>Cases: ${props.cases}`;
        try {
          if (props.breakdown) {
            const br = typeof props.breakdown === "string" ? JSON.parse(props.breakdown) : props.breakdown;
            popupHtml += "<br/><small>Breakdown:</small><ul style='margin:6px 0 0 12px;padding:0'>";
            Object.keys(br).forEach((k) => (popupHtml += `<li style="list-style:disc">${k}: ${br[k] || 0}</li>`));
            popupHtml += "</ul>";
          }
        } catch {}

        new mapboxgl.Popup().setLngLat(coords).setHTML(popupHtml).addTo(map.current);
      });

      map.current.on("mouseenter", "disease-points", () => (map.current.getCanvas().style.cursor = "pointer"));
      map.current.on("mouseleave", "disease-points", () => (map.current.getCanvas().style.cursor = ""));
    });

    // ✅ resize on window change (mobile rotate etc.)
    const onWinResize = () => safeResizeMap();
    window.addEventListener("resize", onWinResize);

    return () => {
      window.removeEventListener("resize", onWinResize);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeSteps, safeResizeMap]);

  // ✅ whenever layout-affecting states change, resize too
  useEffect(() => {
    if (!map.current) return;
    // بعد ما يتغير المرض/التاريخ/الرينج، مرات الDOM يتغير
    setTimeout(() => safeResizeMap(), 0);
  }, [selectedDisease, startDate, endDate, safeResizeMap]);

  // update geojson
  useEffect(() => {
    if (!map.current || !timeSteps.length) return;
    const date = timeSteps[timeIndex];
    if (!date) return;

    const newGeo = buildGeoJSONForDate(date, selectedDisease);
    const source = map.current.getSource("diseases");
    if (source) {
      try {
        source.setData(newGeo);
      } catch (err) {
        console.warn("Could not set data on source yet", err);
      }
    }
  }, [selectedDisease, timeIndex, timeSteps, buildGeoJSONForDate]);

  // animation
  useEffect(() => {
    let lastTime = null;
    const baseIntervalMs = 800;

    const step = (timestamp) => {
      if (!lastTime) lastTime = timestamp;
      const delta = timestamp - lastTime;
      const threshold = baseIntervalMs / Math.max(0.25, playSpeed);

      if (delta >= threshold) {
        lastTime = timestamp;
        setTimeIndex((idx) => {
          const filtered = timeSteps.filter((d) => (!startDate || d >= startDate) && (!endDate || d <= endDate));
          if (filtered.length === 0) return idx;

          const currentDate = timeSteps[idx];
          const pos = filtered.indexOf(currentDate);
          if (pos === -1) {
            const newIdx = timeSteps.indexOf(filtered[0]);
            return newIdx === -1 ? idx : newIdx;
          }

          const nextPos = (pos + 1) % filtered.length;
          const nextDate = filtered[nextPos];
          const nextIdx = timeSteps.indexOf(nextDate);
          return nextIdx === -1 ? idx : nextIdx;
        });
      }

      rafRef.current = requestAnimationFrame(step);
    };

    if (isPlaying) rafRef.current = requestAnimationFrame(step);
    else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, playSpeed, timeSteps, startDate, endDate]);

  // auto refresh
  useEffect(() => {
    const refreshFn = async () => setLastAutoRefreshAt(new Date().toISOString());
    refreshFn();
    autoRefreshRef.current = setInterval(refreshFn, 60 * 1000);
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, []);

  const derivedStats = React.useMemo(() => {
    if (!timeSteps.length) return { totalCases: 0, highRiskCount: 0, cities: [] };
    const date = timeSteps[timeIndex];
    const visibleFeatures = buildGeoJSONForDate(date, selectedDisease).features;
    const totalCases = visibleFeatures.reduce((s, f) => s + (f.properties.cases || 0), 0);
    const highRiskCount = visibleFeatures.filter((f) => (f.properties.cases || 0) >= 200).length;
    const cities = visibleFeatures.map((f) => ({ city: f.properties.city, cases: f.properties.cases, coords: f.geometry && f.geometry.coordinates }));
    return { totalCases, highRiskCount, cities };
  }, [timeIndex, timeSteps, selectedDisease, buildGeoJSONForDate]);

  const onPlayPause = () => setIsPlaying((p) => !p);

  const onSliderChange = (e) => {
    const val = Number(e.target.value);
    if (!Number.isNaN(val) && timeSteps[val]) setTimeIndex(val);
  };

  const moveIndexBy = (delta) => {
    setTimeIndex((i) => {
      const filtered = timeSteps.filter((d) => (!startDate || d >= startDate) && (!endDate || d <= endDate));
      if (filtered.length === 0) return i;
      const pos = filtered.indexOf(timeSteps[i]);
      if (pos === -1) return i;
      const nextPos = Math.max(0, Math.min(filtered.length - 1, pos + delta));
      return timeSteps.indexOf(filtered[nextPos]);
    });
  };

  const currentDateLabel = timeSteps[timeIndex] || "—";
  const info = diseaseInfo[selectedDisease] || diseaseInfo.All;

  return (
    <section className="p-3 sm:p-4">
      <div className="rounded-lg bg-white p-4 sm:p-6 shadow-sm">
        {/* Header + Filters */}
        <div className="mb-4">
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold">Outbreaks Map — Iraq</h2>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">
                Auto-refresh:{" "}
                <span className="font-medium">
                  {lastAutoRefreshAt ? new Date(lastAutoRefreshAt).toLocaleTimeString() : "—"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-4">
                <label className="text-sm font-medium text-gray-700 block mb-1">Disease</label>
                <select
                  value={selectedDisease}
                  onChange={(e) => setSelectedDisease(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  {diseasesList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-4">
                <label className="text-sm font-medium text-gray-700 block mb-1">From</label>
                <input
                  type="date"
                  value={startDate || ""}
                  min={timeSteps[0] || ""}
                  max={endDate || timeSteps[timeSteps.length - 1] || ""}
                  onChange={(e) => setStartDate(e.target.value || null)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="text-sm font-medium text-gray-700 block mb-1">To</label>
                <input
                  type="date"
                  value={endDate || ""}
                  min={startDate || timeSteps[0] || ""}
                  max={timeSteps[timeSteps.length - 1] || ""}
                  onChange={(e) => setEndDate(e.target.value || null)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Map wrapper prevents overflow + keeps map in place */}
        <div className="rounded-xl overflow-hidden shadow-lg mb-4">
          <div ref={mapContainer} className="w-full h-[360px] sm:h-[480px]" />
        </div>

        {/* Playback */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3">
            <button onClick={() => moveIndexBy(-1)} className="rounded-md border px-3 py-2 text-sm">
              ◀ Prev
            </button>

            <button onClick={onPlayPause} className="rounded-md border px-3 py-2 text-sm">
              {isPlaying ? "Pause ⏸" : "Play ▶"}
            </button>

            <button onClick={() => moveIndexBy(1)} className="rounded-md border px-3 py-2 text-sm col-span-2 sm:col-auto">
              Next ▶
            </button>

            <div className="flex items-center gap-2 sm:ml-4">
              <label className="text-sm text-gray-700">Speed</label>
              <select
                value={playSpeed}
                onChange={(e) => setPlaySpeed(Number(e.target.value))}
                className="rounded-md border px-2 py-2 text-sm"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={4}>4x</option>
              </select>
            </div>

            <div className="text-sm text-gray-600 sm:ml-auto">
              Date: <span className="font-medium">{currentDateLabel}</span>
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={Math.max(0, timeSteps.length - 1)}
            value={timeIndex}
            onChange={onSliderChange}
            className="w-full"
          />

          <div className="flex justify-between text-[11px] sm:text-xs text-gray-500">
            <div className="truncate max-w-[30%]">{timeSteps[0] || ""}</div>
            <div className="truncate max-w-[30%]">{timeSteps[Math.floor((timeSteps.length - 1) / 2)] || ""}</div>
            <div className="truncate max-w-[30%] text-right">{timeSteps[timeSteps.length - 1] || ""}</div>
          </div>
        </div>

        {/* Rest UI */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 flex flex-col justify-center">
              <div className="text-sm text-gray-500">Observed diseases</div>
              <div className="mt-2 text-2xl font-bold">{diseasesList.length - 1}</div>
              <div className="text-xs text-gray-400 mt-1">tracked</div>
            </div>

            <div className="rounded-lg border p-4 flex flex-col justify-center">
              <div className="text-sm text-gray-500">Total cases (visible)</div>
              <div className="mt-2 text-2xl font-bold">{new Intl.NumberFormat("en-US").format(derivedStats.totalCases)}</div>
              <div className="text-xs text-gray-400 mt-1">for selection & date</div>
            </div>

            <div className="rounded-lg border p-4 flex flex-col justify-center">
              <div className="text-sm text-gray-500">High-risk cities</div>
              <div className="mt-2 text-2xl font-bold">{derivedStats.highRiskCount} / {derivedStats.cities.length || 0}</div>
              <div className="text-xs text-gray-400 mt-1">≥ 200 cases</div>
            </div>

            <div className="rounded-lg border p-4 flex flex-col justify-center">
              <div className="text-sm text-gray-500">Auto-refresh</div>
              <div className="mt-2 text-2xl font-bold">{lastAutoRefreshAt ? "On" : "—"}</div>
              <div className="text-xs text-gray-400 mt-1">every 60s</div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Cities (visible)</h3>
            <div className="space-y-2 max-h-56 overflow-auto">
              {derivedStats.cities.length === 0 && <div className="text-sm text-gray-500">No cities with cases for this selection.</div>}

              {derivedStats.cities.map((c) => {
                const risk = c.cases >= 200 ? "High" : c.cases >= 80 ? "Mid" : "Low";
                return (
                  <div
                    key={c.city}
                    onClick={() => {
                      if (map.current && c.coords) map.current.flyTo({ center: c.coords, zoom: 9 });
                    }}
                    className="cursor-pointer flex items-center justify-between rounded-lg bg-white p-3 shadow-sm hover:shadow-md"
                  >
                    <div>
                      <div className="font-medium">{c.city}</div>
                      <div className="text-sm text-blue-600">{c.cases} cases</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`rounded-full px-3 py-1 text-sm ${risk === "High" ? "bg-red-500 text-white" : risk === "Mid" ? "bg-yellow-300 text-black" : "bg-green-300 text-black"}`}>
                        {risk}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (map.current && c.coords) map.current.flyTo({ center: c.coords, zoom: 9 });
                        }}
                        className="h-8 w-8 rounded-md bg-blue-600 text-white flex items-center justify-center"
                        aria-label={`Go to ${c.city}`}
                      >
                        ✈
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Disease details</h3>

            <div className="space-y-3">
              <div className="rounded-lg bg-white p-4 shadow-sm flex items-center justify-between">
                <div className="font-medium">Incubation period</div>
                <div className="text-blue-600 font-semibold">{info.incubation}</div>
              </div>

              <div className="rounded-lg bg-white p-4 shadow-sm flex items-center justify-between">
                <div className="font-medium">Mode of Transmission</div>
                <div className="text-red-600 font-semibold">{info.transmission}</div>
              </div>

              <div className="rounded-lg bg-white p-4 shadow-sm flex items-center justify-between">
                <div className="font-medium">Vaccination</div>
                <div className="text-green-600 font-semibold">{info.vaccination}</div>
              </div>

              <div className="rounded-lg bg-white p-4 shadow-sm flex items-center justify-between">
                <div className="font-medium">Prevention</div>
                <div className="text-blue-600 font-semibold">{info.prevention}</div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-medium mb-3">Legend</h3>
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 inline-block bg-[#FF4444] rounded-sm" />
                  <div className="text-sm">Influenza</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 inline-block bg-[#FFA500] rounded-sm" />
                  <div className="text-sm">Cholera</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 inline-block bg-[#7C3AED] rounded-sm" />
                  <div className="text-sm">Measles</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 inline-block bg-[#059669] rounded-sm" />
                  <div className="text-sm">Dengue</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 inline-block bg-[#f97316] rounded-sm" />
                  <div className="text-sm">COVID-19</div>
                </div>

                <hr />

                <div className="text-sm text-gray-600">
                  Points appear when zoom ≥ 7. Heatmap shows density. Use Date range to restrict the animation.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
