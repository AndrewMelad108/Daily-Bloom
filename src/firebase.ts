import { getAuth } from "@react-native-firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
} from "@react-native-firebase/firestore";
import { getAnalytics, logEvent } from "@react-native-firebase/analytics";
import { Habit, Entry } from "./model";
export const auth = getAuth();
export const db = getFirestore();
export const analytics = getAnalytics();
export const habitsRef = (uid: string) =>
  collection(db, "users", uid, "habits");
export const entriesRef = (uid: string) =>
  collection(db, "users", uid, "entries");
export const habitRef = (uid: string, id: string) =>
  doc(db, "users", uid, "habits", id);
export const saveHabit = (uid: string, h: Habit) =>
  setDoc(habitRef(uid, h.id), h);
export async function complete(
  uid: string,
  h: Habit,
  date: string,
  minutes: number,
) {
  const id = h.id + "_" + date;
  const entry: Entry = { id, habitId: h.id, date, minutes };
  await setDoc(doc(db, "users", uid, "entries", id), entry);
}
export const undo = (uid: string, id: string) =>
  deleteDoc(doc(db, "users", uid, "entries", id));
export async function track(event: string) {
  try {
    await logEvent(analytics, event);
  } catch {
    /* Metrics never block a user action. */
  }
}
