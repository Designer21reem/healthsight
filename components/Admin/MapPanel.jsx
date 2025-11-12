"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

/**
 * Complete, standalone React component (Next.js "use client" compatible)
 * - Features included:
 *   • Mapbox map centered on Iraq
 *   • 5 diseases (Influenza, Cholera, Measles, Dengue, COVID-19)
 *   • Time slider + date-range filter (Date inputs)
 *   • Play / Pause animation over time using requestAnimationFrame
 *   • Auto-refresh placeholder (every 60s) to fetch new data from an API (simulated)
 *   • Heatmap + circle points (points appear when zoomed in)
 *   • Popup on point click showing city / disease / cases / date
 *   • Legend + controls + dynamic stats below the map that update with disease & date
 *
 * Installation prerequisites:
 *   npm install mapbox-gl
 *   (optional) Tailwind CSS for the classes used; otherwise replace with your CSS
 *
 * IMPORTANT:
 *   - Put your Mapbox public token in env variable NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
 *     or replace the fallback token below with your token (not recommended to commit tokens).
 */

mapboxgl.accessToken =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  "pk.eyJ1IjoicmVlbTIxIiwiYSI6ImNtaGdzc2RpbjBic2gyaXFydzhibDIzenMifQ.3EFdZ0ywTR6lBxkMVcGL4A"; // fallback (replace with yours for quick testing)

export default function AdvancedDiseaseMapPanel() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const rafRef = useRef(null);
  const autoRefreshRef = useRef(null);

  // ---- UI State ----
  const [selectedDisease, setSelectedDisease] = useState("All");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1); // multiplier for animation speed (1x, 2x, ...)
  const [timeIndex, setTimeIndex] = useState(0); // index into timeSteps
  const [startDate, setStartDate] = useState(null); // ISO date string
  const [endDate, setEndDate] = useState(null); // ISO date string
  const [timeSteps, setTimeSteps] = useState([]); // array of ISO date strings
  const [lastAutoRefreshAt, setLastAutoRefreshAt] = useState(null);

  // ---- Example time-series dataset (IN-MEMORY) ----
  // Each city feature contains a per-disease time-series map: { "YYYY-MM-DD": cases, ... }
  // In a real app you'd fetch this from an API and store remotely.
  const initialCityDataset = [
    {
      city: "Baghdad",
      coord: [44.3661, 33.3152],
      series: {
        // dates -> disease -> cases
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

  // diseases list (5 diseases)
  const diseasesList = ["All", "Influenza", "Cholera", "Measles", "Dengue", "COVID-19"];

  // disease information lookup (example content)
  const diseaseInfo = {
    All: {
      incubation: "Varies",
      transmission: "Multiple modes",
      vaccination: "Varies",
      prevention: "Hygiene, surveillance",
    },
    Influenza: {
      incubation: "1 - 4 days",
      transmission: "Airborne droplets",
      vaccination: "Available",
      prevention: "Vaccination, masks, hand hygiene",
    },
    Cholera: {
      incubation: "1 - 5 days",
      transmission: "Contaminated water/food",
      vaccination: "Available (oral)",
      prevention: "Clean water, sanitation",
    },
    Measles: {
      incubation: "10 - 14 days",
      transmission: "Airborne droplets",
      vaccination: "Available (MMR)",
      prevention: "Vaccination, isolation",
    },
    Dengue: {
      incubation: "4 - 10 days",
      transmission: "Mosquito-borne",
      vaccination: "Limited",
      prevention: "Mosquito control, nets",
    },
    "COVID-19": {
      incubation: "2 - 14 days",
      transmission: "Airborne droplets & aerosols",
      vaccination: "Available",
      prevention: "Vaccination, masks, distancing",
    },
  };

  // ---- Build timeSteps from dataset (once) ----
  useEffect(() => {
    // gather all unique dates from initialCityDataset
    const datesSet = new Set();
    initialCityDataset.forEach((c) => {
      Object.keys(c.series).forEach((d) => datesSet.add(d));
    });
    const sorted = Array.from(datesSet).sort();
    setTimeSteps(sorted);
    // set defaults for date range
    if (sorted.length > 0) {
      setStartDate(sorted[0]);
      setEndDate(sorted[sorted.length - 1]);
      setTimeIndex(sorted.length - 1); // default to last date
    }
  }, []); // run once

  // utility: build a GeoJSON for current selected disease & date
  const buildGeoJSONForDate = useCallback(
    (targetDateIso, diseaseFilter) => {
      const features = [];
      initialCityDataset.forEach((city) => {
        const daySeries = city.series[targetDateIso];
        if (!daySeries) return;
        if (diseaseFilter === "All") {
          // sum all diseases for the city that day to drive heatmap/size
          const totalCases = Object.values(daySeries).reduce((s, v) => s + (v || 0), 0);
          if (totalCases > 0) {
            features.push({
              type: "Feature",
              geometry: { type: "Point", coordinates: city.coord },
              properties: {
                city: city.city,
                disease: "All",
                cases: totalCases,
                date: targetDateIso,
                // keep breakdown for popup
                breakdown: daySeries,
              },
            });
          }
        } else {
          const cases = daySeries[diseaseFilter] || 0;
          if (cases > 0) {
            features.push({
              type: "Feature",
              geometry: { type: "Point", coordinates: city.coord },
              properties: {
                city: city.city,
                disease: diseaseFilter,
                cases,
                date: targetDateIso,
              },
            });
          }
        }
      });

      return { type: "FeatureCollection", features };
    },
    [initialCityDataset]
  );

  // ---- Initialize Mapbox map once ----
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [44.3661, 33.3152],
      zoom: 5.3,
    });

    // add controls
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
      // initial source with the current timeIndex
      const date = timeSteps[timeIndex] || null;
      const initialData = date ? buildGeoJSONForDate(date, "All") : { type: "FeatureCollection", features: [] };

      map.current.addSource("diseases", {
        type: "geojson",
        data: initialData,
      });

      // Heatmap layer (shows density)
      map.current.addLayer({
        id: "disease-heatmap",
        type: "heatmap",
        source: "diseases",
        maxzoom: 9,
        paint: {
          // weight by number of cases
          "heatmap-weight": ["interpolate", ["linear"], ["get", "cases"], 0, 0, 500, 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 9, 2],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0,0,255,0)",
            0.2,
            "royalblue",
            0.4,
            "cyan",
            0.6,
            "orange",
            1,
            "red",
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 10, 9, 50],
          "heatmap-opacity": 0.8,
        },
      });

      // Circle layer - visible only at higher zooms so users can click points
      map.current.addLayer({
        id: "disease-points",
        type: "circle",
        source: "diseases",
        minzoom: 7,
        paint: {
          // radius grows with cases
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "cases"],
            0,
            4,
            50,
            8,
            200,
            14,
            500,
            22,
          ],
          // color by disease type (All uses purple)
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
            /* default */ "#8B5CF6",
          ],
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1,
          "circle-opacity": 0.95,
        },
      });

      // Popup on click for points
      map.current.on("click", "disease-points", (e) => {
        if (!e.features || !e.features[0]) return;
        const props = e.features[0].properties;
        const coords = e.features[0].geometry.coordinates.slice();

        // If breakdown exists (All), show breakdown table
        let popupHtml = `<strong>${props.city}</strong><br/>Date: ${props.date || ""}<br/>Cases: ${props.cases}`;
        try {
          if (props.breakdown) {
            // props.breakdown may be a stringified object depending on source, ensure object
            const br = typeof props.breakdown === "string" ? JSON.parse(props.breakdown) : props.breakdown;
            popupHtml += "<br/><small>Breakdown:</small><ul style='margin:6px 0 0 12px;padding:0'>";
            Object.keys(br).forEach((k) => {
              popupHtml += `<li style="list-style:disc">${k}: ${br[k] || 0}</li>`;
            });
            popupHtml += "</ul>";
          }
        } catch (err) {
          // ignore parse errors
        }

        new mapboxgl.Popup().setLngLat(coords).setHTML(popupHtml).addTo(map.current);
      });

      // pointer cursor on hover
      map.current.on("mouseenter", "disease-points", () => {
        map.current.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", "disease-points", () => {
        map.current.getCanvas().style.cursor = "";
      });
    });

    return () => {
      // cleanup map on unmount
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeSteps]); // run when timeSteps are ready

  // ---- Update map data whenever selectedDisease or timeIndex changes ----
  useEffect(() => {
    if (!map.current || !timeSteps.length) return;
    const date = timeSteps[timeIndex];
    if (!date) return;

    const newGeo = buildGeoJSONForDate(date, selectedDisease);
    const source = map.current.getSource("diseases");
    if (source) {
      // set new data
      try {
        source.setData(newGeo);
      } catch (err) {
        // Sometimes map isn't fully ready; guard
        console.warn("Could not set data on source yet", err);
      }
    }
  }, [selectedDisease, timeIndex, timeSteps, buildGeoJSONForDate]);

  // ---- Animation: play through available dates ----
  useEffect(() => {
    let lastTime = null;
    const baseIntervalMs = 800; // base time per step at speed 1

    const step = (timestamp) => {
      if (!lastTime) lastTime = timestamp;
      const delta = timestamp - lastTime;
      // advance timeIndex when accumulated > interval / speed
      const threshold = baseIntervalMs / Math.max(0.25, playSpeed);
      if (delta >= threshold) {
        lastTime = timestamp;
        setTimeIndex((idx) => {
          // advance within startDate..endDate range
          const filtered = timeSteps.filter((d) => (!startDate || d >= startDate) && (!endDate || d <= endDate));
          if (filtered.length === 0) return idx;
          const currentDate = timeSteps[idx];
          // find current pos within filtered
          const pos = filtered.indexOf(currentDate);
          if (pos === -1) {
            // not in filtered range -> set to first
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

    if (isPlaying) {
      rafRef.current = requestAnimationFrame(step);
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, playSpeed, timeSteps, startDate, endDate]);

  // ---- Auto-refresh every minute (placeholder for API polling) ----
  useEffect(() => {
    const refreshFn = async () => {
      // Placeholder: in a real app you'd fetch from your API and update dataset + timeSteps
      // Example:
      // const res = await fetch("/api/outbreaks");
      // const updated = await res.json();
      // process it and update dataset/timeSteps accordingly
      // For now we just update the timestamp to show refresh happened.
      setLastAutoRefreshAt(new Date().toISOString());
      // If you had fetched new data, you would update initialCityDataset or state, then rebuild timeSteps.
    };

    // start immediately, then every 60s
    refreshFn();
    autoRefreshRef.current = setInterval(refreshFn, 60 * 1000);

    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, []);

  // ---- Derived stats for UI (dynamic) ----
  const derivedStats = React.useMemo(() => {
    if (!timeSteps.length) return { totalCases: 0, highRiskCount: 0, cities: [] };
    const date = timeSteps[timeIndex];
    const visibleFeatures = buildGeoJSONForDate(date, selectedDisease).features;
    const totalCases = visibleFeatures.reduce((s, f) => s + (f.properties.cases || 0), 0);
    const highRiskCount = visibleFeatures.filter((f) => (f.properties.cases || 0) >= 200).length;
    const cities = visibleFeatures.map((f) => ({ city: f.properties.city, cases: f.properties.cases, coords: f.geometry && f.geometry.coordinates }));
    return { totalCases, highRiskCount, cities };
  }, [timeIndex, timeSteps, selectedDisease, buildGeoJSONForDate]);

  // ---- UI helpers ----
  const onPlayPause = () => setIsPlaying((p) => !p);

  const onSliderChange = (e) => {
    const val = Number(e.target.value);
    if (!Number.isNaN(val) && timeSteps[val]) {
      setTimeIndex(val);
    }
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

  // ---- Render ----
  return (
    <section className="p-4">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        {/* Header & Controls */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Outbreaks Map — Iraq</h2>
            <div className="text-sm text-gray-500 mt-1">
              Visualize outbreaks over time. Auto-refresh: <span className="font-medium">{lastAutoRefreshAt ? new Date(lastAutoRefreshAt).toLocaleTimeString() : "—"}</span>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <label className="text-sm">Disease</label>
            <select
              value={selectedDisease}
              onChange={(e) => setSelectedDisease(e.target.value)}
              className="rounded-md border px-3 py-1 text-sm"
            >
              {diseasesList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Date range controls */}
            <div className="flex flex-col md:flex-row items-center gap-2 text-sm ">
             <div>
                 <label>From</label>
              <input
                type="date"
                value={startDate || ""}
                min={timeSteps[0] || ""}
                max={endDate || timeSteps[timeSteps.length - 1] || ""}
                onChange={(e) => setStartDate(e.target.value || null)}
                className="rounded-md border ml-2 px-2 py-1 text-sm"
              />
             </div>
                <div>   
                                  <label>To</label>
              <input
                type="date"
                value={endDate || ""}
                min={startDate || timeSteps[0] || ""}
                max={timeSteps[timeSteps.length - 1] || ""}
                onChange={(e) => setEndDate(e.target.value || null)}
                className="rounded-md border ml-2 px-2 py-1 text-sm"
              />
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div ref={mapContainer} className="w-full h-[480px] rounded-xl shadow-lg mb-4" />

        {/* Playback controls + slider */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => moveIndexBy(-1)} className="rounded-md border px-3 py-1">◀</button>
            <button onClick={onPlayPause} className="rounded-md border px-3 py-1">
              {isPlaying ? "Pause ⏸" : "Play ▶"}
            </button>
            <button onClick={() => moveIndexBy(1)} className="rounded-md border px-3 py-1">▶</button>

            <div className="flex items-center gap-2 ml-4">
              <label className="text-sm">Speed</label>
              <select value={playSpeed} onChange={(e) => setPlaySpeed(Number(e.target.value))} className="rounded-md border px-2 py-1 text-sm">
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={4}>4x</option>
              </select>
            </div>

            <div className="ml-auto text-sm text-gray-600">
              Current date: <span className="font-medium">{timeSteps[timeIndex] || "—"}</span>
            </div>
          </div>

          {/* slider over all timeSteps */}
          <input
            type="range"
            min={0}
            max={Math.max(0, timeSteps.length - 1)}
            value={timeIndex}
            onChange={onSliderChange}
            className="w-full"
          />

          {/* small timeline labels */}
          <div className="flex justify-between text-xs text-gray-500">
            <div>{timeSteps[0] || ""}</div>
            <div>{timeSteps[Math.floor((timeSteps.length - 1) / 2)] || ""}</div>
            <div>{timeSteps[timeSteps.length - 1] || ""}</div>
          </div>
        </div>

        {/* Legend + Stats + Areas list */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 aspect-square flex flex-col justify-center">
              <div className="text-sm text-gray-500">Observed diseases</div>
              <div className="mt-2 text-2xl font-bold">{diseasesList.length - 1}</div>
              <div className="text-xs text-gray-400 mt-1">tracked</div>
            </div>

            <div className="rounded-lg border p-4 aspect-square flex flex-col justify-center">
              <div className="text-sm text-gray-500">Total cases (visible)</div>
              <div className="mt-2 text-2xl font-bold">{derivedStats.totalCases.toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-1">for selected disease & date</div>
            </div>

            <div className="rounded-lg border p-4 aspect-square flex flex-col justify-center">
              <div className="text-sm text-gray-500">High-risk cities</div>
              <div className="mt-2 text-2xl font-bold">{derivedStats.highRiskCount} / {derivedStats.cities.length || 0}</div>
              <div className="text-xs text-gray-400 mt-1">≥ 200 cases</div>
            </div>

            <div className="rounded-lg border p-4 aspect-square flex flex-col justify-center">
              <div className="text-sm text-gray-500">Auto-refresh</div>
              <div className="mt-2 text-2xl font-bold">{lastAutoRefreshAt ? "On" : "—"}</div>
              <div className="text-xs text-gray-400 mt-1">every 60s (simulated)</div>
            </div>
          </div>

          {/* Areas list */}
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

          {/* Disease info (dynamic) + Legend */}
          <div>
            <h3 className="font-medium mb-3">Disease details</h3>

            {/* disease detail boxes */}
            <div className="space-y-3">
              {(() => {
                const info = diseaseInfo[selectedDisease] || diseaseInfo.All;
                return (
                  <>
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
                  </>
                );
              })()}
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

      {/* small footer */}
      {/* <div className="mt-4 text-xs text-gray-500">
        Tip: To feed live data later, implement an API that returns a time-series GeoJSON (or per-city series) and update the map source via{" "}
        <code>map.getSource('diseases').setData(newGeoJSON)</code>. Auto-refresh is currently simulated.
      </div> */}
    </section>
  );
}
