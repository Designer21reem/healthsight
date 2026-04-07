"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const COUNTY_COORDS = {
  "Los Angeles":     [-118.2437, 34.0522],
  "San Diego":       [-117.1611, 32.7157],
  "San Francisco":   [-122.4194, 37.7749],
  "Sacramento":      [-121.4944, 38.5816],
  "Fresno":          [-119.7871, 36.7378],
  "Kern":            [-118.7148, 35.4937],
  "Orange":          [-117.8311, 33.7879],
  "Riverside":       [-116.5453, 33.9806],
  "Alameda":         [-122.2711, 37.6017],
  "Santa Clara":     [-121.6908, 37.3541],
  "Contra Costa":    [-121.9496, 37.9161],
  "San Bernardino":  [-116.4194, 34.1083],
  "Ventura":         [-119.229,  34.3705],
  "San Mateo":       [-122.3774, 37.563],
  "Santa Barbara":   [-119.6982, 34.4208],
  "Monterey":        [-121.8947, 36.6002],
  "Sonoma":          [-122.7144, 38.578],
  "Marin":           [-122.7153, 37.9735],
  "Napa":            [-122.2869, 38.2975],
  "Solano":          [-121.9496, 38.2494],
  "Placer":          [-120.8039, 38.8866],
  "Yolo":            [-121.9018, 38.7274],
  "Shasta":          [-122.1916, 40.5865],
  "Butte":           [-121.6036, 39.6677],
  "Humboldt":        [-123.8695, 40.745],
  "San Luis Obispo": [-120.6596, 35.2828],
  "Stanislaus":      [-120.9876, 37.5091],
  "San Joaquin":     [-121.2908, 37.9577],
  "Merced":          [-120.483,  37.1935],
  "Tulare":          [-119.0558, 36.2077],
  "Kings":           [-119.8815, 36.0758],
  "Madera":          [-119.9657, 37.033],
  "El Dorado":       [-120.5265, 38.6963],
  "Nevada":          [-120.9612, 39.2968],
  "Imperial":        [-115.3715, 33.0453],
  "Sutter":          [-121.6944, 39.0325],
  "Yuba":            [-121.413,  39.2746],
  "San Benito":      [-121.075,  36.6077],
  "Lake":            [-122.7519, 39.0979],
  "Mendocino":       [-123.3525, 39.3099],
  "Tehama":          [-122.0352, 40.1243],
  "Glenn":           [-122.3931, 39.5982],
  "Colusa":          [-122.2358, 39.1454],
  "Siskiyou":        [-122.5388, 41.5901],
  "Lassen":          [-120.4363, 40.6718],
  "Plumas":          [-120.8383, 40.0013],
  "Del Norte":       [-123.8352, 41.7679],
  "Trinity":         [-123.1107, 40.6457],
  "Modoc":           [-120.7237, 41.5901],
  "Mono":            [-118.9594, 37.938],
  "Inyo":            [-117.4316, 36.5763],
  "Alpine":          [-119.8217, 38.5966],
  "Sierra":          [-120.5219, 39.5779],
  "Calaveras":       [-120.5588, 38.1949],
  "Amador":          [-120.6543, 38.4491],
  "Tuolumne":        [-119.9741, 37.9635],
  "Mariposa":        [-119.9657, 37.5858],
  "California":      [-119.4179, 36.7783],
};

const DISEASE_INFO = {
  All:        { incubation:"Varies",       transmission:"Multiple modes",               vaccination:"Varies",           prevention:"Hygiene, surveillance" },
  Influenza:  { incubation:"1 – 4 days",   transmission:"Airborne droplets",            vaccination:"Available",        prevention:"Vaccination, masks, hand hygiene" },
  Cholera:    { incubation:"1 – 5 days",   transmission:"Contaminated water/food",      vaccination:"Available (oral)", prevention:"Clean water, sanitation" },
  Measles:    { incubation:"10 – 14 days", transmission:"Airborne droplets",            vaccination:"Available (MMR)",  prevention:"Vaccination, isolation" },
  Dengue:     { incubation:"4 – 10 days",  transmission:"Mosquito-borne",              vaccination:"Limited",          prevention:"Mosquito control, nets" },
  "COVID-19": { incubation:"2 – 14 days",  transmission:"Airborne droplets & aerosols",vaccination:"Available",        prevention:"Vaccination, masks, distancing" },
};

const outbreakBgColor = (l) => l==="red" ? "#EF4444" : l==="yellow" ? "#F59E0B" : "#22C55E";
const levelLabel      = (l) => l==="red" ? "High" : l==="yellow" ? "Mid" : "Normal";
const levelCls        = (l) =>
  l==="red"    ? "bg-red-500 text-white" :
  l==="yellow" ? "bg-yellow-300 text-black" :
                 "bg-green-300 text-black";

// ── Hydration-safe stat card ──────────────────────────────────────────────────
function StatCard({ label, rawValue, sub, color }) {
  const [display, setDisplay] = useState("—");
  useEffect(() => { setDisplay(String(rawValue)); }, [rawValue]);
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1.5 text-lg font-bold ${color}`}>{display}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
    </div>
  );
}

// ── Alert Modal ───────────────────────────────────────────────────────────────
function AlertModal({ county, year, diseases, onClose }) {
  const [selectedDisease, setSelectedDisease] = useState(diseases[0] || "");
  const [message, setMessage]                 = useState("");
  const [sending, setSending]                 = useState(false);
  const [result, setResult]                   = useState(null);
  const [err, setErr]                         = useState(null);

  const defaultMsg =
    `Warning: ${selectedDisease} outbreak risk detected in ${county} (${year}). ` +
    `Please take precautions and seek medical advice if you have symptoms.`;

  const handleSend = async () => {
    setSending(true); setErr(null);
    try {
      const res = await fetch(`${API_BASE}/send-alert`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disease:        selectedDisease,
          county,
          year:           Number(year),
          outbreak_level: "red",
          message:        message.trim() || defaultMsg,
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `HTTP ${res.status}`); }
      setResult(await res.json());
    } catch (e) { setErr(e.message); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Send Alert — {county}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        {result ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-green-800 font-semibold text-sm mb-1">Alert sent successfully ✅</p>
              <p className="text-green-700 text-xs">
                <strong>{result.users_notified}</strong> user{result.users_notified !== 1 ? "s" : ""} in{" "}
                <strong>{county}</strong> received a notification for <strong>{selectedDisease}</strong>.
              </p>
              {result.users_notified === 0 && (
                <p className="text-yellow-700 text-xs mt-2 bg-yellow-50 rounded p-2">
                  No registered users found in <strong>{county}</strong>.
                  Users receive alerts when their county (set during registration) matches the outbreak location.
                </p>
              )}
            </div>
            <button onClick={onClose} className="w-full rounded-md bg-gray-100 px-4 py-2.5 text-sm hover:bg-gray-200">Close</button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Sends a notification to all users registered in <strong>{county}</strong>.
              The notification appears in their bell icon (🔔) in the header.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Disease</label>
              <select value={selectedDisease} onChange={(e) => setSelectedDisease(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm">
                {diseases.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder={defaultMsg} className="w-full rounded-md border px-3 py-2 text-sm resize-none" />
              <p className="text-xs text-gray-400 mt-1">Leave blank to use the default message.</p>
            </div>
            {err && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm">{err}</div>}
            <div className="flex gap-2 pt-1">
              <button onClick={handleSend} disabled={sending}
                className="flex-1 rounded-md bg-red-600 text-white py-2.5 text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {sending ? "Sending…" : "Send Alert"}
              </button>
              <button onClick={onClose} className="rounded-md border px-4 py-2.5 text-sm hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MapPanel() {
  const mapContainer = useRef(null);
  const map          = useRef(null);
  const rafRef       = useRef(null);
  const autoRef      = useRef(null);

  const [predictions, setPredictions]         = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [lastRefresh, setLastRefresh]         = useState(null);
  const [selectedDisease, setSelectedDisease] = useState("All");
  const [selectedCounty, setSelectedCounty]   = useState("All"); // ← NEW
  const [isPlaying, setIsPlaying]             = useState(false);
  const [playSpeed, setPlaySpeed]             = useState(1);
  const [timeIndex, setTimeIndex]             = useState(0);
  const [startYear, setStartYear]             = useState(null);
  const [endYear, setEndYear]                 = useState(null);
  const [timeSteps, setTimeSteps]             = useState([]);
  const [alertModal, setAlertModal]           = useState(null);

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const url =
        selectedDisease === "All"
          ? `${API_BASE}/predictions?sex=Total`
          : `${API_BASE}/predictions/disease/${encodeURIComponent(selectedDisease)}?sex=Total`;

      const res  = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setPredictions(data);
      setLastRefresh(new Date().toLocaleTimeString());

      const years = [...new Set(data.map((r) => String(r.year)))].sort();
      setTimeSteps(years);
      setTimeIndex((i) => Math.min(i, Math.max(0, years.length - 1)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDisease]);

  useEffect(() => {
    fetchData();
    autoRef.current = setInterval(fetchData, 60_000);
    return () => clearInterval(autoRef.current);
  }, [fetchData]);

  // Reset county filter when disease changes
  useEffect(() => { setSelectedCounty("All"); }, [selectedDisease]);

  // Counties available in current data
  const countiesInDB = React.useMemo(
    () => [...new Set(predictions.map((r) => r.county))].sort(),
    [predictions]
  );

  // ── GeoJSON — filters by both disease AND county ──────────────────────────
  const buildGeoJSON = useCallback(
    (yearStr, diseaseFilter, countyFilter) => {
      const filtered = predictions.filter(
        (r) =>
          String(r.year) === yearStr &&
          (diseaseFilter === "All" || r.disease === diseaseFilter) &&
          (countyFilter  === "All" || r.county  === countyFilter)
      );

      const byCounty = {};
      filtered.forEach((r) => {
        if (!byCounty[r.county])
          byCounty[r.county] = { observed:0, predicted:0, zscore:0, level:"green", diseases:{} };
        const c = byCounty[r.county];
        c.observed  += r.count           || 0;
        c.predicted += r.predicted_cases || 0;
        c.zscore     = Math.max(c.zscore, Math.abs(r.zscore || 0));

        if (r.outbreak_level === "red")                               c.level = "red";
        else if (r.outbreak_level === "yellow" && c.level !== "red") c.level = "yellow";

        if (!c.diseases[r.disease]) c.diseases[r.disease] = { predicted:0, observed:0 };
        c.diseases[r.disease].predicted += r.predicted_cases || 0;
        c.diseases[r.disease].observed  += r.count           || 0;
      });

      const features = Object.entries(byCounty)
        .map(([county, c]) => {
          const coords = COUNTY_COORDS[county];
          if (!coords || c.predicted === 0) return null;
          return {
            type: "Feature",
            geometry: { type:"Point", coordinates:coords },
            properties: {
              city:     county,
              cases:    Math.round(c.predicted),
              observed: Math.round(c.observed),
              zscore:   Math.round(c.zscore * 100) / 100,
              level:    c.level,
              diseases: JSON.stringify(c.diseases),
              date:     yearStr,
            },
          };
        })
        .filter(Boolean);

      return { type:"FeatureCollection", features };
    },
    [predictions]
  );

  // ── Mapbox ────────────────────────────────────────────────────────────────
  const safeResize = useCallback(() => {
    requestAnimationFrame(() => { try { map.current?.resize(); } catch {} });
  }, []);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style:     "mapbox://styles/mapbox/dark-v11",
      center:    [-119.4179, 36.7783],
      zoom:      5.5,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(new mapboxgl.ScaleControl({ maxWidth:140, unit:"metric" }), "bottom-left");

    map.current.on("load", () => {
      map.current.addSource("diseases", { type:"geojson", data:{ type:"FeatureCollection", features:[] } });

      map.current.addLayer({
        id:"disease-heatmap", type:"heatmap", source:"diseases", maxzoom:8,
        paint:{
          "heatmap-weight":    ["interpolate",["linear"],["get","cases"],0,0,2000,1],
          "heatmap-intensity": ["interpolate",["linear"],["zoom"],0,1,8,3],
          "heatmap-color":     ["interpolate",["linear"],["heatmap-density"],
            0,"rgba(0,0,255,0)",0.2,"royalblue",0.5,"cyan",0.8,"orange",1,"red"],
          "heatmap-radius":    ["interpolate",["linear"],["zoom"],0,20,8,70],
          "heatmap-opacity":   0.75,
        },
      });

      map.current.addLayer({
        id:"disease-points", type:"circle", source:"diseases", minzoom:5,
        paint:{
          "circle-radius": ["interpolate",["linear"],["get","cases"],0,5,200,12,1000,20,5000,30],
          "circle-color": [
            "case",
            ["==",["get","level"],"red"],    "#EF4444",
            ["==",["get","level"],"yellow"], "#F59E0B",
            "#22C55E",
          ],
          "circle-stroke-color":"#ffffff",
          "circle-stroke-width":1.5,
          "circle-opacity":0.88,
        },
      });

      setTimeout(safeResize, 0);

      map.current.on("click", "disease-points", (e) => {
        if (!e.features?.[0]) return;
        const p      = e.features[0].properties;
        const coords = e.features[0].geometry.coordinates.slice();

        let tableRows = "";
        try {
          const dis = JSON.parse(p.diseases || "{}");
          Object.entries(dis).sort((a, b) => b[1].predicted - a[1].predicted).forEach(([name, vals]) => {
            tableRows += `
              <tr style="border-bottom:1px solid #374151">
                <td style="padding:4px 8px 4px 0;color:#D1D5DB">${name}</td>
                <td style="padding:4px;text-align:right;color:#93C5FD;font-weight:600">${Math.round(vals.predicted).toLocaleString()}</td>
                <td style="padding:4px 0 4px 8px;text-align:right;color:#9CA3AF">${Math.round(vals.observed).toLocaleString()}</td>
              </tr>`;
          });
        } catch {}

        const html = `
          <div style="font-family:sans-serif;font-size:13px;line-height:1.6;min-width:240px">
            <div style="font-size:15px;font-weight:700;margin-bottom:2px">${p.city}</div>
            <div style="color:#9CA3AF;font-size:11px;margin-bottom:8px">Year ${p.date}</div>
            <div style="display:flex;justify-content:space-between;margin-bottom:3px">
              <span style="color:#9CA3AF">Total predicted</span>
              <span style="color:#3B82F6;font-weight:700">${Number(p.cases).toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:3px">
              <span style="color:#9CA3AF">Total observed</span>
              <span style="font-weight:600">${Number(p.observed).toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span style="color:#9CA3AF">Risk level</span>
              <span style="color:${outbreakBgColor(p.level)};font-weight:700">${p.level?.toUpperCase()}</span>
            </div>
            ${tableRows ? `
            <div style="border-top:1px solid #374151;padding-top:8px">
              <div style="color:#6B7280;font-size:11px;margin-bottom:4px">Cases by disease</div>
              <table style="width:100%;border-collapse:collapse;font-size:11px">
                <thead><tr>
                  <th style="text-align:left;color:#6B7280;padding-bottom:4px">Disease</th>
                  <th style="text-align:right;color:#6B7280;padding-bottom:4px">Predicted</th>
                  <th style="text-align:right;color:#6B7280;padding-bottom:4px;padding-left:8px">Observed</th>
                </tr></thead>
                <tbody>${tableRows}</tbody>
              </table>
            </div>` : ""}
          </div>`;

        new mapboxgl.Popup({ maxWidth:"320px" }).setLngLat(coords).setHTML(html).addTo(map.current);
      });

      map.current.on("mouseenter","disease-points",() => { map.current.getCanvas().style.cursor="pointer"; });
      map.current.on("mouseleave","disease-points",() => { map.current.getCanvas().style.cursor=""; });
    });

    const onResize = () => safeResize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      map.current?.remove();
      map.current = null;
    };
  }, [safeResize]);

  useEffect(() => {
    if (!map.current || !timeSteps.length) return;
    const src = map.current.getSource("diseases");
    if (!src) return;
    try { src.setData(buildGeoJSON(timeSteps[timeIndex], selectedDisease, selectedCounty)); } catch {}
  }, [predictions, selectedDisease, selectedCounty, timeIndex, timeSteps, buildGeoJSON]);

  useEffect(() => { setTimeout(safeResize, 0); }, [selectedDisease, selectedCounty, startYear, endYear, safeResize]);

  // When county selected, fly to it
  useEffect(() => {
    if (selectedCounty !== "All" && map.current) {
      const coords = COUNTY_COORDS[selectedCounty];
      if (coords) map.current.flyTo({ center: coords, zoom: 8, duration: 1000 });
    } else if (selectedCounty === "All" && map.current) {
      map.current.flyTo({ center: [-119.4179, 36.7783], zoom: 5.5, duration: 800 });
    }
  }, [selectedCounty]);

  // ── animation ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let last = null;
    const step = (ts) => {
      if (!last) last = ts;
      if (ts - last >= 900 / Math.max(0.25, playSpeed)) {
        last = ts;
        setTimeIndex((i) => {
          const f = timeSteps.filter(
            (d) => (!startYear || d >= startYear) && (!endYear || d <= endYear)
          );
          if (!f.length) return i;
          const pos = f.indexOf(timeSteps[i]);
          return timeSteps.indexOf(f[pos === -1 ? 0 : (pos + 1) % f.length]);
        });
      }
      rafRef.current = requestAnimationFrame(step);
    };
    if (isPlaying) rafRef.current = requestAnimationFrame(step);
    else { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    return () => { cancelAnimationFrame(rafRef.current); rafRef.current = null; };
  }, [isPlaying, playSpeed, timeSteps, startYear, endYear]);

  const moveBy = (delta) => setTimeIndex((i) => {
    const f = timeSteps.filter(
      (d) => (!startYear || d >= startYear) && (!endYear || d <= endYear)
    );
    if (!f.length) return i;
    const pos = f.indexOf(timeSteps[i]);
    return timeSteps.indexOf(f[Math.max(0, Math.min(f.length - 1, (pos === -1 ? 0 : pos) + delta))]);
  });

  // ── derived stats ─────────────────────────────────────────────────────────
  const statsData = React.useMemo(() => {
    if (!timeSteps.length) return { totalPredicted:0, totalObserved:0, highRisk:0, cities:[] };
    const geo   = buildGeoJSON(timeSteps[timeIndex], selectedDisease, selectedCounty);
    const feats = geo.features;
    return {
      totalPredicted: feats.reduce((s, f) => s + (f.properties.cases    || 0), 0),
      totalObserved:  feats.reduce((s, f) => s + (f.properties.observed || 0), 0),
      highRisk:       feats.filter((f) => f.properties.level === "red").length,
      cities: feats
        .sort((a, b) => b.properties.cases - a.properties.cases)
        .map((f) => {
          let diseases = [];
          try { diseases = Object.keys(JSON.parse(f.properties.diseases || "{}")); } catch {}
          return {
            city:      f.properties.city,
            predicted: f.properties.cases,
            observed:  f.properties.observed,
            level:     f.properties.level,
            coords:    f.geometry.coordinates,
            diseases,
          };
        }),
    };
  }, [timeIndex, timeSteps, selectedDisease, selectedCounty, buildGeoJSON]);

  const visibleDiseases = React.useMemo(() => {
    const year = timeSteps[timeIndex];
    if (!year) return [];
    return [...new Set(
      predictions
        .filter((r) =>
          String(r.year) === year &&
          (selectedDisease === "All" || r.disease === selectedDisease) &&
          (selectedCounty  === "All" || r.county  === selectedCounty)
        )
        .map((r) => r.disease)
    )].sort();
  }, [predictions, timeSteps, timeIndex, selectedDisease, selectedCounty]);

  const hasHighRisk = statsData.highRisk > 0;
  const info        = DISEASE_INFO[selectedDisease] || DISEASE_INFO.All;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      {alertModal && (
        <AlertModal
          county={alertModal.county}
          year={alertModal.year}
          diseases={alertModal.diseases.length ? alertModal.diseases : visibleDiseases}
          onClose={() => setAlertModal(null)}
        />
      )}

      <section className="p-3 sm:p-4">
        <div className="rounded-lg bg-white p-4 sm:p-6 shadow-sm">

          {/* Header */}
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold">Outbreaks Map</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Predicted cases by county
                  {" · "}Last refresh: <span suppressHydrationWarning>{lastRefresh || "—"}</span>
                  {loading && <span className="ml-2 text-blue-400">loading…</span>}
                  {error   && <span className="ml-2 text-red-500">Error: {error}</span>}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const firstHighRisk = statsData.cities.find((c) => c.level === "red");
                    setAlertModal({
                      county:   firstHighRisk?.city || statsData.cities[0]?.city || "California",
                      year:     Number(timeSteps[timeIndex] || 2014),
                      diseases: visibleDiseases,
                    });
                  }}
                  disabled={!hasHighRisk}
                  title={hasHighRisk ? "Send alert to users in high-risk areas" : "No high-risk areas in current view"}
                  className="flex items-center gap-1.5 rounded-md bg-red-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ⚠ Send Alert
                </button>

                <button onClick={fetchData} disabled={loading}
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40">
                  Refresh
                </button>
              </div>
            </div>

            {/* Filters — Disease + County + Year range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Disease */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Disease</label>
                <select
                  value={selectedDisease}
                  onChange={(e) => setSelectedDisease(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="All">All diseases</option>
                  {[...new Set(predictions.map((r) => r.disease))].sort().map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* County — NEW */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">County</label>
                <select
                  value={selectedCounty}
                  onChange={(e) => setSelectedCounty(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="All">All counties</option>
                  {countiesInDB.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* From year */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">From year</label>
                <input
                  type="number" min="2001" max="2030"
                  value={startYear || ""} placeholder="2001"
                  onChange={(e) => setStartYear(e.target.value || null)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              {/* To year */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">To year</label>
                <input
                  type="number" min="2001" max="2030"
                  value={endYear || ""} placeholder="2014"
                  onChange={(e) => setEndYear(e.target.value || null)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Active filters badge */}
            {(selectedDisease !== "All" || selectedCounty !== "All") && (
              <div className="flex flex-wrap gap-2">
                {selectedDisease !== "All" && (
                  <span className="flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-1">
                    Disease: {selectedDisease}
                    <button onClick={() => setSelectedDisease("All")} className="ml-1 hover:text-blue-900">×</button>
                  </span>
                )}
                {selectedCounty !== "All" && (
                  <span className="flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs px-3 py-1">
                    County: {selectedCounty}
                    <button onClick={() => setSelectedCounty("All")} className="ml-1 hover:text-purple-900">×</button>
                  </span>
                )}
                <button
                  onClick={() => { setSelectedDisease("All"); setSelectedCounty("All"); }}
                  className="text-xs text-gray-400 hover:text-gray-700 underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="rounded-xl overflow-hidden shadow-lg mb-4">
            <div ref={mapContainer} className="w-full h-[360px] sm:h-[480px]" />
          </div>

          {!loading && predictions.length === 0 && (
            <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              No data. Run <code className="bg-yellow-100 px-1 rounded">POST /load-csv</code> to load the dataset.
            </div>
          )}

          {/* Playback */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3">
              <button onClick={() => moveBy(-1)} className="rounded-md border px-3 py-2 text-sm">◀ Prev</button>
              <button onClick={() => setIsPlaying((p) => !p)} className="rounded-md border px-3 py-2 text-sm">
                {isPlaying ? "Pause ⏸" : "Play ▶"}
              </button>
              <button onClick={() => moveBy(1)} className="rounded-md border px-3 py-2 text-sm col-span-2 sm:col-auto">Next ▶</button>
              <div className="flex items-center gap-2 sm:ml-4">
                <label className="text-sm text-gray-700">Speed</label>
                <select value={playSpeed} onChange={(e) => setPlaySpeed(Number(e.target.value))}
                  className="rounded-md border px-2 py-1.5 text-sm">
                  <option value={0.5}>0.5×</option>
                  <option value={1}>1×</option>
                  <option value={2}>2×</option>
                  <option value={4}>4×</option>
                </select>
              </div>
              <div className="text-sm mt-1.5 sm:mt-0 text-gray-600 sm:ml-auto">
                Year: <span className="font-semibold">{timeSteps[timeIndex] || "—"}</span>
              </div>
            </div>

            <input
              type="range" min={0} max={Math.max(0, timeSteps.length - 1)}
              value={timeIndex} onChange={(e) => setTimeIndex(Number(e.target.value))}
              className="w-full"
            />

            <div className="flex justify-between text-xs text-gray-400">
              <span>{timeSteps[0] || ""}</span>
              <span>{timeSteps[Math.floor((timeSteps.length - 1) / 2)] || ""}</span>
              <span>{timeSteps[timeSteps.length - 1] || ""}</span>
            </div>
          </div>

          {/* Bottom panel */}
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Predicted cases"
                rawValue={new Intl.NumberFormat().format(Math.round(statsData.totalPredicted))}
                sub="model prediction" color="text-blue-600"
              />
              <StatCard
                label="Observed cases"
                rawValue={new Intl.NumberFormat().format(Math.round(statsData.totalObserved))}
                sub="actual count" color="text-gray-700"
              />
              <StatCard
                label="High-risk areas"
                rawValue={`${statsData.highRisk} / ${statsData.cities.length}`}
                sub="z-score > 2" color="text-red-600"
              />
              <StatCard
                label="DB records"
                rawValue={predictions.length.toLocaleString()}
                sub="Supabase (Total)" color="text-gray-700"
              />
            </div>

            {/* County list */}
            <div>
              <h3 className="font-medium mb-3">Top counties</h3>
              <div className="space-y-2 max-h-64 overflow-auto pr-1">
                {statsData.cities.length === 0 && (
                  <p className="text-sm text-gray-400">No counties for this selection.</p>
                )}
                {statsData.cities.map((c) => (
                  <div key={c.city} className="flex items-center justify-between rounded-lg border bg-white p-3 shadow-sm">
                    <div
                      className="cursor-pointer flex-1 min-w-0"
                      onClick={() => {
                        setSelectedCounty(c.city);
                        map.current?.flyTo({ center: c.coords, zoom: 8 });
                      }}
                    >
                      <p className="font-medium text-sm truncate">{c.city}</p>
                      <p className="text-xs text-blue-600">{Number(c.predicted).toLocaleString()} predicted</p>
                      <p className="text-xs text-gray-400">{Number(c.observed).toLocaleString()} observed</p>
                    </div>

                    <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${levelCls(c.level)}`}>
                        {levelLabel(c.level)}
                      </span>
                      {c.level === "red" && (
                        <button
                          onClick={() => setAlertModal({
                            county:   c.city,
                            year:     Number(timeSteps[timeIndex] || 2014),
                            diseases: c.diseases,
                          })}
                          className="h-7 w-7 rounded-md bg-red-500 text-white flex items-center justify-center text-sm"
                          title={`Send alert for ${c.city}`}
                        >⚠</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Disease info + legend */}
            <div>
              <h3 className="font-medium mb-3">Disease details</h3>
              <div className="space-y-2 mb-4">
                {[
                  { label:"Incubation",   val:info.incubation,   cls:"text-blue-600"  },
                  { label:"Transmission", val:info.transmission, cls:"text-red-600"   },
                  { label:"Vaccination",  val:info.vaccination,  cls:"text-green-600" },
                  { label:"Prevention",   val:info.prevention,   cls:"text-blue-600"  },
                ].map(({ label, val, cls }) => (
                  <div key={label} className="rounded-lg border p-3 flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{label}</span>
                    <span className={`text-xs font-semibold text-right ${cls}`}>{val}</span>
                  </div>
                ))}
              </div>

              <h3 className="font-medium mb-2">Risk legend</h3>
              <div className="rounded-lg border p-3 space-y-2">
                {[
                  { color:"#EF4444", label:"High — z-score > 2"    },
                  { color:"#F59E0B", label:"Moderate — z-score > 1" },
                  { color:"#22C55E", label:"Normal"                  },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background:color }} />
                    <span className="text-xs text-gray-600">{label}</span>
                  </div>
                ))}
                <hr className="my-1" />
                <p className="text-xs text-gray-400 leading-relaxed">
                  Risk from z-score in DB. Click a dot for disease breakdown.
                  Alert ⚠ sends to users whose county matches.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}