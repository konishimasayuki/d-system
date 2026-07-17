import { useEffect, useRef, useState } from "react";
import {
  AreaHotel, COLORS, Card, DRIVER_STATUS, JOB_STATUS, SectionTitle,
  buildDispatchJobs, driverQueue, driverLocationLabel, applyJobAssignment, coordForHotelName,
  castFullName, fmtHour, isoDate,
} from "../shared.jsx";
import { loadGoogleMaps, HOTEL_COORDS } from "../mapsLoader.js";

// ============================================================
// ドライバーピン(車マーク・状態ラベル付き)
// ============================================================
export function driverPinSvg(car, label, color) {
  const num = String(car || "").replace(/[^0-9]/g, "") || "?";
  // 車のシルエット + 車番 + 状態ラベル
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='104' height='74' viewBox='0 0 104 74'>
    <rect x='8' y='2' rx='8' ry='8' width='88' height='20' fill='${color}'/>
    <text x='52' y='16' font-size='12' font-family='sans-serif' font-weight='700' fill='#ffffff' text-anchor='middle'>${label}</text>
    <g transform='translate(28,28)'>
      <rect x='2' y='14' width='44' height='16' rx='4' fill='${color}' stroke='#ffffff' stroke-width='1.5'/>
      <path d='M8 14 L14 5 L34 5 L40 14 Z' fill='${color}' stroke='#ffffff' stroke-width='1.5'/>
      <rect x='15' y='7' width='8' height='6' fill='#ffffff' opacity='0.85'/>
      <rect x='25' y='7' width='8' height='6' fill='#ffffff' opacity='0.85'/>
      <circle cx='13' cy='31' r='5' fill='#20262E' stroke='#ffffff' stroke-width='1.5'/>
      <circle cx='35' cy='31' r='5' fill='#20262E' stroke='#ffffff' stroke-width='1.5'/>
      <text x='24' y='27' font-size='11' font-family='sans-serif' font-weight='800' fill='#ffffff' text-anchor='middle'>${num}</text>
    </g>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

// 未割当ジョブのピン(送り=青系/迎え=緑系で見分け)
function jobPinSvg(kind, timeLabel) {
  const label = kind === "send" ? "送" : "迎";
  const color = kind === "send" ? "#2F6DB5" : "#3E9C74";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='62' viewBox='0 0 80 62'>
    <rect x='4' y='2' rx='7' ry='7' width='72' height='20' fill='${color}'/>
    <text x='40' y='16' font-size='12' font-family='sans-serif' font-weight='700' fill='#ffffff' text-anchor='middle'>${timeLabel}</text>
    <circle cx='40' cy='40' r='13' fill='${color}' stroke='#ffffff' stroke-width='2.5'/>
    <text x='40' y='45' font-size='13' font-family='sans-serif' font-weight='700' fill='#ffffff' text-anchor='middle'>${label}</text>
    <path d='M40 55 l-6 -7 h12 z' fill='${color}'/>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

// ============================================================
// 地図(ドライバー位置・未割当ジョブ・ドライバーごとの経路線)
// ============================================================
export function DriverMap({ drivers, hotels, office, jobs, pinJobs, onJobClick }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const routesRef = useRef([]);
  const officeMarkerRef = useRef(null);
  const [err, setErr] = useState("");

  const coordFor = (name) => coordForHotelName(name, hotels, office, HOTEL_COORDS);
  const officePos = office && office.lat != null ? { lat: office.lat, lng: office.lng } : null;

  const drawRoute = (maps, origin, dest, color) => {
    if (!origin || !dest) return;
    const renderer = new maps.DirectionsRenderer({
      map: mapRef.current, suppressMarkers: true, preserveViewport: true,
      polylineOptions: { strokeColor: color, strokeWeight: 5, strokeOpacity: 0.8 },
    });
    const service = new maps.DirectionsService();
    service.route({ origin, destination: dest, travelMode: maps.TravelMode.DRIVING }, (res, status) => {
      if (status === "OK") renderer.setDirections(res);
    });
    routesRef.current.push(renderer);
  };

  const renderAll = (maps) => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    routesRef.current.forEach((r) => r.setMap(null));
    routesRef.current = [];

    // 営業所マーカー
    if (officePos) {
      if (officeMarkerRef.current) officeMarkerRef.current.setMap(null);
      officeMarkerRef.current = new maps.Marker({
        position: officePos, map: mapRef.current, title: "営業所(出発・戻り)",
        label: { text: "営", color: "#fff", fontSize: "12px", fontWeight: "700" },
        icon: { path: maps.SymbolPath.CIRCLE, scale: 12, fillColor: "#20262E", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
      });
    }

    // ドライバーピン(車マーク)
    (drivers || []).forEach((d) => {
      if (!d.latlng) return;
      const st = DRIVER_STATUS[d.status] || { label: "-", color: "#7A8798" };
      const m = new maps.Marker({
        position: d.latlng, map: mapRef.current, title: `${d.car} ${d.name}(${st.label})`,
        icon: { url: driverPinSvg(d.car, st.label, st.color), anchor: new maps.Point(52, 66), scaledSize: new maps.Size(104, 74) },
        zIndex: 10,
      });
      markersRef.current.push(m);
    });

    // 未割当ジョブのピン(直近2時間ぶんのみ・クリックで割当)
    (pinJobs || []).filter((j) => j.jobStatus === "unassigned").forEach((j) => {
      const pos = coordFor(j.hotel);
      if (!pos) return;
      const m = new maps.Marker({
        position: pos, map: mapRef.current, title: `${j.kind === "send" ? "送り" : "迎え"} ${fmtHour(j.time)} ${j.customer}`,
        icon: { url: jobPinSvg(j.kind, fmtHour(j.time)), anchor: new maps.Point(40, 55), scaledSize: new maps.Size(80, 62) },
        zIndex: 20,
      });
      m.addListener("click", () => onJobClick && onJobClick(j));
      markersRef.current.push(m);
    });

    // ドライバーごとの経路
    (drivers || []).forEach((d) => {
      if (!d.latlng) return;
      const st = DRIVER_STATUS[d.status] || { color: "#2F6DB5" };
      if (d.status === "returning") {
        // 戻り中：現在地 → 営業所
        drawRoute(maps, d.latlng, officePos, st.color);
        return;
      }
      if (d.status === "arrived") {
        // 到着済み：次の担当がなければ営業所へ戻る線
        const queue = driverQueue(jobs || [], d.car);
        if (queue.length === 0) { drawRoute(maps, d.latlng, officePos, st.color); return; }
        let originPos = d.latlng;
        queue.forEach((j) => { const destPos = coordFor(j.hotel); drawRoute(maps, originPos, destPos, st.color); originPos = destPos || originPos; });
        return;
      }
      if (d.status === "dispatch") {
        // 送迎中：現在地 → 次の予定地 → その次…
        const queue = driverQueue(jobs || [], d.car);
        let originPos = d.latlng;
        queue.forEach((j) => { const destPos = coordFor(j.hotel); drawRoute(maps, originPos, destPos, st.color); originPos = destPos || originPos; });
        return;
      }
      // waiting は線なし
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (window.google && window.google.maps && mapRef.current) renderAll(window.google.maps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drivers, hotels, office, jobs, pinJobs]);

  if (err) {
    return <div style={{ width: "100%", aspectRatio: "4 / 3", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "#F2F5F9", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, textAlign: "center", color: COLORS.red, fontSize: 13 }}>{err}</div>;
  }
  return <div ref={ref} style={{ width: "100%", aspectRatio: "4 / 3", borderRadius: 10, border: `1px solid ${COLORS.border}`, overflow: "hidden" }} />;
}

// ============================================================
// 割当ポップアップ(地図ピンクリック時)
// ============================================================
function AssignPopover({ job, drivers, jobs, onAssign, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,35,0.4)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#FFF", borderRadius: 14, width: "100%", maxWidth: 360, padding: 18, boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain, marginBottom: 4 }}>
          {job.kind === "send" ? "送り" : "迎え"}を割り当て
        </div>
        <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 14 }}>{fmtHour(job.time)} ・ {job.customer} ・ {job.hotel}{job.room ? ` ${job.room}` : ""}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflowY: "auto" }}>
          {drivers.map((d) => (
            <button key={d.id} onClick={() => onAssign(d.car)} style={{ display: "flex", flexDirection: "column", gap: 2, padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#FFF", cursor: "pointer", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMain }}>{d.car} ・ {d.name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: DRIVER_STATUS[d.status]?.color, background: `${DRIVER_STATUS[d.status]?.color}1F`, padding: "2px 8px", borderRadius: 999 }}>{DRIVER_STATUS[d.status]?.label}</span>
              </div>
              <span style={{ fontSize: 11, color: COLORS.textSub }}>{driverLocationLabel(d, jobs || [])}</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{ width: "100%", marginTop: 12, padding: "10px 0", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.textSub, fontSize: 13, cursor: "pointer" }}>閉じる</button>
      </div>
    </div>
  );
}

// ============================================================
// 配車管理タブ本体
// ============================================================
export function DispatchMap({ drivers, reservations, setReservations, casts, hotels, office }) {
  const [now, setNow] = useState(new Date());
  const [popoverJob, setPopoverJob] = useState(null);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

  const castName = (id) => casts.find((c) => c.id === id) ? castFullName(casts.find((x) => x.id === id)) : "-";
  const todayStr = isoDate(now);
  const nowHour = now.getHours() + now.getMinutes() / 60;

  const allJobs = buildDispatchJobs(reservations, todayStr);
  // 今の時間から2時間先までのジョブだけを配車対象として一覧・地図に出す
  const listJobs = allJobs.filter((j) => j.time >= nowHour && j.time <= nowHour + 2).sort((a, b) => a.time - b.time);

  const assign = (job, driverCar) => {
    if (driverCar === "未定") {
      setReservations(applyJobAssignment(job.reservationId, job.kind, null));
      return;
    }
    const d = drivers.find((x) => x.car === driverCar);
    const label = d ? `${d.car}・${d.name}` : driverCar;
    const kindLabel = job.kind === "send" ? "送り" : "迎え";
    if (!window.confirm(`${label}さんへ${fmtHour(job.time)} ${job.hotel}の${kindLabel}を割り当てますか？`)) return;
    setReservations(applyJobAssignment(job.reservationId, job.kind, driverCar));
  };

  return (
    <div>
      <SectionTitle sub="直近2時間の送り・迎えを一覧/地図から割り当て。未割当ピンをクリックしてドライバーを選べます">配車管理</SectionTitle>
      <div className="grid-2">
        <Card style={{ padding: 12 }}>
          <DriverMap drivers={drivers} hotels={hotels} office={office} jobs={allJobs} pinJobs={listJobs} onJobClick={setPopoverJob} />
          <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap" }}>
            {Object.entries(DRIVER_STATUS).map(([key, v]) => <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.textSub }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: v.color }} />{v.label}</div>)}
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.textSub }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2F6DB5" }} />送り</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.textSub }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3E9C74" }} />迎え(クリックで割当)</div>
          </div>
        </Card>

        <Card>
          <div style={{ color: COLORS.textSub, fontSize: 12, marginBottom: 12 }}>未割当・直近の送り迎え(今から2時間以内・全{listJobs.length}件)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto", marginBottom: 18 }}>
            {listJobs.length === 0 && <div style={{ fontSize: 12, color: COLORS.textSub }}>直近2時間に対象のジョブはありません。</div>}
            {listJobs.map((j) => {
              const st = JOB_STATUS[j.jobStatus] || JOB_STATUS.unassigned;
              return (
                <div key={j.id} style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#FAFBFD" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.textMain }}>
                      {fmtHour(j.time)}
                      <span style={{ marginLeft: 6, fontSize: 10.5, fontWeight: 700, color: j.kind === "send" ? "#2F6DB5" : "#5C93C4", background: j.kind === "send" ? "#E7F0FA" : "#EEF3FA", padding: "1px 7px", borderRadius: 999 }}>{j.kind === "send" ? "送り" : "迎え"}</span>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: st.color }}>{st.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMain, marginBottom: 6 }}>{castName(j.castId)} ・ {j.customer} ・ {j.hotel}{j.room ? ` ${j.room}` : ""}</div>
                  <select value={j.driverCar} onChange={(e) => assign(j, e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: 12 }}>
                    <option value="未定">未割当</option>
                    {drivers.map((d) => <option key={d.id} value={d.car}>{d.car} ・ {d.name}（{driverLocationLabel(d, allJobs)}）</option>)}
                  </select>
                </div>
              );
            })}
          </div>

          <div style={{ color: COLORS.textSub, fontSize: 12, marginBottom: 12 }}>ドライバー一覧</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {drivers.map((d) => {
              const next = driverQueue(allJobs, d.car)[0];
              return (
                <div key={d.id} style={{ padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ color: COLORS.textMain, fontSize: 14, fontWeight: 600 }}>
                      {d.car} ・ {d.name}
                      <span style={{ marginLeft: 8, fontSize: 11.5, fontWeight: 500, color: COLORS.textSub }}>{driverLocationLabel(d, allJobs)}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: DRIVER_STATUS[d.status].color, background: `${DRIVER_STATUS[d.status].color}1F`, padding: "2px 8px", borderRadius: 999 }}>{DRIVER_STATUS[d.status].label}</span>
                  </div>
                  <div style={{ color: COLORS.textSub, fontSize: 12, marginTop: 4 }}>
                    {next ? `次: ${fmtHour(next.time)} ${next.kind === "send" ? "送り" : "迎え"} ${next.hotel}` : "本日の予定なし"}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {popoverJob && (
        <AssignPopover job={popoverJob} drivers={drivers} jobs={allJobs}
          onAssign={(car) => { assign(popoverJob, car); setPopoverJob(null); }}
          onClose={() => setPopoverJob(null)}
        />
      )}
    </div>
  );
}
