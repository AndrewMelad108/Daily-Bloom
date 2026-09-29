import { getAuth } from "@react-native-firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
} from "@react-native-firebase/firestore";
import { getAnalytics, logEvent } from "@react-native-firebase/analytics";
import { GlobalTask, GlobalTaskEntry } from "./model";
export const auth = getAuth();
export const db = getFirestore();
export const analytics = getAnalytics();
export async function track(event: string) {
  try {
    await logEvent(analytics, event);
  } catch {
    /* Metrics never block a user action. */
  }
}

// ── Global Tasks ──────────────────────────────────────────────────────────────
export const globalTasksRef = (uid: string) =>
  collection(db, "users", uid, "globalTasks");
export const globalEntriesRef = (uid: string) =>
  collection(db, "users", uid, "globalEntries");
export const saveGlobalTask = (uid: string, task: GlobalTask) =>
  setDoc(doc(db, "users", uid, "globalTasks", task.id), task);
export async function completeGlobalTask(
  uid: string,
  task: GlobalTask,
  date: string,
) {
  const id = task.id + "_" + date;
  const entry: GlobalTaskEntry = { id, globalTaskId: task.id, date, minutes: task.minutes ?? 20 };
  await setDoc(doc(db, "users", uid, "globalEntries", id), entry);
}
export const undoGlobalTask = (uid: string, id: string) =>
  deleteDoc(doc(db, "users", uid, "globalEntries", id));

export async function deleteGlobalTask(uid: string, task: GlobalTask) {
  if (task.isEssential) throw new Error("Essential tasks cannot be deleted");
  await deleteDoc(doc(db, "users", uid, "globalTasks", task.id));
}
