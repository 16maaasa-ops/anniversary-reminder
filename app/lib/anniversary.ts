export type AnniversaryType = "誕生日" | "記念日" | "その他";

export interface Anniversary {
  id: string;
  name: string;
  date: string; // "MM-DD" 形式。年は問わない
  type: AnniversaryType;
}

export const HIGHLIGHT_THRESHOLD_DAYS = 7;

export const TYPE_STYLES: Record<
  AnniversaryType,
  { badge: string; card: string }
> = {
  誕生日: { badge: "bg-pink-100 text-pink-700", card: "border-pink-200" },
  記念日: { badge: "bg-blue-100 text-blue-700", card: "border-blue-200" },
  その他: { badge: "bg-gray-100 text-gray-700", card: "border-gray-200" },
};

// 登録日付（MM-DD）を今年の日付とみなし、すでに過ぎていれば来年として扱う
export function daysUntilNext(mmdd: string, today: Date = new Date()): number {
  const [month, day] = mmdd.split("-").map(Number);
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  let next = new Date(todayMidnight.getFullYear(), month - 1, day);
  if (next < todayMidnight) {
    next = new Date(todayMidnight.getFullYear() + 1, month - 1, day);
  }

  const diffMs = next.getTime() - todayMidnight.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function sortByDaysUntil(items: Anniversary[]): Anniversary[] {
  return [...items].sort(
    (a, b) => daysUntilNext(a.date) - daysUntilNext(b.date),
  );
}
