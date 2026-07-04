"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  type Anniversary,
  type AnniversaryType,
  HIGHLIGHT_THRESHOLD_DAYS,
  TYPE_STYLES,
  daysUntilNext,
  sortByDaysUntil,
} from "./lib/anniversary";

const STORAGE_KEY = "anniversary-reminder:items";
// <input type="date"> は年ありの値が必須なため、保存時には捨てるダミーの年（うるう年）を使う
const PLACEHOLDER_YEAR = 2000;

function toDateInputValue(mmdd: string) {
  return `${PLACEHOLDER_YEAR}-${mmdd}`;
}

function toMmDd(dateInputValue: string) {
  return dateInputValue.slice(5); // "YYYY-MM-DD" -> "MM-DD"
}

export default function Home() {
  const [items, setItems] = useState<Anniversary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<AnniversaryType>("誕生日");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        // localStorage はサーバー側で読めないため、マウント後にここで読み込む
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(JSON.parse(raw));
      } catch {
        // 壊れたデータは無視する
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  function resetForm() {
    setName("");
    setDate("");
    setType("誕生日");
    setEditingId(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !date) return;
    const mmdd = toMmDd(date);

    if (editingId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? { ...item, name: name.trim(), date: mmdd, type }
            : item,
        ),
      );
    } else {
      setItems((prev) => [
        ...prev,
        { id: crypto.randomUUID(), name: name.trim(), date: mmdd, type },
      ]);
    }
    resetForm();
  }

  function handleEdit(item: Anniversary) {
    setEditingId(item.id);
    setName(item.name);
    setDate(toDateInputValue(item.date));
    setType(item.type);
  }

  function handleDelete(id: string) {
    if (editingId === id) resetForm();
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  const sorted = sortByDaysUntil(items);

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12 dark:bg-black">
      <main className="mx-auto flex max-w-xl flex-col gap-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          記念日・誕生日リマインダー
        </h1>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm dark:bg-zinc-900"
        >
          <div className="flex flex-col gap-1">
            <label
              htmlFor="name"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              名前
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：田中太郎"
              required
              className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="date"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              日付
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="type"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              種別
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as AnniversaryType)}
              className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
            >
              <option value="誕生日">誕生日</option>
              <option value="記念日">記念日</option>
              <option value="その他">その他</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-zinc-900 py-2 font-medium text-white hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {editingId ? "更新する" : "登録する"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
              >
                キャンセル
              </button>
            )}
          </div>
        </form>

        <ul className="flex flex-col gap-3">
          {sorted.length === 0 && (
            <li className="py-8 text-center text-zinc-500 dark:text-zinc-400">
              まだ登録がありません
            </li>
          )}
          {sorted.map((item) => {
            const days = daysUntilNext(item.date);
            const isSoon = days <= HIGHLIGHT_THRESHOLD_DAYS;
            const style = TYPE_STYLES[item.type];
            return (
              <li
                key={item.id}
                className={`flex items-center justify-between rounded-xl border bg-white p-4 dark:bg-zinc-900 ${
                  isSoon
                    ? "border-amber-400 ring-2 ring-amber-200 dark:ring-amber-900"
                    : style.card
                }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}
                    >
                      {item.type}
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {item.name}
                    </span>
                  </div>
                  <span
                    className={`text-sm ${
                      isSoon
                        ? "font-semibold text-amber-600"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {days === 0 ? "今日！" : `あと${days}日`}（
                    {item.date.replace("-", "/")}）
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-sm text-zinc-600 hover:underline dark:text-zinc-300"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    削除
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
