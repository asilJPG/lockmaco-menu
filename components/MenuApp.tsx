"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

export default function MenuApp({ menu }: { menu: MenuData }) {
  const [lang, setLang] = useState<Lang>("ru");
  const [section, setSection] = useState<SectionKey>("food");
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const t = UI[lang];
  const cur = menu.brand.currency[lang];

  useEffect(() => {
    const saved = localStorage.getItem("lokmaco-lang");
    if (saved && LANGS.includes(saved as Lang)) setLang(saved as Lang);
    const timer = setTimeout(() => setLoading(false), 1600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (selected) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [selected]);

  const categories = menu.sections[section];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .filter((c) => activeCat === "all" || c.id === activeCat)
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (i) =>
            i.available &&
            (!q ||
              i.name[lang].toLowerCase().includes(q) ||
              i.description[lang].toLowerCase().includes(q))
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [categories, activeCat, query, lang]);

  const switchLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("lokmaco-lang", l);
  };

  const switchSection = (s: SectionKey) => {
    setSection(s);
    setActiveCat("all");
    setQuery("");
  };

  return (
    <>
      <div className={`welcome-loader ${loading ? "" : "hidden"}`} role="status">
        <div className="welcome-card">
          <span className="welcome-kicker">{t.qr_menu}</span>
          <div className="welcome-logo">{menu.brand.welcomeTitle}</div>
          <div className="welcome-line">{menu.brand.welcomeLine}</div>
          <div className="welcome-progress"><span /></div>
        </div>
      </div>

      <main className="qr-shell">
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

          <label className="search-field">
            <span className="search-field__icon" aria-hidden>⌕</span>
            <input
              type="search"
              placeholder={t.search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

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

        <section className="guest-menu">
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
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="dish-card__img" src={item.imageUrl} alt={item.name[lang]} loading="lazy" />
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

        <a className="card-banner" href="/card">
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
      </main>

      <dialog
        ref={dialogRef}
        className="dish-dialog"
        onClose={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setSelected(null);
        }}
      >
        {selected && (
          <div style={{ position: "relative" }}>
            <button type="button" className="dialog-close" onClick={() => setSelected(null)} aria-label="Close">×</button>
            <DishBadges badges={selected.badges} lang={lang} />
            {selected.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="dialog-img" src={selected.imageUrl} alt={selected.name[lang]} />
            ) : (
              <div className="dish-card__placeholder" aria-hidden>{menu.brand.name[0]}</div>
            )}
            <div className="dialog-body">
              <h3>{selected.name[lang]}</h3>
              <p className="dialog-desc">{selected.description[lang]}</p>
              <div className="dialog-meta">
                <span className="dialog-price">
                  {formatPrice(selected.price)}<small>{cur}</small>
                </span>
                {selected.weight ? (
                  <span className="dialog-weight">{selected.weight} {unitLabel(selected.measureUnit, lang)}</span>
                ) : null}
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
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
