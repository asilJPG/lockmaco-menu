"use client";

import { useEffect, useRef, useState } from "react";
import type { Badge, Lang, MenuData, MenuItem, SectionKey } from "@/lib/types";
import { BADGES, LANGS } from "@/lib/i18n";

const LANG_LABEL: Record<Lang, string> = { ru: "Русский", uz: "O‘zbekcha", en: "English" };

const emptyL10n = () => ({ ru: "", uz: "", en: "" });

const newItem = (): MenuItem => ({
  id: `item-${Date.now()}`,
  name: emptyL10n(),
  description: emptyL10n(),
  price: 0,
  imageUrl: "",
  weight: undefined,
  measureUnit: "г",
  nutrition: {},
  available: true,
});

async function resizeImage(file: File, maxSide = 900): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  bitmap.close();
  return dataUrl.split(",")[1];
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminApp() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [section, setSection] = useState<SectionKey>("food");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState<{ catId: string; item: MenuItem; isNew: boolean } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const api = (path: string, init?: RequestInit) =>
    fetch(path, { ...init, headers: { "Content-Type": "application/json", "x-admin-password": password, ...init?.headers } });

  useEffect(() => {
    const saved = sessionStorage.getItem("lokmaco-admin-pass");
    if (saved) {
      setPassword(saved);
      login(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editing) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [editing]);

  async function login(pass: string) {
    const res = await fetch("/api/admin/menu", { headers: { "x-admin-password": pass } });
    if (res.ok) {
      const json = await res.json();
      setMenu(json.menu);
      setAuthed(true);
      sessionStorage.setItem("lokmaco-admin-pass", pass);
    } else {
      setStatus({ ok: false, text: res.status === 401 ? "Неверный пароль" : "Ошибка загрузки меню" });
    }
  }

  function update(fn: (m: MenuData) => void) {
    setMenu((m) => {
      if (!m) return m;
      const copy: MenuData = structuredClone(m);
      fn(copy);
      return copy;
    });
    setDirty(true);
  }

  async function save() {
    if (!menu) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await api("/api/admin/menu", { method: "PUT", body: JSON.stringify({ menu }) });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setDirty(false);
        setStatus({ ok: true, text: "Сохранено. На проде сайт обновится через ~1 минуту после пересборки." });
      } else {
        setStatus({ ok: false, text: `Ошибка сохранения: ${json.error || res.status}` });
      }
    } catch (err) {
      setStatus({ ok: false, text: "Сетевая ошибка при сохранении" });
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(file: File): Promise<string | null> {
    try {
      const base64 = await resizeImage(file);
      const res = await api("/api/admin/upload", { method: "POST", body: JSON.stringify({ base64 }) });
      const json = await res.json().catch(() => ({}));
      if (res.ok) return json.url;
      setStatus({ ok: false, text: `Ошибка загрузки фото: ${json.error || res.status}` });
    } catch (err) {
      setStatus({ ok: false, text: "Сетевая ошибка при загрузке фото" });
    }
    return null;
  }

  async function uploadVideo(file: File): Promise<string | null> {
    try {
      const ext = file.name.toLowerCase().endsWith(".webm") ? "webm" : "mp4";
      const base64 = await fileToBase64(file);
      const res = await api("/api/admin/upload", { method: "POST", body: JSON.stringify({ base64, ext }) });
      const json = await res.json().catch(() => ({}));
      if (res.ok) return json.url;
      setStatus({ ok: false, text: `Ошибка загрузки видео: ${json.error || res.status}` });
    } catch (err) {
      setStatus({ ok: false, text: "Сетевая ошибка при загрузке видео" });
    }
    return null;
  }

  if (!authed) {
    return (
      <div className="admin-login">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            login(password);
          }}
        >
          <h1>The Lokmaco · Админка</h1>
          {status && !status.ok && <div className="admin-status admin-status--err">{status.text}</div>}
          <input
            className="admin-input"
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button className="admin-btn" type="submit">Войти</button>
        </form>
      </div>
    );
  }

  if (!menu) return null;
  const categories = menu.sections[section];

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <h1>The Lokmaco · Админка</h1>
        <div className="spacer" />
        <a href="/" target="_blank" style={{ color: "var(--brand-gold)", fontSize: 13, fontWeight: 700 }}>
          Открыть меню ↗
        </a>
        <button className="admin-btn admin-btn--gold" onClick={save} disabled={saving || !dirty}>
          {saving ? "Сохраняю..." : dirty ? "Сохранить" : "Сохранено"}
        </button>
      </div>

      {status && (
        <div className={`admin-status ${status.ok ? "admin-status--ok" : "admin-status--err"}`}>{status.text}</div>
      )}

      <div className="admin-card">
        <div className="admin-card__head"><h3>Бренд</h3></div>
        <div className="admin-grid-2" style={{ marginTop: 10 }}>
          <div className="admin-field">
            <label>Название</label>
            <input className="admin-input" value={menu.brand.name}
              onChange={(e) => update((m) => { m.brand.name = e.target.value; })} />
          </div>
          <div className="admin-field">
            <label>Телефон</label>
            <input className="admin-input" value={menu.brand.info?.phone ?? ""}
              onChange={(e) => update((m) => { m.brand.info = { ...m.brand.info, phone: e.target.value }; })} />
          </div>
          <div className="admin-field">
            <label>Instagram (без @)</label>
            <input className="admin-input" value={menu.brand.info?.instagram ?? ""}
              onChange={(e) => update((m) => { m.brand.info = { ...m.brand.info, instagram: e.target.value }; })} />
          </div>
          <div className="admin-field">
            <label>Wi-Fi (пароль)</label>
            <input className="admin-input" value={menu.brand.info?.wifi ?? ""}
              onChange={(e) => update((m) => { m.brand.info = { ...m.brand.info, wifi: e.target.value }; })} />
          </div>
          <div className="admin-field">
            <label>Режим работы</label>
            <input className="admin-input" value={menu.brand.info?.hours ?? ""}
              onChange={(e) => update((m) => { m.brand.info = { ...m.brand.info, hours: e.target.value }; })} />
          </div>
          <div className="admin-field">
            <label>Обслуживание (напр. 10%)</label>
            <input className="admin-input" value={menu.brand.info?.service ?? ""}
              onChange={(e) => update((m) => { m.brand.info = { ...m.brand.info, service: e.target.value }; })} />
          </div>
        </div>
        <div className="admin-field" style={{ marginTop: 10 }}>
          <label>Адрес / филиалы</label>
          <input className="admin-input" value={menu.brand.info?.address ?? ""}
            onChange={(e) => update((m) => { m.brand.info = { ...m.brand.info, address: e.target.value }; })} />
        </div>
      </div>

      <div className="admin-tabs">
        {(["food", "drinks"] as SectionKey[]).map((s) => (
          <button
            key={s}
            className={`admin-btn ${section === s ? "" : "admin-btn--ghost"}`}
            onClick={() => setSection(s)}
          >
            {s === "food" ? "Еда" : "Напитки"}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          className="admin-btn admin-btn--ghost"
          onClick={() =>
            update((m) => {
              m.sections[section].push({ id: `cat-${Date.now()}`, name: emptyL10n(), items: [] });
            })
          }
        >
          + Категория
        </button>
      </div>

      {categories.map((cat, ci) => (
        <div className="admin-card" key={cat.id}>
          <div className="admin-card__head">
            <h3>{cat.name.ru || "Без названия"}</h3>
            <button className="admin-btn admin-btn--ghost admin-btn--sm" disabled={ci === 0}
              onClick={() => update((m) => {
                const arr = m.sections[section];
                [arr[ci - 1], arr[ci]] = [arr[ci], arr[ci - 1]];
              })}>↑</button>
            <button className="admin-btn admin-btn--ghost admin-btn--sm" disabled={ci === categories.length - 1}
              onClick={() => update((m) => {
                const arr = m.sections[section];
                [arr[ci + 1], arr[ci]] = [arr[ci], arr[ci + 1]];
              })}>↓</button>
            <button className="admin-btn admin-btn--danger admin-btn--sm"
              onClick={() => {
                if (confirm(`Удалить категорию «${cat.name.ru}» со всеми блюдами?`))
                  update((m) => { m.sections[section] = m.sections[section].filter((c) => c.id !== cat.id); });
              }}>Удалить</button>
          </div>

          <div className="lang-fields" style={{ marginTop: 10 }}>
            {LANGS.map((l) => (
              <div className="admin-field" key={l}>
                <label>Название · {LANG_LABEL[l]}</label>
                <input className="admin-input" value={cat.name[l]}
                  onChange={(e) => update((m) => { m.sections[section][ci].name[l] = e.target.value; })} />
              </div>
            ))}
          </div>

          {cat.items.map((item, ii) => (
            <div className={`admin-item ${item.available ? "" : "admin-item--off"}`} key={item.id}>
              {item.imageUrl
                ? // eslint-disable-next-line @next/next/no-img-element
                  <img className="admin-item__thumb" src={item.imageUrl} alt="" />
                : <div className="admin-item__thumb">L</div>}
              <div className="admin-item__info">
                <b>{item.name.ru || "Без названия"}</b>
                <span>{item.price.toLocaleString("ru-RU")} сум{item.weight ? ` · ${item.weight} ${item.measureUnit}` : ""}</span>
              </div>
              <div className="admin-item__actions">
                <button className="admin-btn admin-btn--ghost admin-btn--sm" disabled={ii === 0}
                  onClick={() => update((m) => {
                    const arr = m.sections[section][ci].items;
                    [arr[ii - 1], arr[ii]] = [arr[ii], arr[ii - 1]];
                  })}>↑</button>
                <button className="admin-btn admin-btn--ghost admin-btn--sm" disabled={ii === cat.items.length - 1}
                  onClick={() => update((m) => {
                    const arr = m.sections[section][ci].items;
                    [arr[ii + 1], arr[ii]] = [arr[ii], arr[ii + 1]];
                  })}>↓</button>
                <button className="admin-btn admin-btn--ghost admin-btn--sm"
                  onClick={() => update((m) => {
                    m.sections[section][ci].items[ii].available = !item.available;
                  })}>{item.available ? "Скрыть" : "Показать"}</button>
                <button className="admin-btn admin-btn--sm"
                  onClick={() => setEditing({ catId: cat.id, item: structuredClone(item), isNew: false })}>
                  Изменить
                </button>
                <button className="admin-btn admin-btn--danger admin-btn--sm"
                  onClick={() => {
                    if (confirm(`Удалить «${item.name.ru}»?`))
                      update((m) => {
                        m.sections[section][ci].items = m.sections[section][ci].items.filter((x) => x.id !== item.id);
                      });
                  }}>✕</button>
              </div>
            </div>
          ))}

          <button className="admin-btn admin-btn--ghost admin-btn--sm" style={{ marginTop: 12 }}
            onClick={() => setEditing({ catId: cat.id, item: newItem(), isNew: true })}>
            + Блюдо
          </button>
        </div>
      ))}

      <dialog ref={dialogRef} className="item-editor" onClose={() => setEditing(null)}>
        {editing && (
          <ItemEditor
            key={editing.item.id}
            initial={editing.item}
            uploadImage={uploadImage}
            uploadVideo={uploadVideo}
            onCancel={() => setEditing(null)}
            onSave={(item) => {
              update((m) => {
                const cat = m.sections[section].find((c) => c.id === editing.catId);
                if (!cat) return;
                if (editing.isNew) cat.items.push(item);
                else {
                  const idx = cat.items.findIndex((x) => x.id === item.id);
                  if (idx >= 0) cat.items[idx] = item;
                }
              });
              setEditing(null);
            }}
          />
        )}
      </dialog>
    </div>
  );
}

function ItemEditor({
  initial,
  onSave,
  onCancel,
  uploadImage,
  uploadVideo,
}: {
  initial: MenuItem;
  onSave: (item: MenuItem) => void;
  onCancel: () => void;
  uploadImage: (f: File) => Promise<string | null>;
  uploadVideo: (f: File) => Promise<string | null>;
}) {
  const [item, setItem] = useState<MenuItem>(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const set = (patch: Partial<MenuItem>) => setItem((i) => ({ ...i, ...patch }));

  // Центрирование кадра: object-position "X% Y%"
  const [posX, posY] = (() => {
    const parts = (item.imagePosition || "50% 50%").split(" ");
    return [parseInt(parts[0]) || 50, parseInt(parts[1]) || 50];
  })();
  const setPos = (x: number, y: number) => set({ imagePosition: `${x}% ${y}%` });

  return (
    <div className="item-editor__body">
      <h3>{initial.name.ru ? `Блюдо: ${initial.name.ru}` : "Новое блюдо"}</h3>

      <div className="lang-fields">
        {LANGS.map((l) => (
          <div className="admin-field" key={l}>
            <label>Название · {LANG_LABEL[l]}</label>
            <input className="admin-input" value={item.name[l]}
              onChange={(e) => set({ name: { ...item.name, [l]: e.target.value } })} />
          </div>
        ))}
      </div>

      <div className="lang-fields">
        {LANGS.map((l) => (
          <div className="admin-field" key={l}>
            <label>Описание · {LANG_LABEL[l]}</label>
            <textarea className="admin-textarea" value={item.description[l]}
              onChange={(e) => set({ description: { ...item.description, [l]: e.target.value } })} />
          </div>
        ))}
      </div>

      <div className="admin-grid-3">
        <div className="admin-field">
          <label>Цена (сум)</label>
          <input className="admin-input" type="number" min={0} value={item.price || ""}
            onChange={(e) => set({ price: Number(e.target.value) })} />
        </div>
        <div className="admin-field">
          <label>Вес / объём</label>
          <input className="admin-input" type="number" min={0} value={item.weight ?? ""}
            onChange={(e) => set({ weight: e.target.value ? Number(e.target.value) : undefined })} />
        </div>
        <div className="admin-field">
          <label>Единица</label>
          <select className="admin-select" value={item.measureUnit}
            onChange={(e) => set({ measureUnit: e.target.value as MenuItem["measureUnit"] })}>
            <option value="г">г</option>
            <option value="мл">мл</option>
            <option value="шт">шт</option>
          </select>
        </div>
      </div>

      <div className="admin-field">
        <label>Пищевая ценность (на порцию, необязательно)</label>
        <div className="admin-grid-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          {(["kcal", "proteins", "fats", "carbs"] as const).map((k) => (
            <input key={k} className="admin-input" type="number" min={0} step="0.1"
              placeholder={{ kcal: "ккал", proteins: "белки", fats: "жиры", carbs: "углеводы" }[k]}
              value={item.nutrition?.[k] ?? ""}
              onChange={(e) =>
                set({ nutrition: { ...item.nutrition, [k]: e.target.value ? Number(e.target.value) : undefined } })
              } />
          ))}
        </div>
      </div>

      <div className="admin-field">
        <label>Бейджи</label>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {(Object.keys(BADGES) as Badge[]).map((b) => (
            <label key={b} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={item.badges?.includes(b) ?? false}
                onChange={(e) =>
                  set({
                    badges: e.target.checked
                      ? [...(item.badges ?? []), b]
                      : (item.badges ?? []).filter((x) => x !== b),
                  })
                }
              />
              {BADGES[b].ru}
            </label>
          ))}
        </div>
      </div>

      <div className="admin-field">
        <label>Фото</label>
        <div className="upload-row">
          <input type="file" accept="image/*" disabled={uploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              const url = await uploadImage(file);
              if (url) set({ imageUrl: url });
              setUploading(false);
            }} />
          {uploading && <span style={{ fontSize: 13, color: "var(--muted)" }}>Загрузка...</span>}
        </div>

        {item.imageUrl && (
          <div className="media-preview">
            <div className="media-preview__frame">
              {item.videoUrl ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video src={item.videoUrl} poster={item.imageUrl} muted loop autoPlay playsInline
                  style={{ objectPosition: item.imagePosition }} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" style={{ objectPosition: item.imagePosition }} />
              )}
            </div>
            <div className="media-preview__controls">
              <span className="media-preview__hint">Центрирование кадра (как в меню — обрезка 4:3)</span>
              <label className="media-slider">
                <span>По горизонтали</span>
                <input type="range" min={0} max={100} value={posX}
                  onChange={(e) => setPos(Number(e.target.value), posY)} />
              </label>
              <label className="media-slider">
                <span>По вертикали</span>
                <input type="range" min={0} max={100} value={posY}
                  onChange={(e) => setPos(posX, Number(e.target.value))} />
              </label>
              <button type="button" className="media-reset"
                onClick={() => set({ imagePosition: undefined })}>
                Сбросить в центр
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="admin-field">
        <label>Видео блюда (необязательно · MP4/WebM)</label>
        <div className="upload-row">
          <input type="file" accept="video/mp4,video/webm" disabled={uploadingVideo}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadingVideo(true);
              const url = await uploadVideo(file);
              if (url) set({ videoUrl: url });
              setUploadingVideo(false);
            }} />
          {uploadingVideo && <span style={{ fontSize: 13, color: "var(--muted)" }}>Загрузка...</span>}
          {item.videoUrl && !uploadingVideo && (
            <button type="button" className="media-reset" onClick={() => set({ videoUrl: undefined })}>
              Убрать видео
            </button>
          )}
        </div>
        <span className="media-preview__hint" style={{ display: "block", marginTop: 6 }}>
          Видео проигрывается при открытии блюда и плавно сменяется фото. Держи ≤6 МБ, 2–4 сек.
        </span>
      </div>

      <div className="editor-actions">
        <button className="admin-btn admin-btn--ghost" onClick={onCancel}>Отмена</button>
        <button className="admin-btn" disabled={!item.name.ru || !item.price}
          onClick={() => onSave(item)}>Готово</button>
      </div>
    </div>
  );
}
