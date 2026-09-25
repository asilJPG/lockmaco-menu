"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function getOrCreateVisitorId(): string {
  try {
    let id = localStorage.getItem("lokmaco_vid");
    if (!id) {
      id = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("lokmaco_vid", id);
    }
    return id;
  } catch {
    return "anon_" + Math.random().toString(36).slice(2);
  }
}

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Не трекаем админку и системные запросы
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return;
    }

    const visitorId = getOrCreateVisitorId();
    const payload = JSON.stringify({ visitorId, path: pathname });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/stats/visit", payload);
    } else {
      fetch("/api/stats/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
