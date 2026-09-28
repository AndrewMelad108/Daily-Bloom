import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Alert,
  AppState,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  FirebaseAuthTypes,
} from "@react-native-firebase/auth";
import {
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { setAnalyticsCollectionEnabled } from "@react-native-firebase/analytics";
import {
  auth,
  db,
  analytics,
  habitsRef,
  entriesRef,
  saveHabit,
  complete,
  undo,
  track,
} from "./src/firebase";
import {
  Habit,
  Entry,
  dateKey,
  shift,
  schedule,
  due,
  metrics,
  range,
  streak,
  taskStatus,
  filterTasks,
  parseMinutes,
} from "./src/model";
import { LanguageProvider, useLanguage, Translator } from "./src/i18n";
const C = {
  bg: "#0B1017",
  card: "#151D28",
  line: "#263140",
  text: "#F2F5FA",
  muted: "#8B9AAF",
  mint: "#B5F4CB",
  purple: "#C4B5FD",
};

const emojis = ["🌿", "📖", "💪", "💧", "🧠", "🎨", "💻", "🧘"];
const colors = ["#B5F4CB", "#C4B5FD", "#FDCB92", "#9ACAFB"];
const error = (e: unknown, t: Translator) => {
  const code = (e as { code?: string })?.code || "";
  Alert.alert(
    t("تعذّر إكمال الطلب"),
    code.includes("invalid-credential") || code.includes("wrong-password")
      ? t("راجع البريد وكلمة المرور.")
      : code.includes("email-already-in-use")
        ? t("البريد ده مسجّل بالفعل.")
        : code.includes("network")
          ? t("راجع اتصال الإنترنت وحاول تاني.")
          : code.includes("permission-denied")
            ? t("راجع نشر Firestore Rules للمشروع.")
            : code.includes("too-many-requests")
              ? t("محاولات كتير، جرّب بعد شوية.")
              : t("حصل خطأ. راجع البيانات وإعداد Firebase وحاول تاني."),
  );
};
function Label({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  const { language } = useLanguage();
  const s = makeStyles(language === "ar");
  return <Text style={[s.text, style]}>{children}</Text>;
}
function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const { language } = useLanguage();
  const s = makeStyles(language === "ar");
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        s.button,
        secondary && { backgroundColor: C.line },
        disabled && { opacity: 0.45 },
      ]}
    >
      <Label style={{ color: secondary ? C.text : C.bg, fontWeight: "800" }}>
        {title}
      </Label>
    </Pressable>
  );
}
function Field(props: React.ComponentProps<typeof TextInput>) {
  const { language } = useLanguage();
  const s = makeStyles(language === "ar");
  return (
    <TextInput
      placeholderTextColor={C.muted}
      {...props}
      style={[s.input, props.style]}
    />
  );
}
function LanguageSwitch() {
  const { language, changeLanguage, t } = useLanguage();
  const s = makeStyles(language === "ar");
  return <View style={[s.row, { marginVertical: 12 }]}>
    <Label>{t("اللغة")}</Label>
    {(["ar", "en"] as const).map(value => <Pressable key={value}
      accessibilityRole="button" accessibilityState={{ selected: language === value }}
      onPress={() => changeLanguage(value)}
      style={[s.chip, language === value && { backgroundColor: C.mint }]}>
      <Label style={{ color: language === value ? C.bg : C.text }}>{value === "ar" ? "العربية" : "English"}</Label>
    </Pressable>)}
  </View>;
}
function Login() {
  const { t, language } = useLanguage();
  const s = makeStyles(language === "ar");
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [register, setRegister] = useState(false),
    [busy, setBusy] = useState(false);
  async function submit() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || password.length < 8)
      return Alert.alert(
        t("راجع البيانات"),
        t("اكتب بريد صحيح وكلمة مرور ٨ أحرف على الأقل."),
      );
    setBusy(true);
    try {
      await (
        register ? createUserWithEmailAndPassword : signInWithEmailAndPassword
      )(auth, email.trim(), password);
    } catch (e) {
      error(e, t);
    } finally {
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={s.login}>
        <Image source={require("./logo.png")} style={s.logo} accessibilityLabel={t("خُطوة")} />
        <LanguageSwitch />
        <Label style={s.brand}>{t("خُطوة")}</Label>
        <Label style={s.heroTitle}>{t("كل يوم أحسن،")}{"\n"}{t("خطوة بخطوة.")}</Label>
        <Label style={s.subtitle}>{t("مساحتك الهادية لبناء عادات تدوم.")}</Label>
        <View style={[s.card, { marginTop: 32, width: "100%" }]}>
          <Label style={s.heading}>
            {register ? t("ابدأ رحلتك") : t("أهلًا برجوعك")}
          </Label>
          <Field
            accessibilityLabel={t("البريد الإلكتروني")}
            placeholder={t("البريد الإلكتروني")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Field
            accessibilityLabel={t("كلمة المرور")}
            placeholder={t("كلمة المرور · ٨ أحرف على الأقل")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={register ? "new-password" : "current-password"}
          />
          <Button
            title={busy ? t("لحظة…") : register ? t("إنشاء حساب") : t("دخول لمساحتي ←")}
            disabled={busy}
            onPress={submit}
          />
          <Button
            secondary
            title={register ? t("عندي حساب بالفعل") : t("أول مرة؟ اعمل حساب")}
            onPress={() => setRegister(!register)}
          />
          <Pressable
            onPress={async () => {
              if (!email.trim()) return Alert.alert(t("اكتب بريدك أولًا"));
              try {
                await sendPasswordResetEmail(auth, email.trim());
                Alert.alert(
                  t("راجع بريدك"),
                  t("لو البريد مسجّل هيوصلك رابط لتغيير كلمة المرور."),
                );
              } catch (e) {
                error(e, t);
              }
            }}
          >
            <Label style={[s.subtitle, { marginTop: 18 }]}>
              {" "}{t("نسيت كلمة المرور؟")}{" "}</Label>
          </Pressable>
        </View>
        <Label style={[s.subtitle, { marginTop: 24 }]}>
          {" "}{t("بياناتك خاصة بحسابك • التحليلات اختيارية")}{" "}</Label>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
type Timer = {
  habitId: string;
  date: string;
  remaining: number;
  end: number | null;
};
function Home({ user }: { user: FirebaseAuthTypes.User }) {
  const { t, language } = useLanguage();
  const s = makeStyles(language === "ar");
  const days = [t("أحد"), t("إثنين"), t("ثلاثاء"), t("أربعاء"), t("خميس"), t("جمعة"), t("سبت")];
  const [habits, setHabits] = useState<Habit[]>([]),
    [entries, setEntries] = useState<Entry[]>([]),
    [ready, setReady] = useState(false),
    [entriesReady, setEntriesReady] = useState(false),
    [filter, setFilter] = useState<"all" | "done" | "pending">("all"),
    [query, setQuery] = useState(""),
    [habitsFailed, setHabitsFailed] = useState(false),
    [entriesFailed, setEntriesFailed] = useState(false),
    [tab, setTab] = useState("today"),
    [today, setToday] = useState(dateKey()),
    [busy, setBusy] = useState(false),
    [editor, setEditor] = useState<Habit | null | undefined>(undefined),
    [name, setName] = useState(""),
    [minutes, setMinutes] = useState("20"),
    [selected, setSelected] = useState([0, 1, 2, 3, 4, 5, 6]),
    [emoji, setEmoji] = useState("🌿"),
    [color, setColor] = useState(colors[0]),
    [timer, setTimer] = useState<Timer | null>(null),
    [timerReady, setTimerReady] = useState(false),
    [tick, setTick] = useState(Date.now()),
    [consent, setConsent] = useState(false),
    [historyDate, setHistoryDate] = useState(dateKey());
  const timerKey = "timer:" + user.uid;
  useEffect(() => {
    let active = true;
    const a = onSnapshot(
      habitsRef(user.uid),
      (snap) => {
        setHabits(
          snap.docs.map(
            (d: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
              d.data() as Habit,
          ),
        );
        setReady(true);
        setHabitsFailed(false);
      },
      () => {
        setHabitsFailed(true);
        setReady(true);
      },
    );
    const b = onSnapshot(
      entriesRef(user.uid),
      (snap) => {
        setEntries(
          snap.docs.map(
            (d: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
              d.data() as Entry,
          ),
        );
        setEntriesReady(true);
        setEntriesFailed(false);
      },
      () => { setEntriesFailed(true); setEntriesReady(true); },
    );
    AsyncStorage.getItem(timerKey)
      .then((v) => {
        if (active) {
          if (v) {
            try {
              setTimer(JSON.parse(v));
            } catch {}
          }
          setTimerReady(true);
        }
      })
      .catch(() => {
        if (active) setTimerReady(true);
      });
    getDoc(doc(db, "users", user.uid))
      .then(async (d) => {
        if (active) {
          const enabled = d.data()?.analytics === true;
          setConsent(enabled);
          await setAnalyticsCollectionEnabled(analytics, enabled);
        }
      })
      .catch(() => {});
    const interval = setInterval(() => {
      setTick(Date.now());
      setToday(dateKey());
    }, 1000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setTick(Date.now());
        setToday(dateKey());
      }
    });
    return () => {
      active = false;
      a();
      b();
      clearInterval(interval);
      sub.remove();
    };
  }, [user.uid]);
  useEffect(() => {
    if (timerReady)
      AsyncStorage.setItem(timerKey, JSON.stringify(timer)).catch(() => {});
  }, [timer, timerReady]);
  const run = async (fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      error(e, t);
    } finally {
      setBusy(false);
    }
  };
  const activeHabits = habits.filter(
      (h) => !h.archivedDate || h.archivedDate > today,
    ),
    todays = activeHabits.filter((h) => due(h, today)),
    summary = metrics(habits, entries, today),
    dayStats = metrics(habits, entries, today, 1),
    remaining = timer
      ? Math.max(
          0,
          timer.end ? Math.ceil((timer.end - tick) / 1000) : timer.remaining,
        )
      : 0;
  function open(h: Habit | null) {
    setEditor(h);
    setName(h?.name || "");
    const sc = h?.schedules[h.schedules.length - 1];
    setMinutes(String(sc?.minutes || 20));
    setSelected(sc?.days || [0, 1, 2, 3, 4, 5, 6]);
    setEmoji(h?.emoji || "🌿");
    setColor(h?.color || colors[0]);
  }
  async function save() {
    if (
      !name.trim() ||
      name.trim().length > 60 ||
      !Number.isInteger(parseMinutes(minutes)) ||
      parseMinutes(minutes) < 1 ||
      parseMinutes(minutes) > 720 ||
      !selected.length
    )
      return Alert.alert(
        t("راجع بيانات المهمة"),
        t("الاسم من ١ إلى ٦٠ حرف، المدة من ١ إلى ٧٢٠ دقيقة، واختار يوم واحد على الأقل."),
      );
    await run(async () => {
      const from = editor ? shift(today, 1) : today;
      const h: Habit = {
        id:
          editor?.id ||
          `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        name: name.trim(),
        emoji,
        color,
        createdDate: editor?.createdDate || today,
        archivedDate: null,
        schedules: [
          ...(editor?.schedules.filter((x) => x.from < from) || []),
          { from, days: [...selected].sort(), minutes: parseMinutes(minutes) },
        ],
      };
      await saveHabit(user.uid, h);
      setEditor(undefined);
      void track("habit_saved");
    });
  }
  function mark(h: Habit, date = today) {
    if (date > today || !due(h, date)) return;
    void run(async () => {
      await complete(user.uid, h, date, schedule(h, date)!.minutes);
      if (timer?.habitId === h.id && timer.date === date) setTimer(null);
      void track("habit_completed");
    });
  }
  function start(h: Habit) {
    const go = () =>
      setTimer({
        habitId: h.id,
        date: today,
        remaining: schedule(h, today)!.minutes * 60,
        end: Date.now() + schedule(h, today)!.minutes * 60000,
      });
    if (timer && timer.habitId !== h.id)
      Alert.alert(t("تغيير المؤقّت؟"), t("هيتم إلغاء المؤقّت الحالي."), [
        { text: t("رجوع") },
        { text: t("ابدأ"), onPress: go },
      ]);
    else if (!timer) go();
  }
  const formatDate = (date: string) => new Date(date + "T12:00:00").toLocaleDateString(
    language === "ar" ? "ar-EG" : "en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const filters = (date: string) => <View style={{ gap: 8 }}>
    <Field placeholder={t("ابحث عن مهمة")} accessibilityLabel={t("ابحث عن مهمة")} value={query} onChangeText={setQuery} />
    <View style={s.wrap}>
      {(["all", "pending", "done"] as const).map(value => <Pressable key={value}
        accessibilityRole="button" accessibilityState={{ selected: filter === value }}
        onPress={() => setFilter(value)} style={[s.chip, filter === value && { backgroundColor: C.mint }]}>
        <Label style={{ color: filter === value ? C.bg : C.text }}>
          {t(value === "all" ? "الكل" : value === "done" ? "مكتملة" : "غير مكتملة")} · {filterTasks(habits, entries, date, value).length}
        </Label>
      </Pressable>)}
    </View>
  </View>;
  const templates = <View style={s.card}>
    <Label style={s.heading}>{t("عادات جاهزة للبداية")}</Label>
    <View style={s.wrap}>
      {([
        { title: "قراءة", emoji: "📖", minutes: "15" },
        { title: "حركة ونشاط", emoji: "💪", minutes: "20" },
        { title: "تأمل", emoji: "🧘", minutes: "5" },
      ] as const).map(item => <Pressable key={item.title} style={s.chip} accessibilityRole="button"
        onPress={() => { open(null); setName(t(item.title)); setEmoji(item.emoji); setMinutes(item.minutes); }}>
        <Label>{item.emoji} {t(item.title)}</Label>
      </Pressable>)}
    </View>
  </View>;
  const habitCard = (h: Habit, date: string, editable = false) => {
    const status = taskStatus(h, entries, date);
    const done = status === "done";
    const count = entries.filter((e) => e.habitId === h.id).length;
    return (
      <View
        key={h.id}
        style={[s.card, { borderLeftWidth: 3, borderLeftColor: h.color }]}
      >
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Label style={s.heading}>{h.name}</Label>
            <Label style={s.small}>
              {schedule(h, date)?.minutes || h.schedules.at(-1)?.minutes} {" "}{t("دقيقة ·")}{" "}{count} {" "}{t("إنجاز · 🔥")}{" "}{streak(h, entries, today)}
            </Label>
          </View>
          <View style={[s.emoji, { backgroundColor: h.color + "20" }]}>
            <Label style={{ fontSize: 25 }}>{h.emoji}</Label>
          </View>
        </View>
        <Label style={{ color: done ? C.mint : C.muted }}>
          {done ? "✓ " + t("مكتملة") : status === "pending" ? "○ " + t("غير مكتملة") : t("غير مجدولة")}
        </Label>
        {editable ? (
          <View style={s.row}>
            <Pressable onPress={() => open(h)}>
              <Label style={s.link}>{t("تعديل")}</Label>
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert(
                  t("أرشفة المهمة؟"),
                  t("تتوقف من بكرة ويظل سجلها محفوظ."),
                  [
                    { text: t("رجوع") },
                    {
                      text: t("أرشفة"),
                      onPress: () =>
                        void run(() =>
                          saveHabit(user.uid, {
                            ...h,
                            archivedDate: shift(today, 1),
                          }),
                        ),
                    },
                  ],
                )
              }
            >
              <Label style={s.small}>{t("أرشفة")}</Label>
            </Pressable>
            <Label style={s.small}>
              {metrics([h], entries, today).rate}{t("% انتظام")}{" "}</Label>
          </View>
        ) : (
          <View style={s.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={h.name + ": " + (done ? t("إلغاء الإنجاز") : t("○ علّم كمكتملة"))}
              disabled={busy || date > today}
              style={[s.pill, done && { backgroundColor: C.mint }]}
              onPress={() =>
                done
                  ? Alert.alert(t("إلغاء الإنجاز؟"), t("هيتم تحديث الإحصائيات."), [
                      { text: t("رجوع") },
                      {
                        text: t("إلغاء الإنجاز"),
                        onPress: () =>
                          void run(() => undo(user.uid, h.id + "_" + date)),
                      },
                    ])
                  : mark(h, date)
              }
            >
              <Label style={{ color: done ? C.bg : C.mint }}>
                {done ? t("✓ تم الإنجاز") : t("○ علّم كمكتملة")}
              </Label>
            </Pressable>
            {!done && date === today && (
              <Pressable disabled={!timerReady} onPress={() => start(h)}>
                <Label style={s.link}>{t("ابدأ التركيز ▷")}</Label>
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  };
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.row}>
          <Image source={require("./logo.png")} style={s.avatar} accessibilityLabel={t("خُطوة")} />
          <View>
            <Label style={s.small}>{t("مساحتك للنمو")}</Label>
            <Label style={s.brand}>{t("خُطوة")}</Label>
          </View>
        </View>
        <Label style={[s.heroTitle, { marginTop: 26 }]}>
          {tab === "today"
            ? t("يوم جديد، فرصة جديدة.")
            : tab === "habits"
              ? t("عادات صغيرة، أثر كبير.")
              : tab === "stats"
                ? t("بص على اللي حققته.")
                : t("مساحتك الخاصة.")}
        </Label>
        <Label style={s.subtitle}>
          {new Date(today + "T12:00:00").toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </Label>
        {(habitsFailed || entriesFailed) && (
          <View style={s.card}>
            <Label>
              {" "}{t("تعذّر تحميل بعض البيانات. راجع الإنترنت وFirestore Rules.")}{" "}</Label>
          </View>
        )}
        {!ready || !entriesReady ? (
          <ActivityIndicator color={C.mint} style={{ margin: 40 }} />
        ) : (
          <>
            {tab === "today" && (
              <>
                <LinearGradient colors={["#264936", "#182C29"]} style={s.hero}>
                  <Label style={{ color: C.mint }}>{t("زخمك اليومي")}</Label>
                  <View style={s.row}>
                    <View>
                      <Label style={[s.heroTitle, { fontSize: 46 }]}>
                        {dayStats.rate}
                        <Text style={{ fontSize: 22 }}>%</Text>
                      </Label>
                      <Label style={s.small}>
                        {dayStats.done} {" "}{t("من")}{" "}{dayStats.expected} {" "}{t("مهام النهارده")}{" "}</Label>
                    </View>
                    <View style={s.orbit}>
                      <Label style={{ fontSize: 42 }}>✳</Label>
                    </View>
                  </View>
                  <View style={s.track}>
                    <View style={[s.fill, { width: `${dayStats.rate}%` }]} />
                  </View>
                  <Label style={{ marginTop: 14, color: C.mint }}>
                    {dayStats.expected && dayStats.done === dayStats.expected
                      ? t("رائع! خلصت كل مهام النهارده ✨")
                      : t("مش لازم تكون مثالي، المهم تستمر.")}
                  </Label>
                </LinearGradient>
                <View style={s.card}>
                  <Label style={s.heading}>{t("سجل الأيام")}</Label>
                  <View style={[s.wrap, { gap: 6 }]}>
                    {range(today, 7).map(date => {
                      const stats = metrics(habits, entries, date, 1);
                      return <Pressable key={date} accessibilityRole="button"
                        accessibilityLabel={formatDate(date) + ": " + stats.done + "/" + stats.expected + " " + t("مكتملة")}
                        onPress={() => { setHistoryDate(date); setFilter("all"); setQuery(""); setTab("stats"); }}
                        style={[s.chip, { minWidth: 54, alignItems: "center", borderWidth: 1, borderColor: date === today ? C.mint : C.line }]}>
                        <Label style={s.small}>{days[new Date(date + "T12:00:00").getDay()]}</Label>
                        <Label style={{ color: stats.expected && stats.done === stats.expected ? C.mint : C.text }}>{stats.done}/{stats.expected}</Label>
                      </Pressable>;
                    })}
                  </View>
                </View>
                <View style={s.row}>
                  <Pressable onPress={() => open(null)}>
                    <Label style={s.link}>{t("＋ مهمة جديدة")}</Label>
                  </Pressable>
                  <Label style={s.heading}>{t("خطة النهارده")}</Label>
                </View>
                {filters(today)}
                <Label style={s.small}>{t("باقي اليوم")}: {dayStats.expected - dayStats.done}</Label>
                {filterTasks(habits, entries, today, filter, query).map(h => habitCard(h, today))}
                {!!todays.length && !filterTasks(habits, entries, today, filter, query).length && <Label style={s.subtitle}>{t("لا توجد مهام مطابقة")}</Label>}
                {!todays.length && (
                  <View style={s.card}>
                    <Label style={{ fontSize: 40 }}>🌱</Label>
                    <Label style={s.heading}>{t("ابدأ بخطوة بسيطة")}</Label>
                    <Label style={s.subtitle}>
                      {" "}{t("مفيش مهام مجدولة لليوم. أضف قراءة أو رياضة أو وقت لنفسك.")}{" "}</Label>
                    <Button title={t("أضف أول مهمة")} onPress={() => open(null)} />
                  </View>
                )}
              </>
            )}
            {tab === "habits" && (
              <>
                <Button title={t("＋ أضف عادة جديدة")} onPress={() => open(null)} />
                {templates}
                {activeHabits.map((h) => habitCard(h, today, true))}
                {habits
                  .filter((h) => h.archivedDate && h.archivedDate <= today)
                  .map((h) => (
                    <View key={h.id} style={s.card}>
                      <Label>
                        {h.emoji} {h.name} {" "}{t("· مؤرشفة")}{" "}</Label>
                      <Label style={s.small}>
                        {entries.filter((e) => e.habitId === h.id).length} {" "}{t("إنجاز محفوظ")}{" "}</Label>
                    </View>
                  ))}
              </>
            )}
            {tab === "stats" && (
              <>
                <View style={s.card}>
                  <Label>{t("المنجز هذا الأسبوع")}: {metrics(habits, entries, today, 7).done}</Label>
                  <Label>{t("أفضل سلسلة حالية")}: {Math.max(0, ...activeHabits.map(h => streak(h, entries, today)))} {t("يوم")}</Label>
                </View>
                <View style={s.statRow}>
                  {[
                    [`${summary.rate}%`, t("انتظام آخر ٣٠ يوم")],
                    [`${entries.length}`, t("إجمالي الإنجازات")],
                    [
                      `${entries.reduce((n, e) => n + e.minutes, 0)}`,
                      t("دقائق مخططة منجزة"),
                    ],
                  ].map(([v, l]) => (
                    <View key={l} style={[s.card, { flex: 1, padding: 12 }]}>
                      <Label
                        style={[s.heading, { color: C.mint, fontSize: 24 }]}
                      >
                        {v}
                      </Label>
                      <Label style={[s.small, { fontSize: 10 }]}>{l}</Label>
                    </View>
                  ))}
                </View>
                <View style={s.card}>
                  <Label style={s.heading}>{t("إيقاع الأسبوع")}</Label>
                  <View style={s.chart}>
                    {range(today, 7).map((d) => {
                      const m = metrics(habits, entries, d, 1);
                      return (
                        <View key={d} style={s.barColumn}>
                          <Label style={{ fontSize: 10, color: C.muted }}>
                            {m.expected ? m.rate + "%" : "—"}
                          </Label>
                          <View style={s.barTrack}>
                            <View
                              style={[
                                s.bar,
                                {
                                  height: `${m.rate}%`,
                                  backgroundColor:
                                    d === today ? C.mint : C.purple,
                                },
                              ]}
                            />
                          </View>
                          <Label style={{ fontSize: 10 }}>
                            {days[new Date(d + "T12:00:00").getDay()]}
                          </Label>
                        </View>
                      );
                    })}
                  </View>
                </View>
                <View style={s.card}>
                  <Label style={s.heading}>{t("كل خطوة بتفرق")}</Label>
                  <Label style={s.small}>
                    {" "}{t("آخر ٣٠ يوم · اضغط على يوم لعرض تفاصيله")}{" "}</Label>
                  <View style={s.heatmap}>
                    {range(today, 30).map((d) => {
                      const m = metrics(habits, entries, d, 1);
                      return (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ selected: historyDate === d }}
                          accessibilityLabel={formatDate(d) + ": " + m.done + "/" + m.expected + " " + t("مكتملة")}
                          key={d}
                          onPress={() => setHistoryDate(d)}
                          style={[
                            s.cell,
                            {
                              backgroundColor: !m.done
                                ? C.line
                                : m.rate === 100
                                  ? C.mint
                                  : "#528D70",
                              borderWidth: historyDate === d ? 2 : 0,
                              borderColor: "#FFFFFF",
                            },
                          ]}
                        />
                      );
                    })}
                  </View>
                  <Label>{formatDate(historyDate)}</Label>
                </View>
                <View style={s.card}>
                  <Label style={s.heading}>{t("سجل الأيام")}</Label>
                  <View style={s.row}>
                    <Button secondary title={t("اليوم السابق")} onPress={() => setHistoryDate(shift(historyDate, -1))} />
                    <Button secondary title={t("اليوم التالي")} disabled={historyDate >= today} onPress={() => setHistoryDate(shift(historyDate, 1))} />
                  </View>
                  <Label>{formatDate(historyDate)}</Label>
                  <Button secondary title={t("اليوم")} onPress={() => setHistoryDate(today)} />
                  <Label>{t("مكتملة")}: {metrics(habits, entries, historyDate, 1).done} · {t("غير مكتملة")}: {metrics(habits, entries, historyDate, 1).expected - metrics(habits, entries, historyDate, 1).done}</Label>
                  {filters(historyDate)}
                </View>
                {filterTasks(habits, entries, historyDate, filter, query).map(h => habitCard(h, historyDate))}
                {!filterTasks(habits, entries, historyDate, filter, query).length && <Label style={s.subtitle}>{t(habits.some(h => due(h, historyDate)) ? "لا توجد مهام مطابقة" : "لا توجد مهام مجدولة لهذا اليوم")}</Label>}
                <Label style={s.small}>
                  {" "}{t("الانتظام = الإنجازات ÷ المهام المجدولة. الدقائق هي مدة المهام المنجزة، وليست قياسًا لوقت استخدام الهاتف.")}{" "}</Label>
              </>
            )}
            {tab === "settings" && (
              <>
                <LanguageSwitch />
                <View style={s.card}>
                  <Label style={s.heading}>{t("حسابي")}</Label>
                  <Label style={s.small}>{user.email}</Label>
                  <Label style={[s.small, { marginTop: 15 }]}>
                    {" "}{t("المظهر: ليلي 🌙 · اليوم حسب توقيت جهازك")}{" "}</Label>
                </View>
                <View style={s.card}>
                  <View style={s.row}>
                    <Switch
                      value={consent}
                      trackColor={{ true: "#528D70" }}
                      onValueChange={(v) =>
                        void run(async () => {
                          await setDoc(
                            doc(db, "users", user.uid),
                            { analytics: v },
                            { merge: true },
                          );
                          await setAnalyticsCollectionEnabled(analytics, v);
                          setConsent(v);
                        })
                      }
                    />
                    <Label style={s.heading}>{t("تحليلات الاستخدام")}</Label>
                  </View>
                  <Label style={s.small}>
                    {" "}{t("اختياري: إرسال أحداث عامة مثل إكمال مهمة لتحسين التطبيق. لا نرسل أسماء المهام أو البريد في الأحداث.")}{" "}</Label>
                </View>
                <View style={s.card}>
                  <Label style={s.heading}>{t("على مهلك، لكن استمر 🌿")}</Label>
                  <Label style={s.small}>
                    {" "}{t("ابدأ بعادتين صغيرتين. تعديل أيام المهمة ومدتها يبدأ من بكرة لحماية سجلّك. المؤقّت لا يسجّل الإنجاز تلقائيًا.")}{" "}</Label>
                </View>
                <Button
                  secondary
                  title={t("تسجيل الخروج")}
                  disabled={busy}
                  onPress={() =>
                    void run(async () => {
                      await setAnalyticsCollectionEnabled(analytics, false);
                      await signOut(auth);
                    })
                  }
                />
              </>
            )}
          </>
        )}
      </ScrollView>
      {timer && (
        <View style={s.timer}>
          <View style={s.row}>
            <Pressable accessibilityRole="button" accessibilityLabel={t("إلغاء المؤقت")} onPress={() => setTimer(null)}>
              <Ionicons name="close" size={24} color={C.muted} />
            </Pressable>
            <Label>
              {habits.find((h) => h.id === timer.habitId)?.name ||
                t("جلسة التركيز")}{" "}
              · {Math.floor(remaining / 60)}:
              {String(remaining % 60).padStart(2, "0")}
            </Label>
            <Pressable
              accessibilityRole="button" accessibilityLabel={t("إيقاف أو استئناف المؤقت")}
              onPress={() =>
                setTimer({
                  ...timer,
                  remaining,
                  end: timer.end ? null : Date.now() + remaining * 1000,
                })
              }
            >
              <Ionicons
                name={timer.end ? "pause" : "play"}
                size={24}
                color={C.mint}
              />
            </Pressable>
          </View>
          {remaining === 0 && (
            <Button
              disabled={busy}
              title={t("الجلسة خلصت ✨ سجّل الإنجاز")}
              onPress={() => {
                const h = habits.find((x) => x.id === timer.habitId);
                if (h) mark(h, timer.date);
              }}
            />
          )}
        </View>
      )}
      <View style={s.nav}>
        {[
          ["settings", "options-outline", t("حسابي")],
          ["stats", "stats-chart-outline", t("إحصائياتي")],
          ["habits", "grid-outline", t("عاداتي")],
          ["today", "sunny-outline", t("يومي")],
        ].map(([key, icon, title]) => (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === key }}
            style={s.navItem}
            onPress={() => {
              setTab(key);
              void track("tab_opened");
            }}
          >
            <Ionicons
              name={icon as any}
              size={23}
              color={tab === key ? C.mint : C.muted}
            />
            <Label
              style={{ fontSize: 11, color: tab === key ? C.mint : C.muted }}
            >
              {title}
            </Label>
          </Pressable>
        ))}
      </View>
      <Modal
        visible={editor !== undefined}
        animationType="slide"
        onRequestClose={() => setEditor(undefined)}
      >
        <SafeAreaView style={s.screen}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView contentContainerStyle={s.content}>
              <View style={s.row}>
                <Pressable onPress={() => setEditor(undefined)}>
                  <Label style={s.link}>{t("إغلاق")}</Label>
                </Pressable>
                <Label style={s.heading}>
                  {editor ? t("تعديل العادة") : t("خطوة جديدة 🌱")}
                </Label>
              </View>
              <Label style={s.subtitle}>
                {" "}{t("اختار حاجة بسيطة تقدر تلتزم بيها.")}{" "}</Label>
              <Label>{t("اسم المهمة")}</Label>
              <Field
                value={name}
                onChangeText={setName}
                maxLength={60}
                placeholder={t("مثلًا: قراءة ١٠ صفحات")}
              />
              <Label>{t("المدة بالدقائق")}</Label>
              <Field
                value={minutes}
                onChangeText={setMinutes}
                keyboardType="number-pad"
                placeholder="20"
              />
              <Label>{t("أيام التكرار")}</Label>
              <View style={s.wrap}>
                {([
                  ["كل يوم", [0, 1, 2, 3, 4, 5, 6]],
                  ["أيام العمل", language === "ar" ? [0, 1, 2, 3, 4] : [1, 2, 3, 4, 5]],
                  ["نهاية الأسبوع", language === "ar" ? [5, 6] : [0, 6]],
                ] as const).map(([title, values]) => <Pressable key={title} accessibilityRole="button" style={s.chip} onPress={() => setSelected([...values])}><Label>{t(title)}</Label></Pressable>)}
              </View>
              <View style={s.wrap}>
                {days.map((d, i) => (
                  <Pressable
                    key={d}
                    style={[
                      s.chip,
                      selected.includes(i) && { backgroundColor: C.mint },
                    ]}
                    onPress={() =>
                      setSelected(
                        selected.includes(i)
                          ? selected.filter((n) => n !== i)
                          : [...selected, i],
                      )
                    }
                  >
                    <Label
                      style={{
                        color: selected.includes(i) ? C.bg : C.text,
                        fontSize: 12,
                      }}
                    >
                      {d}
                    </Label>
                  </Pressable>
                ))}
              </View>
              <Label>{t("رمز العادة")}</Label>
              <View style={s.wrap}>
                {emojis.map((e) => (
                  <Pressable
                    key={e}
                    style={[
                      s.chip,
                      emoji === e && { borderColor: C.mint, borderWidth: 1 },
                    ]}
                    onPress={() => setEmoji(e)}
                  >
                    <Label style={{ fontSize: 24 }}>{e}</Label>
                  </Pressable>
                ))}
              </View>
              <Label>{t("لونك المفضّل")}</Label>
              <View style={s.wrap}>
                {colors.map((c) => (
                  <Pressable
                    accessibilityLabel={t("لون") + c}
                    key={c}
                    onPress={() => setColor(c)}
                    style={[
                      s.color,
                      {
                        backgroundColor: c,
                        borderWidth: color === c ? 3 : 0,
                        borderColor: "white",
                      },
                    ]}
                  />
                ))}
              </View>
              {!!editor && (
                <Label style={s.small}>{t("تغيير المدة والأيام يبدأ من بكرة.")}</Label>
              )}
              <Button
                title={busy ? t("جاري الحفظ…") : t("احفظ الخطوة ←")}
                disabled={busy}
                onPress={save}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
export default function App() {
  return <LanguageProvider><AppContent /></LanguageProvider>;
}
function AppContent() {
  const { language } = useLanguage();
  const s = makeStyles(language === "ar");
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null),
    [loading, setLoading] = useState(true);
  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      }),
    [],
  );
  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.screen}>
        <StatusBar style="light" />
        {loading ? (
          <ActivityIndicator color={C.mint} style={{ flex: 1 }} />
        ) : user ? (
          <Home key={user.uid} user={user} />
        ) : (
          <Login />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
const createStyles = (rtl: boolean) => StyleSheet.create({
  screen: { direction: "ltr", flex: 1, backgroundColor: C.bg },
  text: { color: C.text, textAlign: rtl ? "right" : "left", writingDirection: rtl ? "rtl" : "ltr", fontSize: 15, lineHeight: 24 },
  content: {
    padding: 22,
    gap: 18,
    paddingBottom: 35,
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
  },
  login: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 26,
    maxWidth: 540,
    width: "100%",
    alignSelf: "center",
  },
  brand: { fontSize: 27, fontWeight: "900", lineHeight: 38 },
  logo: {
    width: 86,
    height: 86,
    borderRadius: 28,
    backgroundColor: "#31513E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,

  },
  heroTitle: { fontSize: 29, fontWeight: "800", lineHeight: 43 },
  subtitle: { color: C.muted, fontSize: 14, lineHeight: 24 },
  heading: { fontSize: 18, fontWeight: "700", lineHeight: 28 },
  small: { color: C.muted, fontSize: 12, lineHeight: 21 },
  card: {
    backgroundColor: C.card,
    padding: 20,
    borderRadius: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: C.line,
  },
  row: {
    flexDirection: rtl ? "row" : "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  avatar: {
    backgroundColor: "#263D32",
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: { padding: 24, borderRadius: 28, gap: 14 },
  orbit: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: "#609777",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#365B45",
  },
  track: {
    height: 7,
    backgroundColor: "#365244",
    borderRadius: 8,
    overflow: "hidden",
  },
  fill: { height: 7, backgroundColor: C.mint, borderRadius: 8 },
  button: {
    flexShrink: 1,
    padding: 15,
    borderRadius: 16,
    backgroundColor: C.mint,
    alignItems: "center",
    marginTop: 8,
  },
  input: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 15,
    padding: 16,
    color: C.text,
    textAlign: rtl ? "right" : "left", writingDirection: rtl ? "rtl" : "ltr",
    fontSize: 16,
    marginVertical: 5,
  },
  emoji: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#243E32",
  },
  link: { color: C.mint, fontSize: 13 },
  statRow: { flexDirection: rtl ? "row" : "row-reverse", gap: 8 },
  chart: {
    flexDirection: rtl ? "row-reverse" : "row",
    gap: 9,
    height: 185,
    alignItems: "flex-end",
    marginTop: 20,
  },
  barColumn: { flex: 1, alignItems: "center", gap: 6 },
  barTrack: {
    height: 120,
    width: "75%",
    backgroundColor: C.line,
    borderRadius: 8,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  bar: { width: "100%", borderRadius: 8 },
  heatmap: {
    flexDirection: rtl ? "row-reverse" : "row",
    flexWrap: "wrap",
    gap: 7,
    marginVertical: 15,
  },
  cell: { width: 25, height: 25, borderRadius: 7 },
  nav: {
    flexDirection: rtl ? "row" : "row-reverse",
    borderTopWidth: 1,
    borderColor: C.line,
    paddingVertical: 12,
    backgroundColor: C.bg,
  },
  navItem: { flex: 1, alignItems: "center", gap: 4 },
  timer: {
    backgroundColor: "#24382E",
    padding: 15,
    borderTopWidth: 1,
    borderColor: "#528D70",
  },
  wrap: {
    flexDirection: rtl ? "row-reverse" : "row",
    flexWrap: "wrap",
    gap: 9,
    marginVertical: 12,
  },
  chip: { backgroundColor: C.card, padding: 12, borderRadius: 12 },
  color: { width: 43, height: 43, borderRadius: 16 },
});

const localizedStyles = { ar: createStyles(true), en: createStyles(false) };
const makeStyles = (rtl: boolean) => localizedStyles[rtl ? "ar" : "en"];
