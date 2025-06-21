import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(mod => mod.Polyline), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });
const Circle = dynamic(() => import("react-leaflet").then(mod => mod.Circle), { ssr: false });

import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

if (typeof window !== "undefined" && L && L.Icon && L.Icon.Default) {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x.src || markerIcon2x,
    iconUrl: markerIcon.src || markerIcon,
    shadowUrl: markerShadow.src || markerShadow,
  });
}

const corridors = [
  {
    name: "College Road (NC 132)",
    coords: [
      [34.259342, -77.871241],
      [34.224263, -77.887768],
    ],
    color: "#ff3a30",
    description:
      "College Road is Wilmington's highest-volume arterial, repeatedly topping crash and injury lists. A mix of heavy traffic, commercial access, and insufficient pedestrian/cyclist protection fuels frequent collisions. Planned upgrades remain years away, with rear-end crashes dominating at major intersections.",
  },
  {
    name: "Market Street (US 17 Business)",
    coords: [
      [34.272607, -77.814477],
      [34.234436, -77.908253],
    ],
    color: "#ffd700",
    description:
      "Market Street is a classic suburban arterial—wide, fast, and unforgiving to mistakes. It’s among the region’s deadliest for pedestrians, with miles of missing sidewalks and unprotected crossings. Crash clusters coincide with commercial zones and signalized intersections.",
  },
  {
    name: "Carolina Beach Road (US 421)",
    coords: [
      [34.177892, -77.901659],
      [34.170675, -77.897885],
    ],
    color: "#2db9f5",
    description:
      "Carolina Beach Road is a vital southern corridor marked by a dangerous mix of high speeds, turning conflicts, and missing pedestrian infrastructure. Monkey Junction is a persistent VRU hotspot. Planned median fencing and new crosswalks aim to address deadly conditions.",
  },
  {
    name: "Oleander Drive (US 76)",
    coords: [
      [34.215564, -77.877383],
      [34.208919, -77.916652],
    ],
    color: "#59cb74",
    description:
      "Oleander Drive combines heavy retail traffic with wide, high-speed segments. Rear-end and angle crashes spike at major intersections, especially where turning movements are poorly managed. Pedestrian risk is significant where sidewalk gaps persist.",
  },
  {
    name: "Kerr Avenue",
    coords: [
      [34.242425, -77.871083],
      [34.229174, -77.883717],
    ],
    color: "#ff9800",
    description:
      "Kerr Avenue's recent redesign improved some safety metrics, but complex intersections at Market St and New Centre Dr still see elevated angle crashes. Prohibited left turns and re-routing have helped, but conflict remains due to high volumes and tight turning radii.",
  },
];

const intersections = [
  {
    name: "College Rd & New Centre Dr",
    position: [34.247453, -77.871812],
    crashCount: 171,
    primaryType: "Angle/T-Bone",
    description:
      "Wilmington's worst intersection for crash frequency—especially severe angle collisions. Proximity to major retail, high turning volumes, and signal phasing issues drive risk.",
  },
  {
    name: "Kerr Ave & Market St",
    position: [34.239964, -77.875839],
    crashCount: 124,
    primaryType: "Angle/T-Bone",
    description:
      "Second-highest crash intersection. Left turns recently banned to reduce risk, but high volumes and short signal cycles still produce frequent conflicts.",
  },
  {
    name: "College Rd & Oleander Dr",
    position: [34.215564, -77.877383],
    crashCount: 108,
    primaryType: "Rear-End",
    description:
      "Busy retail zone. Sudden stops and queueing during peak times fuel rear-end crashes.",
  },
  {
    name: "Market St & New Centre Dr",
    position: [34.245789, -77.872684],
    crashCount: 106,
    primaryType: "Angle/T-Bone",
    description:
      "Short, busy connector—site of frequent angle crashes. Crosswalk upgrades coming in 2026, but risk remains high until then.",
  },
];

const vruHotspots = [
  {
    name: "Wooster/Dawson St Corridor",
    center: [34.230847, -77.936201],
    radius: 350,
    description:
      "Historic hotbed for pedestrian injury and death. Disproportionately impacts low-income and minority residents—91% of VRU crashes here occur in high-poverty tracts. Few crosswalks or sidewalk connections.",
    color: "#a020f0",
  },
];

const summaryStats = [
  { year: "2019", Crashes: 4523, Injuries: 6136, Fatalities: 32 },
  { year: "2020", Crashes: 3781, Injuries: 5057, Fatalities: 16 },
  { year: "2021", Crashes: 4239, Injuries: 5590, Fatalities: 28 },
  { year: "2022", Crashes: 4345, Injuries: 5807, Fatalities: 19 },
  { year: "2023", Crashes: 4285, Injuries: 5617, Fatalities: 19 },
];

export default function CrashMapDashboard() {
  const [selectedCorridor, setSelectedCorridor] = useState(null);
  const [selectedIntersection, setSelectedIntersection] = useState(null);
  const [showVRU, setShowVRU] = useState(true);
  const [leafletReady, setLeafletReady] = useState(typeof window !== "undefined");

  React.useEffect(() => {
    setLeafletReady(typeof window !== "undefined");
  }, []);

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold text-center mb-2">Wilmington Traffic Injury & Crash Risk Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            {leafletReady && (
              <MapContainer
                center={[34.233334, -77.916667]}
                zoom={12}
                style={{ height: 520, width: "100%", borderRadius: "1rem" }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                {corridors.map((c, i) => (
                  <Polyline
                    key={i}
                    positions={c.coords}
                    pathOptions={{ color: c.color, weight: 6, opacity: 0.8 }}
                    eventHandlers={{
                      click: () => setSelectedCorridor(c),
                    }}
                  />
                ))}
                {intersections.map((int, i) => (
                  <Marker
                    key={i}
                    position={int.position}
                    eventHandlers={{
                      click: () => setSelectedIntersection(int),
                    }}
                  >
                    <Popup>
                      <b>{int.name}</b><br />
                      {int.description}<br />
                      <span className="text-xs">Crashes (2018-21): {int.crashCount}</span><br />
                      <span className="text-xs">Primary Type: {int.primaryType}</span>
                    </Popup>
                  </Marker>
                ))}
                {showVRU &&
                  vruHotspots.map((v, i) => (
                    <Circle
                      key={i}
                      center={v.center}
                      radius={v.radius}
                      pathOptions={{ color: v.color, fillOpacity: 0.25 }}
                    >
                      <Popup>
                        <b>{v.name}</b><br />
                        {v.description}
                      </Popup>
                    </Circle>
                  ))}
              </MapContainer>
            )}
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="p-2 flex flex-col gap-1">
              <span className="text-lg font-semibold">5-Year Traffic Summary</span>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={summaryStats}>
                  <XAxis dataKey="year" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="Crashes" fill="#ff3a30" />
                  <Bar dataKey="Injuries" fill="#4599ff" />
                  <Bar dataKey="Fatalities" fill="#ffd700" />
                </BarChart>
              </ResponsiveContainer>
              <div className="text-xs text-gray-500 mt-1">Source: NCDOT 2019-2023</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 flex flex-col gap-2">
              <Button
                onClick={() => setShowVRU((v) => !v)}
                variant="outline"
                size="sm"
                className="mb-2"
              >
                {showVRU ? "Hide" : "Show"} Pedestrian & VRU Hotspots
              </Button>
              {selectedCorridor ? (
                <div>
                  <div className="font-bold text-base mb-1">{selectedCorridor.name}</div>
                  <div className="text-xs mb-2">{selectedCorridor.description}</div>
                  <Button size="sm" onClick={() => setSelectedCorridor(null)}>Clear</Button>
                </div>
              ) : selectedIntersection ? (
                <div>
                  <div className="font-bold text-base mb-1">{selectedIntersection.name}</div>
                  <div className="text-xs mb-2">{selectedIntersection.description}</div>
                  <Button size="sm" onClick={() => setSelectedIntersection(null)}>Clear</Button>
                </div>
              ) : (
                <span className="text-sm text-gray-600">
                  Click a corridor or intersection for focused analysis and live interpretation.
                </span>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Card className="mt-4">
        <CardContent className="p-4 text-sm text-gray-700">
          <b>Interpretive Insights:</b><br />
          <ul className="list-disc ml-6">
            <li>
              <b>Corridor Risk:</b> College Rd and Market St form Wilmington's crash spine—handling the highest traffic and injury load. These corridors are not random hotspots; their high volume, outdated design, and poor non-motorist protection make high crash rates <i>predictable</i>.
            </li>
            <li>
              <b>Intersections Matter:</b> The same locations—College/New Centre, Kerr/Market—show up year after year as Wilmington's most dangerous, with crash patterns revealing deeper design or operational flaws.
            </li>
            <li>
              <b>Vulnerable Road User (VRU) Crisis:</b> Pedestrian risk is not spread evenly; it clusters where infrastructure is weakest and poverty highest. Wooster/Dawson’s hotspot is a direct reflection of systemic neglect.
            </li>
            <li>
              <b>Long-term Trends:</b> Overall crash and injury counts remain stubbornly high, barely budging across five years. Fatalities dipped after the pandemic but remain well above public health thresholds.
            </li>
            <li>
              <b>Urgency for Intervention:</b> Data shows you can literally map future injuries—unless bold, rapid action is taken, the same roads will generate the same pain. The dashboard exposes the real-world costs of bureaucratic delay.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

