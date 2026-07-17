import { useState, useEffect } from "react";
import KanriApp from "./KanriApp.jsx";
import PortalApp from "./PortalApp.jsx";

// ============================================================
// ルート振り分け
//  - "/"              → 業務管理システム
//  - "/#cast"         → キャストポータル
//  - "/#driver"       → ドライバーポータル
// ============================================================
function getMode() {
  try {
    const h = window.location.hash.replace(/[#/]/g, "");
    if (h === "cast" || h === "driver") return "portal";
  } catch (e) {}
  return "kanri";
}

export default function App() {
  const [mode, setMode] = useState(getMode());

  useEffect(() => {
    const onHash = () => setMode(getMode());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return mode === "portal" ? <PortalApp /> : <KanriApp />;
}
