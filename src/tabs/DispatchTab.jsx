import { useEffect, useRef, useState } from "react";
import { AreaHotel, COLORS, Card, DRIVER_STATUS, SectionTitle, castFullName, fmtHour } from "../shared.jsx";
import { loadGoogleMaps, HOTEL_COORDS } from "../mapsLoader.js";

// ============================================================
export function driverPinSvg(car, label, color) {
  const num = String(car || "").replace(/[^0-9]/g, "") || "?";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='66' viewBox='0 0 96 66'>
    <rect x='6' y='2' rx='8' ry='8' width='84' height='22' fill='${color}'/>
    <text x='48' y='17' font-size='13' font-family='sans-serif' font-weight='700' fill='#ffffff' text-anchor='middle'>${label}</text>
    <circle cx='48' cy='42' r='14' fill='${color}' stroke='#ffffff' stroke-width='2.5'/>
    <text x='48' y='47' font-size='14' font-family='sans-serif' font-weight='700' fill='#ffffff' text-anchor='middle'>${num}</text>
    <path d='M48 58 l-7 -8 h14 z' fill='${color}'/>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

export function DriverMap({ drivers, hotels, office }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const routesRef = useRef([]);
  const officeMarkerRef = useRef(null);
  const [err, setErr] = useState("");

  const coordForDest = (dest) => {
    if (!dest) return null;
    if (dest === "営業所") return office ? { lat: office.lat, lng: office.lng } : null;
    const h = (hotels || []).find((x) => x.name === dest);
    return h && h.lat != null ? { lat: h.lat, lng: h.lng } : (HOTEL_COORDS[dest] || null);
  };

  const renderAll = (maps) => {
    // マーカー再描画
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    routesRef.current.forEach((r) => r.setMap(null));
    routesRef.current = [];

    // 営業所マーカー
    if (office && office.lat != null) {
      if (officeMarkerRef.current) officeMarkerRef.current.setMap(null);
      officeMarkerRef.current = new maps.Marker({
        position: { lat: office.lat, lng: office.lng }, map: mapRef.current, title: "営業所(出発・戻り)",
        label: { text: "営", color: "#fff", fontSize: "12px", fontWeight: "700" },
        icon: { path: maps.SymbolPath.CIRCLE, scale: 12, fillColor: "#20262E", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
      });
    }

    drivers.forEach((d) => {
      if (!d.latlng) return;
      const st = DRIVER_STATUS[d.status] || { label: "-", color: "#7A8798" };
      // ピン(状態ラベル付き)
      const m = new maps.Marker({
        position: d.latlng, map: mapRef.current, title: `${d.car} ${d.name}(${st.label})`,
        icon: { url: driverPinSvg(d.car, st.label, st.color), anchor: new maps.Point(48, 58), scaledSize: new maps.Size(96, 66) },
        zIndex: 10,
      });
      markersRef.current.push(m);

      // ルート(待機中以外で目的地があるとき)
      const destPos = coordForDest(d.dest);
      if (d.status !== "waiting" && destPos) {
        const renderer = new maps.DirectionsRenderer({
          map: mapRef.current, suppressMarkers: true, preserveViewport: true,
          polylineOptions: { strokeColor: st.color, strokeWeight: 5, strokeOpacity: 0.85 },
        });
        const service = new maps.DirectionsService();
        service.route({ origin: d.latlng, destination: destPos, travelMode: maps.TravelMode.DRIVING }, (res, status) => {
          if (status === "OK") renderer.setDirections(res);
        });
        routesRef.current.push(renderer);
      }
    });
  };

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then((maps) => {
      if (cancelled || !ref.current) return;
      mapRef.current = new maps.Map(ref.current, {
        center: { lat: 33.5902, lng: 130.4017 }, zoom: 12,
        mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
      });
      renderAll(maps);
    }).catch((e) => {
      setErr(e.message === "no-key"
        ? "地図APIキーが未設定です（VITE_GOOGLE_MAPS_API_KEY）。"
        : "地図の読み込みに失敗しました。ネットワークまたはキー制限をご確認ください。");
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (window.google && window.google.maps && mapRef.current) renderAll(window.google.maps);
  }, [drivers, hotels, office]);

  if (err) {
    return <div style={{ width: "100%", aspectRatio: "4 / 3", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "#F2F5F9", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, textAlign: "center", color: COLORS.red, fontSize: 13 }}>{err}</div>;
  }
  return <div ref={ref} style={{ width: "100%", aspectRatio: "4 / 3", borderRadius: 10, border: `1px solid ${COLORS.border}`, overflow: "hidden" }} />;
}

export function DispatchMap({ drivers, reservations, casts, hotels, office }) {
  const castName = (id) => casts.find((c) => c.id === id) ? castFullName(casts.find((x) => x.id === id)) : "-";
  return (
    <div>
      <SectionTitle sub="ドライバーの現在位置・状態・向かう先を確認">配車管理</SectionTitle>
      <div className="grid-2">
        <Card style={{ padding: 12 }}>
          <DriverMap drivers={drivers} hotels={hotels} office={office} />
          <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap" }}>
            {Object.entries(DRIVER_STATUS).map(([key, v]) => <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.textSub }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: v.color }} />{v.label}</div>)}
          </div>
        </Card>
        <Card>
          <div style={{ color: COLORS.textSub, fontSize: 12, marginBottom: 12 }}>ドライバー一覧</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {drivers.map((d) => (
              <div key={d.id} style={{ padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: COLORS.textMain, fontSize: 14, fontWeight: 600 }}>{d.car} ・ {d.name}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: DRIVER_STATUS[d.status].color, background: `${DRIVER_STATUS[d.status].color}1F`, padding: "2px 8px", borderRadius: 999 }}>{DRIVER_STATUS[d.status].label}</span>
                </div>
                <div style={{ color: COLORS.textSub, fontSize: 12, marginTop: 4 }}>{d.note}</div>
              </div>
            ))}
          </div>
          <div style={{ color: COLORS.textSub, fontSize: 12, margin: "18px 0 12px" }}>送迎対応中の予約</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reservations.filter((r) => r.status === "接客中" || r.status === "移動中").map((r) => <div key={r.id} style={{ fontSize: 12, color: COLORS.textMain }}>{fmtHour(r.start)} {r.customer} → {castName(r.castId)} / <AreaHotel area={r.area} hotel={r.hotel} /></div>)}
          </div>
        </Card>
      </div>
    </div>
  );
}
