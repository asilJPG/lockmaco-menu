"use client";

import { useState, useCallback } from "react";

const pages = [
  { label: "01 — Вафли & Локма", tab: "Вафли", src: "/resources/menu_page_1.jpeg", alt: "Вафли и Локма" },
  { label: "02 — Напитки", tab: "Напитки", src: "/resources/menu_page_2.jpeg", alt: "Напитки" },
  { label: "03 — Мороженое", tab: "Мороженое", src: "/resources/menu_page_3.jpeg", alt: "Мороженое" },
  { label: "04 — На вынос", tab: "На вынос", src: "/resources/menu_page_4.jpeg", alt: "На вынос" },
];

export default function OldMenu() {
  const [current, setCurrent] = useState(0);
  const total = pages.length;

  const goTo = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  return (
    <>
      <style>{`
        .old-menu * { margin: 0; padding: 0; box-sizing: border-box; }
        .old-menu {
          background: #0c0404;
          color: #f0e8e0;
          font-family: var(--font-raleway), "Raleway", sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
        }
        .old-menu::before {
          content: "";
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse at 20% 20%, rgba(139,20,20,0.15) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 80%, rgba(139,20,20,0.1) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
        }
        .old-menu .wrapper {
          position: relative;
          z-index: 1;
          max-width: 520px;
          margin: 0 auto;
          padding: 0 0 40px;
        }
        .old-menu header {
          text-align: center;
          padding: 48px 24px 32px;
          background: none;
          border: none;
        }
        .old-menu .logo-line {
          font-size: 11px;
          letter-spacing: 6px;
          text-transform: uppercase;
          color: #c0392b;
          margin-bottom: 10px;
          font-weight: 500;
        }
        .old-menu .logo {
          font-family: "Playfair Display", serif;
          font-size: 42px;
          font-weight: 700;
          color: #f0e8e0;
          letter-spacing: 2px;
          line-height: 1;
        }
        .old-menu .logo span { color: #d4a843; }
        .old-menu .tagline {
          margin-top: 10px;
          font-size: 12px;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: #7a5a4a;
          font-weight: 300;
        }
        .old-menu .divider {
          width: 60px;
          height: 1px;
          background: linear-gradient(to right, transparent, #d4a843, transparent);
          margin: 20px auto 0;
        }
        .old-menu .tabs {
          display: flex;
          padding: 0 20px;
          margin-bottom: 24px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .old-menu .tabs::-webkit-scrollbar { display: none; }
        .old-menu .tab {
          flex: 1;
          min-width: 80px;
          padding: 10px 6px;
          text-align: center;
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #7a5a4a;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.3s;
          font-weight: 500;
          white-space: nowrap;
          user-select: none;
          background: none;
        }
        .old-menu .tab:hover { color: #d4a843; }
        .old-menu .tab.active { color: #d4a843; border-bottom-color: #d4a843; }
        .old-menu .pages { padding: 0 20px; }
        .old-menu .page {
          display: none;
          animation: oldMenuFadeIn 0.4s ease;
        }
        .old-menu .page.active { display: block; }
        @keyframes oldMenuFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .old-menu .page-label {
          font-size: 10px;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: #c0392b;
          margin-bottom: 12px;
          font-weight: 500;
        }
        .old-menu .menu-img {
          width: 100%;
          border-radius: 16px;
          display: block;
          border: 1px solid rgba(212,168,67,0.15);
          box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03);
        }
        .old-menu .hint {
          text-align: center;
          margin-top: 14px;
          font-size: 11px;
          color: #5a3a2a;
          letter-spacing: 1px;
        }
        .old-menu .nav-arrows {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 20px 0;
        }
        .old-menu .arrow-btn {
          background: rgba(212,168,67,0.08);
          border: 1px solid rgba(212,168,67,0.2);
          color: #d4a843;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          user-select: none;
        }
        .old-menu .arrow-btn:hover {
          background: rgba(212,168,67,0.15);
          border-color: rgba(212,168,67,0.4);
        }
        .old-menu .arrow-btn:disabled { opacity: 0.2; cursor: default; }
        .old-menu .page-counter {
          font-size: 12px;
          letter-spacing: 3px;
          color: #7a5a4a;
          font-weight: 300;
        }
        .old-menu .page-counter strong { color: #d4a843; font-weight: 600; }
        .old-menu footer {
          text-align: center;
          padding: 40px 24px 20px;
          color: #4a2a1a;
          font-size: 11px;
          letter-spacing: 2px;
          background: none;
          border: none;
        }
        .old-menu footer a { color: #c0392b; text-decoration: none; }
      `}</style>
      <div className="old-menu">
        <div className="wrapper">
          <header>
            <div className="logo-line">Fergana · Uzbekistan</div>
            <div className="logo">The <span>Lokmaco</span></div>
            <div className="tagline">Меню · 2026</div>
            <div className="divider" />
          </header>

          <div className="tabs">
            {pages.map((p, i) => (
              <div
                key={i}
                className={`tab${i === current ? " active" : ""}`}
                onClick={() => goTo(i)}
              >
                {p.tab}
              </div>
            ))}
          </div>

          <div className="pages">
            {pages.map((p, i) => (
              <div key={i} className={`page${i === current ? " active" : ""}`}>
                <div className="page-label">{p.label}</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="menu-img" src={p.src} alt={p.alt} />
                <div className="hint">↔ увеличьте пальцами для деталей</div>
              </div>
            ))}
          </div>

          <div className="nav-arrows">
            <button
              className="arrow-btn"
              onClick={() => goTo(current - 1)}
              disabled={current === 0}
            >
              ←
            </button>
            <span className="page-counter">
              <strong>{current + 1}</strong> / {total}
            </span>
            <button
              className="arrow-btn"
              onClick={() => goTo(current + 1)}
              disabled={current === total - 1}
            >
              →
            </button>
          </div>

          <footer>
            <div>Режим работы: 10:00 – 01:00</div>
            <div style={{ marginTop: 6 }}>Обслуживание: 10%</div>
            <div style={{ marginTop: 12 }}>
              <a href="https://www.instagram.com/thelokmaco.uz_fergana/">thelokmaco.uz_fergana</a>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
