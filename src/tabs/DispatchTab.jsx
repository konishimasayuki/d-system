import { useEffect, useRef, useState } from "react";
import {
  AreaHotel, COLORS, Card, DRIVER_STATUS, JOB_STATUS, SectionTitle,
  buildDispatchJobs, driverQueue, applyJobAssignment, coordForHotelName,
  castFullName, fmtHour, isoDate,
} from "../shared.jsx";
import { loadGoogleMaps, HOTEL_COORDS } from "../mapsLoader.js";

// ============================================================
// ドライバーピン(車番・状態ラベル付き)
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

// 未割当ジョブのピン(送り/迎え・時刻表示)
function jobPinSvg(kind, timeLabel) {
  const label = kind === "send" ? "送" : "迎";
  const color = "#C0492B";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='76' height='60' viewBox='0 0 76 60'>
    <rect x='4' y='2' rx='7' ry='7' width='68' height='20' fill='${color}'/>
    <text x='38' y='16' font-size='12' font-family='sans-serif' font-weight='700' fill='#ffffff' text-anchor='middle'>${timeLabel}</text>
    <circle cx='38' cy='38' r='13' fill='${color}' stroke='#ffffff' stroke-width='2.5'/>
    <text x='38' y='43' font-size='13' font-family='sans-serif' font-weight='700' fill='#ffffff' text-anchor='middle'>${label}</text>
    <path d='M38 53 l-6 -7 h12 z' fill='${color}'/>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

// ============================================================
// 地図(ドライバー位置・未割当ジョブ・ドライバーごとの経路線)
// ============================================================
export function DriverMap({ drivers, hotels, office, jobs, onJobClick }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const routesRef = useRef([]);
  const officeMarkerRef = useRef(null);
  const [err, setErr] = useState("");

  const coordFor = (name) => coordForHotelName(name, hotels, office, HOTEL_COORDS);

  const renderAll = (maps) => {
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

    // ドライバーピン
    (drivers || []).forEach((d) => {
      if (!d.latlng) return;
      const st = DRIVER_STATUS[d.status] || { label: "-", color: "#7A8798" };
      const m = new maps.Marker({
        position: d.latlng, map: mapRef.current, title: `${d.car} ${d.name}(${st.label})`,
        icon: { url: driverPinSvg(d.car, st.label, st.color), anchor: new maps.Point(48, 58), scaledSize: new maps.Size(96, 66) },
        zIndex: 10,
      });
      markersRef.current.push(m);
    });

    // 未割当ジョブのピン(クリックで割当)
    (jobs || []).filter((j) => j.jobStatus === "unassigned").forEach((j) => {
      const pos = coordFor(j.hotel);
      if (!pos) return;
      const m = new maps.Marker({
        position: pos, map: mapRef.current, title: `${j.kind === "send" ? "送り" : "迎え"} ${fmtHour(j.time)} ${j.customer}`,
        icon: { url: jobPinSvg(j.kind, fmtHour(j.time)), anchor: new maps.Point(38, 53), scaledSize: new maps.Size(76, 60) },
        zIndex: 20,
      });
      m.addListener("click", () => onJobClick && onJobClick(j));
      markersRef.current.push(m);
    });

    // ドライバーごとの経路(現在地→次の予定地→その次…を連続した線で)
    (drivers || []).forEach((d) => {
      if (!d.latlng) return;
      const queue = driverQueue(jobs || [], d.car);
      let originPos = d.latlng;
      const st = DRIVER_STATUS[d.status] || { color: "#2F6DB5" };
      queue.forEach((j) => {
        const destPos = coordFor(j.hotel);
        if (destPos && originPos) {
          const renderer = new maps.DirectionsRenderer({
            map: mapRef.current, suppressMarkers: true, preserveViewport: true,
            polylineOptions: { strokeColor: st.color, strokeWeight: 4, strokeOpacity: 0.75 },
          });
          const service = new maps.DirectionsService();
          service.route({ origin: originPos, destination: destPos, travelMode: maps.TravelMode.DRIVING }, (res, status) => {
            if (status === "OK") renderer.setDirections(res);
          });
          routesRef.current.push(renderer);
        }
        originPos = destPos || originPos;
      });
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
  }, [drivers, hotels, office, jobs]);

  if (err) {
    return <div style={{ width: "100%", aspectRatio: "4 / 3", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "#F2F5F9", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, textAlign: "center", color: COLORS.red, fontSize: 13 }}>{err}</div>;
  }
  return <div ref={ref} style={{ width: "100%", aspectRatio: "4 / 3", borderRadius: 10, border: `1px solid ${COLORS.border}`, overflow: "hidden" }} />;
}

// ============================================================
// 割当ポップアップ(地図ピンクリック時)
// ============================================================
function AssignPopover({ job, drivers, onAssign, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,35,0.4)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#FFF", borderRadius: 14, width: "100%", maxWidth: 360, padding: 18, boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textMain, marginBottom: 4 }}>
          {job.kind === "send" ? "送り" : "迎え"}を割り当て
        </div>
        <div style={{ fontSize: 12, color: COLORS.textSub, marginBottom: 14 }}>{fmtHour(job.time)} ・ {job.customer} ・ {job.hotel}{job.room ? ` ${job.room}` : ""}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflowY: "auto" }}>
          {drivers.map((d) => (
            <button key={d.id} onClick={() => onAssign(d.car)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#FFF", cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textMain }}>{d.car} ・ {d.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: DRIVER_STATUS[d.status]?.color, background: `${DRIVER_STATUS[d.status]?.color}1F`, padding: "2px 8px", borderRadius: 999 }}>{DRIVER_STATUS[d.status]?.label}</span>
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
  // 直近2時間(30分前〜2時間先)のジョブだけを配車対象として一覧・地図に出す
  const windowJobs = allJobs.filter((j) => j.time >= nowHour - 0.5 && j.time <= nowHour + 2);
  const overdueUnassigned = allJobs.filter((j) => j.jobStatus === "unassigned" && j.time < nowHour - 0.5);
  const listJobs = [...overdueUnassigned, ...windowJobs].sort((a, b) => a.time - b.time);

  const assign = (job, driverCar) => setReservations(applyJobAssignment(job.reservationId, job.kind, driverCar === "未定" ? null : driverCar));

  return (
    <div>
      <SectionTitle sub="直近2時間の送り・迎えを一覧/地図から割り当て。未割当ピンをクリックしてドライバーを選べます">配車管理</SectionTitle>
      <div className="grid-2">
        <Card style={{ padding: 12 }}>
          <DriverMap drivers={drivers} hotels={hotels} office={office} jobs={allJobs} onJobClick={setPopoverJob} />
          <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap" }}>
            {Object.entries(DRIVER_STATUS).map(([key, v]) => <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.textSub }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: v.color }} />{v.label}</div>)}
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.textSub }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#C0492B" }} />未割当ジョブ(クリックで割当)</div>
          </div>
        </Card>

        <Card>
          <div style={{ color: COLORS.textSub, fontSize: 12, marginBottom: 12 }}>未割当・直近の送り迎え(全{listJobs.length}件)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto", marginBottom: 18 }}>
            {listJobs.length === 0 && <div style={{ fontSize: 12, color: COLORS.textSub }}>直近2時間に対象のジョブはありません。</div>}
            {listJobs.map((j) => {
              const overdue = j.jobStatus === "unassigned" && j.time < nowHour;
              const st = JOB_STATUS[j.jobStatus] || JOB_STATUS.unassigned;
              return (
                <div key={j.id} style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${overdue ? COLORS.red : COLORS.border}`, background: overdue ? "#FBEAE5" : "#FAFBFD" }}>
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
                    {drivers.map((d) => <option key={d.id} value={d.car}>{d.car} ・ {d.name}</option>)}
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
                    <div style={{ color: COLORS.textMain, fontSize: 14, fontWeight: 600 }}>{d.car} ・ {d.name}</div>
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
        <AssignPopover job={popoverJob} drivers={drivers}
          onAssign={(car) => { assign(popoverJob, car); setPopoverJob(null); }}
          onClose={() => setPopoverJob(null)}
        />
      )}
    </div>
  );
}
