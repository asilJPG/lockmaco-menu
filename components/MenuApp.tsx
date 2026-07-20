"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { Lang, MenuData, MenuItem, SectionKey } from "@/lib/types";
import { BADGES, LANGS, UI, formatPrice, unitLabel } from "@/lib/i18n";

function DishBadges({ badges, lang }: { badges?: string[]; lang: Lang }) {
  if (!badges?.length) return null;
  return (
    <div className="dish-badges">
      {badges.map((b) => (
        <span key={b} className={`badge badge--${b}`}>{BADGES[b]?.[lang] ?? b}</span>
      ))}
    </div>
  );
}

function SesameEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width = rect?.width || 400;
      canvas.height = rect?.height || 300;
    };
    resize();
    window.addEventListener("resize", resize);

    const numSeeds = 60;
    const seeds: Array<{
      x: number;
      y: number;
      vy: number;
      vx: number;
      rX: number;
      rY: number;
      angle: number;
      vAngle: number;
      color: string;
      bounceCount: number;
    }> = [];

    for (let i = 0; i < numSeeds; i++) {
      const isBlack = Math.random() < 0.2;
      // Spawn seeds only over the central food zone (40% width in the center)
      const x = Math.random() * (canvas.width * 0.4) + canvas.width * 0.3;
      seeds.push({
        x: x,
        y: -Math.random() * 150 - 10,
        vy: Math.random() * 1.5 + 2,
        vx: Math.random() * 0.4 - 0.2,
        rX: Math.random() * 1.5 + 1.8,
        rY: Math.random() * 2.5 + 3.5,
        angle: Math.random() * Math.PI * 2,
        vAngle: Math.random() * 0.08 - 0.04,
        color: isBlack ? "#221a15" : "#f1e5d7",
        bounceCount: 0
      });
    }

    let animationId: number;
    const startTime = Date.now();
    const duration = 2500;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      seeds.forEach((seed) => {
        ctx.save();
        ctx.translate(seed.x, seed.y);
        ctx.rotate(seed.angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, seed.rX, seed.rY, 0, 0, Math.PI * 2);
        ctx.fillStyle = seed.color;
        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetY = 1;
        ctx.fill();
        ctx.restore();

        seed.y += seed.vy;
        seed.x += seed.vx;
        seed.angle += seed.vAngle;

        // Calculate parabolic shape for the chicken wings pile in the center
        const distFromCenter = Math.abs(seed.x - canvas.width / 2);
        const normDist = distFromCenter / (canvas.width * 0.25); // 0 at center, 1 at edge of the pile
        const basePlateY = canvas.height * 0.64;
        const pileHeight = canvas.height * 0.16;
        
        // Parabolic height + small random offset for uneven surface
        const plateY = basePlateY - pileHeight * Math.max(0, 1 - normDist * normDist) + (seed.x % 14) - 7;

        if (seed.y >= plateY && seed.bounceCount < 1) {
          seed.vy = 0;
          seed.vx = 0;
          seed.vAngle = 0;
          seed.y = plateY;
          seed.bounceCount++;
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 10
      }}
    />
  );
}

export default function MenuApp({ menu, theme = "classic" }: { menu: MenuData; theme?: "classic" | "burgundy" | "noir" | "matcha" }) {
  const [lang, setLang] = useState<Lang>("ru");
  const [section, setSection] = useState<SectionKey>("food");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [activeCat, setActiveCat] = useState<string>("all");
  const quickFilter = "all";
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const t = UI[lang];
  const cur = menu.brand.currency[lang];

  useEffect(() => {
    const saved = localStorage.getItem("lokmaco-lang");
    if (saved && LANGS.includes(saved as Lang)) setLang(saved as Lang);
    
    // Auto-open item if passed in URL
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get("item");
    if (itemId) {
      for (const sectionKey of ["food", "drinks"] as const) {
        for (const cat of menu.sections[sectionKey]) {
          const found = cat.items.find(i => i.id === itemId);
          if (found) {
            setSelected(found);
            setSection(sectionKey);
            break;
          }
        }
      }
    }

    const timer = setTimeout(() => setLoading(false), 1600);
    return () => clearTimeout(timer);
  }, [menu]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (selected) {
      if (!dialog?.open) dialog?.showModal();
      const newUrl = `${window.location.pathname}?item=${selected.id}`;
      window.history.replaceState({ itemId: selected.id }, "", newUrl);
    } else {
      if (dialog?.open) dialog.close();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [selected]);
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 350);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const categories = menu.sections[section];
  const availableItems = useMemo(
    () => categories.flatMap((c) => c.items.filter((i) => i.available)),
    [categories]
  );
  const featuredItems = useMemo(() => {
    const picked = availableItems.filter((i) => i.badges?.some((b) => b === "hit" || b === "new"));
    return (picked.length ? picked : availableItems).slice(0, 4);
  }, [availableItems]);
  const selectedCategory = useMemo(
    () => categories.find((c) => c.items.some((i) => i.id === selected?.id)),
    [categories, selected]
  );
  const relatedItems = useMemo(() => {
    if (!selected || !selectedCategory) return [];
    return selectedCategory.items.filter((i) => i.available && i.id !== selected.id).slice(0, 3);
  }, [selected, selectedCategory]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return categories
      .filter((c) => activeCat === "all" || c.id === activeCat)
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (i) =>
            i.available &&
            (quickFilter === "all" || i.badges?.includes(quickFilter)) &&
            (!q ||
              i.name[lang].toLowerCase().includes(q) ||
              i.description[lang].toLowerCase().includes(q))
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [categories, activeCat, deferredQuery, lang, quickFilter]);

  const switchLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("lokmaco-lang", l);
  };

  const switchSection = (s: SectionKey) => {
    setSection(s);
    setActiveCat("all");
    setQuery("");
  };

  const shareItem = (item: MenuItem) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?item=${item.id}`;
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {});
    }
  };

  const closeDialog = () => {
    setClosing(true);
    setTimeout(() => {
      setSelected(null);
      setClosing(false);
    }, 200);
  };

  return (
    <>
      <div className={`welcome-loader ${loading ? "" : "hidden"}`} data-theme={theme} role="status">
        <div className="welcome-card">
          <span className="welcome-kicker">{t.qr_menu}</span>
          <div className="welcome-logo">{menu.brand.welcomeTitle}</div>
          <div className="welcome-line">{menu.brand.welcomeLine}</div>
          <div className="welcome-progress"><span /></div>
        </div>
      </div>

      <main className="qr-shell" data-theme={theme}>
        <header className="qr-header">
          <div className="brand-lockup">
            <span className="brand-lockup__eyebrow">{t.qr_menu}</span>
            <h1>{menu.brand.name}</h1>
          </div>
          <div className="lang-switcher" role="group" aria-label="Language">
            {LANGS.map((l) => (
              <button
                key={l}
                type="button"
                className={`lang-switcher__btn ${l === lang ? "active" : ""}`}
                onClick={() => switchLang(l)}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <section className="menu-controls">
          <div className="section-tabs" role="tablist">
            {(["food", "drinks"] as SectionKey[]).map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={section === s}
                className={`section-tab ${section === s ? "active" : ""}`}
                onClick={() => switchSection(s)}
              >
                {t[s]}
              </button>
            ))}
          </div>

          <div className="search-field">
            <span className="search-field__icon" aria-hidden>⌕</span>
            <input
              type="text"
              placeholder={t.search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="search-field__clear"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="category-chips">
            <button
              type="button"
              className={`chip ${activeCat === "all" ? "active" : ""}`}
              onClick={() => setActiveCat("all")}
            >
              {t.all}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip ${activeCat === c.id ? "active" : ""}`}
                onClick={() => setActiveCat(c.id)}
              >
                {c.name[lang]}
              </button>
            ))}
          </div>
        </section>

        {featuredItems.length > 0 && !deferredQuery.trim() && activeCat === "all" && (
          <section className="chef-strip" aria-labelledby="chef-strip-title">
            <div className="chef-strip__head">
              <span>{t.chef_kicker}</span>
              <h2 id="chef-strip-title">{t.chef_title}</h2>
            </div>
            <div className="chef-picks">
              {featuredItems.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className="chef-pick"
                  onClick={() => setSelected(item)}
                >
                  <span className="chef-pick__num">{String(index + 1).padStart(2, "0")}</span>
                  <span className="chef-pick__name">{item.name[lang]}</span>
                  <span className="chef-pick__price">{formatPrice(item.price)} {cur}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="guest-menu" key={`${section}-${activeCat}-${quickFilter}-${deferredQuery}`}>
          {filtered.length === 0 && <div className="no-results">{t.no_results}</div>}
          {filtered.map((c) => (
            <div key={c.id} className="category-block">
              <div className="category-title">
                <h2>{c.name[lang]}</h2>
                <span>{c.items.length} {t.items}</span>
              </div>
              <div className="dish-grid">
                {c.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="dish-card"
                    onClick={() => setSelected(item)}
                  >
                    <DishBadges badges={item.badges} lang={lang} />
                    {item.imageUrl ? (
                      <img className="dish-card__img" src={item.imageUrl} alt={item.name[lang]} loading="lazy" onLoad={(e) => e.currentTarget.classList.add("loaded")} />
                    ) : (
                      <div className="dish-card__placeholder" aria-hidden>{menu.brand.name[0]}</div>
                    )}
                    <div className="dish-card__body">
                      <div className="dish-card__name">{item.name[lang]}</div>
                      <div className="dish-card__desc">{item.description[lang]}</div>
                      <div className="dish-card__meta">
                        <span className="dish-card__price">
                          {formatPrice(item.price)}<small>{cur}</small>
                        </span>
                        {item.weight ? (
                          <span className="dish-card__weight">{item.weight} {unitLabel(item.measureUnit, lang)}</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        <a className="card-banner" href={theme === "classic" ? "/card" : `/card?theme=${theme}`}>
          <span className="card-banner__star" aria-hidden>✦</span>
          <span className="card-banner__text">{t.card_link}</span>
          <span className="card-banner__arrow" aria-hidden>→</span>
        </a>

        <footer className="qr-footer">
          <div className="footer-logo">{menu.brand.name}</div>
          {menu.brand.info && (
            <div className="info-block">
              {menu.brand.info.address && <div className="info-row">📍 {menu.brand.info.address}</div>}
              {menu.brand.info.hours && (
                <div className="info-row">🕙 {t.hours_label}: {menu.brand.info.hours}</div>
              )}
              {menu.brand.info.service && (
                <div className="info-row">{t.service_label}: {menu.brand.info.service}</div>
              )}
              {menu.brand.info.phone && (
                <div className="info-row">
                  ☎ <a href={`tel:${menu.brand.info.phone.replace(/[^+\d]/g, "")}`}>{menu.brand.info.phone}</a>
                </div>
              )}
              {menu.brand.info.instagram && (
                <div className="info-row">
                  <a href={`https://instagram.com/${menu.brand.info.instagram}`} target="_blank" rel="noopener">
                    @{menu.brand.info.instagram}
                  </a>
                </div>
              )}
              {menu.brand.info.wifi && <div className="info-row">Wi-Fi: {menu.brand.info.wifi}</div>}
            </div>
          )}
        </footer>

        {showScrollTop && (
          <button
            type="button"
            className="scroll-top-btn"
            onClick={scrollToTop}
            aria-label="Scroll to top"
          >
            ↑
          </button>
        )}
      </main>

      <dialog
        ref={dialogRef}
        className={`dish-dialog ${closing ? "closing" : ""}`}
        data-theme={theme}
        onCancel={(e) => {
          e.preventDefault();
          closeDialog();
        }}
        onClose={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) closeDialog();
        }}
      >
        {selected && (
          <div style={{ position: "relative" }}>
            <button type="button" className="dialog-close" onClick={closeDialog} aria-label="Close">×</button>
            <DishBadges badges={selected.badges} lang={lang} />
            {selected.imageUrl ? (
              <div className="dialog-img-wrapper">
                <img className="dialog-img" src={selected.imageUrl} alt={selected.name[lang]} onLoad={(e) => e.currentTarget.classList.add("loaded")} />
                {selected.id === "meat-wings" && <SesameEffect />}
              </div>
            ) : (
              <div className="dialog-img-wrapper">
                <div className="dish-card__placeholder" aria-hidden>{menu.brand.name[0]}</div>
              </div>
            )}
            <div className="dialog-body">
              <h3>{selected.name[lang]}</h3>
              <p className="dialog-desc">{selected.description[lang]}</p>
              <div className="dialog-meta">
                <div className="dialog-meta__left">
                  <span className="dialog-price">
                    {formatPrice(selected.price)}<small>{cur}</small>
                  </span>
                  {selected.weight ? (
                    <span className="dialog-weight">{selected.weight} {unitLabel(selected.measureUnit, lang)}</span>
                  ) : null}
                </div>
                <button
                  type="button"
                  className={`dialog-share-btn ${copied ? "copied" : ""}`}
                  onClick={() => shareItem(selected)}
                  aria-label="Share dish"
                >
                  {copied ? (lang === "ru" ? "Ссылка скопирована!" : lang === "uz" ? "Havola nusxalandi!" : "Copied!") : (lang === "ru" ? "Поделиться" : lang === "uz" ? "Ulashish" : "Share")}
                </button>
              </div>
              {selected.nutrition?.kcal ? (
                <div className="nutrition-block">
                  <h4>{t.nutrition}</h4>
                  <div className="nutrition-grid">
                    <div><b>{selected.nutrition.kcal}</b><span>{t.kcal}</span></div>
                    <div><b>{selected.nutrition.proteins ?? "—"}</b><span>{t.proteins}</span></div>
                    <div><b>{selected.nutrition.fats ?? "—"}</b><span>{t.fats}</span></div>
                    <div><b>{selected.nutrition.carbs ?? "—"}</b><span>{t.carbs}</span></div>
                  </div>
                </div>
              ) : null}
              {relatedItems.length > 0 ? (
                <div className="related-block">
                  <h4>{t.related_title}</h4>
                  <div className="related-list">
                    {relatedItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="related-item"
                        onClick={() => setSelected(item)}
                      >
                        <span>{item.name[lang]}</span>
                        <b>{formatPrice(item.price)} {cur}</b>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
