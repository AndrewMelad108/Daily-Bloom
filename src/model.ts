export type Schedule = { from: string; days: number[]; minutes: number };
export type Habit = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdDate: string;
  archivedDate: string | null;
  schedules: Schedule[];
};
export type Entry = {
  id: string;
  habitId: string;
  date: string;
  minutes: number;
};
export const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function shift(key: string, n: number) {
  const d = new Date(key + "T12:00:00");
  d.setDate(d.getDate() + n);
  return dateKey(d);
}
export function schedule(h: Habit, key: string) {
  return [...h.schedules].reverse().find((s) => s.from <= key);
}
export function due(h: Habit, key: string) {
  const s = schedule(h, key);
  return (
    key >= h.createdDate &&
    (!h.archivedDate || key < h.archivedDate) &&
    !!s?.days.includes(new Date(key + "T12:00:00").getDay())
  );
}
export function range(end: string, count: number) {
  return Array.from({ length: count }, (_, i) => shift(end, i - count + 1));
}
export function metrics(
  habits: Habit[],
  entries: Entry[],
  end: string,
  count = 30,
) {
  const days = range(end, count);
  const keys = new Set(entries.map((e) => e.habitId + "_" + e.date));
  let expected = 0,
    done = 0;
  for (const d of days)
    for (const h of habits)
      if (due(h, d)) {
        expected++;
        if (keys.has(h.id + "_" + d)) done++;
      }
  return {
    expected,
    done,
    rate: expected ? Math.round((done / expected) * 100) : 0,
  };
}
export function streak(h: Habit, entries: Entry[], today: string) {
  const keys = new Set(
    entries.filter((e) => e.habitId === h.id).map((e) => e.date),
  );
  let total = 0;
  for (let day = today; day >= h.createdDate; day = shift(day, -1)) {
    if (!due(h, day)) continue;
    if (keys.has(day)) total++;
    else if (day !== today) break;
  }
  return total;
}
