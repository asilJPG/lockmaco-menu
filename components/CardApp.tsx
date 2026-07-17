"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import type { Lang } from "@/lib/types";
import { LANGS, UI, formatPrice } from "@/lib/i18n";

interface Customer {
  id: string;
  name: string;
  phone: string;
  cardNumber: string;
  balance: number;
}

function formatCardNumber(n: string): string {
  return n.replace(/(.{2})(.{4})(.{4})/, "$1 $2 $3");
}

function LoyaltyCard({ customer, lang }: { customer: Customer; lang: Lang }) {
  const t = UI[lang];
  const cardRef = useRef<HTMLDivElement>(null);

  // Премиальный 3D-tilt за курсором/пальцем
  const onMove = useCallback((e: React.PointerEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
    el.style.setProperty("--shine-x", `${(x + 0.5) * 100}%`);
  }, []);

  const onLeave = useCallback(() => {
    const el = cardRef.current;
    if (el) el.style.transform = "";
  }, []);

  return (
    <div className="loyalty-card__scene" onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="loyalty-card" ref={cardRef}>
        <div className="loyalty-card__shine" />
        <div className="loyalty-card__top">
          <span className="loyalty-card__eyebrow">{t.card_eyebrow}</span>
          <span className="loyalty-card__logo">The Lokmaco</span>
        </div>
        <div className="loyalty-card__balance">
          <span className="loyalty-card__balance-label">{t.card_balance}</span>
          <span className="loyalty-card__balance-value">
            {formatPrice(customer.balance)} <small>{t.card_bonuses}</small>
          </span>
        </div>
        <div className="loyalty-card__bottom">
          <div>
            <span className="loyalty-card__label">{t.card_holder}</span>
            <span className="loyalty-card__value">{customer.name.toUpperCase()}</span>
          </div>
          <div>
            <span className="loyalty-card__label">{t.card_number}</span>
            <span className="loyalty-card__value loyalty-card__value--num">
              {formatCardNumber(customer.cardNumber)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CardApp({ theme = "classic" }: { theme?: string }) {
  const [activeTheme, setActiveTheme] = useState(theme);
  const [lang, setLang] = useState<Lang>("ru");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [walletBusy, setWalletBusy] = useState(false);
  const [error, setError] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isIos, setIsIos] = useState(false);
  const qrRef = useRef<HTMLCanvasElement>(null);

  // Сканирование чеков Soliq
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimUrl, setClaimUrl] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimResult, setClaimResult] = useState<{ points: number; newBalance: number } | null>(null);
  const [claimErr, setClaimErr] = useState<string | null>(null);

  const t = UI[lang];

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);
      const params = new URLSearchParams(window.location.search);
      const t = params.get("theme");
      if (t) setActiveTheme(t);
    }
    const saved = localStorage.getItem("lokmaco-lang");
    if (saved && LANGS.includes(saved as Lang)) setLang(saved as Lang);
    fetch("/api/card/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.customer && setCustomer(d.customer))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (customer && qrRef.current) {
      let darkColor = "#241611";
      if (activeTheme === "matcha") darkColor = "#030804";
      else if (activeTheme === "burgundy") darkColor = "#0c0000";
      else if (activeTheme === "noir") darkColor = "#000000";

      QRCode.toCanvas(qrRef.current, customer.cardNumber, {
        width: 208,
        margin: 1,
        color: { dark: darkColor, light: "#ffffff" },
      });
    }
  }, [customer, activeTheme]);

  const switchLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("lokmaco-lang", l);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/card/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.customer) setCustomer(data.customer);
      else setError(true);
    } catch (err) {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/card/me", { method: "DELETE" });
    } catch (err) {}
    setCustomer(null);
    setName("");
    setPhone("");
  };

  const addToWallet = async () => {
    setWalletBusy(true);
    setWalletError(null);
    try {
      const res = await fetch("/api/card/wallet", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.url) window.location.href = data.url;
      else setWalletError(data?.error === "wallet_not_configured" ? t.card_wallet_setup : t.card_wallet_error);
    } catch (err) {
      setWalletError(t.card_wallet_error);
    } finally {
      setWalletBusy(false);
    }
  };

  const claimReceipt = async (urlToClaim: string) => {
    if (!urlToClaim.trim()) return;
    setClaimLoading(true);
    setClaimErr(null);
    setClaimResult(null);

    try {
      const res = await fetch("/api/card/claim-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrUrl: urlToClaim }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setClaimResult({ points: data.earnedPoints, newBalance: data.newBalance });
        setCustomer((prev) => prev ? { ...prev, balance: data.newBalance } : null);
      } else {
        setClaimErr(data?.error || t.card_claim_error);
      }
    } catch (err) {
      setClaimErr(t.card_claim_error);
    } finally {
      setClaimLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setClaimLoading(true);
    setClaimErr(null);
    setClaimResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setClaimErr("Canvas error");
          setClaimLoading(false);
          return;
        }
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h);
        const code = jsQR(imgData.data, w, h);

        if (code && code.data) {
          setClaimUrl(code.data);
          claimReceipt(code.data);
        } else {
          setClaimErr(
            lang === "ru"
              ? "QR-код не найден. Пожалуйста, сфотографируйте чек ближе и четче."
              : lang === "uz"
              ? "QR-kod topilmadi. Iltimos, chekni yaqinroq va aniqroq rasmga oling."
              : "QR code not found. Please take a closer and clearer picture of the receipt."
          );
          setClaimLoading(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="qr-shell card-shell" data-theme={activeTheme}>
      <header className="qr-header">
        <div className="brand-lockup">
          <span className="brand-lockup__eyebrow">{t.card_eyebrow}</span>
          <h1>{t.card_title}</h1>
        </div>
        <div className="lang-switcher">
          {LANGS.map((l) => (
            <button
              key={l}
              className={`lang-switcher__btn ${l === lang ? "active" : ""}`}
              onClick={() => switchLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <a className="card-back" href="/">{t.card_back}</a>

      {checking ? null : customer ? (
        <div className="card-view">
          <LoyaltyCard customer={customer} lang={lang} />

          <div className="card-qr-panel">
            <canvas ref={qrRef} className="card-qr-canvas" />
            <p className="card-qr-hint">{t.card_qr_hint}</p>
          </div>

          <div className="card-rules-block">
            <h3>{t.card_rules_title}</h3>
            <ul>
              <li>
                <span className="bullet">⚡</span>
                <span>{t.card_rule_cashback}</span>
              </li>
              <li>
                <span className="bullet">💳</span>
                <span>{t.card_rule_spend}</span>
              </li>
              <li>
                <span className="bullet">🎂</span>
                <span>{t.card_rule_birthday}</span>
              </li>
            </ul>
          </div>

          <div className="card-pwa-block">
            <p>
              <span className="bullet">📱</span>
              <span>{isIos ? t.card_pwa_ios : t.card_pwa_android}</span>
            </p>
          </div>

          <button className="claim-btn" onClick={() => setShowClaimModal(true)}>
            <span className="bullet">🧾</span>
            {t.card_claim_btn}
          </button>

          <button className="wallet-btn" onClick={addToWallet} disabled={walletBusy}>
            <span className="wallet-btn__icon">G</span>
            {walletBusy ? t.card_wallet_loading : t.card_wallet}
          </button>
          {walletError && <p className="card-error">{walletError}</p>}

          <button className="card-logout" onClick={logout}>{t.card_logout}</button>

          {showClaimModal && (
            <div className="claim-modal__overlay">
              <div className="claim-modal">
                <div className="claim-modal__header">
                  <h2>{t.card_claim_title}</h2>
                  <button className="claim-modal__close-x" onClick={() => {
                    setShowClaimModal(false);
                    setClaimErr(null);
                    setClaimResult(null);
                    setClaimUrl("");
                  }}>✕</button>
                </div>
                <div className="claim-modal__content">
                  <p className="claim-modal__desc">{t.card_claim_desc}</p>
                  
                  {claimResult ? (
                    <div className="claim-modal__success">
                      <div className="claim-success__icon">✓</div>
                      <p>{t.card_claim_success.replace("{points}", formatPrice(claimResult.points))}</p>
                      <button className="claim-modal__btn-primary" onClick={() => {
                        setShowClaimModal(false);
                        setClaimResult(null);
                        setClaimUrl("");
                      }}>
                        {t.card_claim_close}
                      </button>
                    </div>
                  ) : (
                    <div className="claim-modal__form">
                      <label className="claim-scan__label">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhotoUpload}
                          style={{ display: "none" }}
                          disabled={claimLoading}
                        />
                        <span className="claim-scan__btn">
                          <span className="bullet">📸</span> {t.card_claim_scan}
                        </span>
                      </label>

                      <div className="claim-modal__divider">
                        <span>{lang === "uz" ? "yoki" : lang === "en" ? "or" : "или"}</span>
                      </div>

                      <label className="card-field">
                        <span>{lang === "uz" ? "Chek havolasi" : lang === "en" ? "Receipt link" : "Ссылка чека"}</span>
                        <textarea
                          rows={3}
                          placeholder={t.card_claim_paste_placeholder}
                          value={claimUrl}
                          onChange={(e) => setClaimUrl(e.target.value)}
                          disabled={claimLoading}
                        />
                      </label>

                      {claimErr && <p className="card-error">{claimErr}</p>}

                      <button
                        className="claim-modal__btn-primary"
                        onClick={() => claimReceipt(claimUrl)}
                        disabled={claimLoading || !claimUrl.trim()}
                      >
                        {claimLoading ? t.card_loading : t.card_claim_submit}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form className="card-form" onSubmit={submit}>
          <p className="card-intro">{t.card_intro}</p>
          <label className="card-field">
            <span>{t.card_name}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              minLength={2}
            />
          </label>
          <label className="card-field">
            <span>{t.card_phone}</span>
            <div className="card-phone">
              <span className="card-phone__prefix">+998</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="90 123 45 67"
                required
              />
            </div>
          </label>
          {error && <p className="card-error">{t.card_error}</p>}
          <button className="card-submit" disabled={busy}>
            {busy ? t.card_loading : t.card_submit}
          </button>
        </form>
      )}
    </div>
  );
}
