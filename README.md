# خُطوة · Daily Bloom

تطبيق React Native + Expo + TypeScript للعادات اليومية، بواجهة عربية داكنة وألوان mint/lavender، يعمل على Android وiOS.

## الموجود في المشروع

- حساب مستقل لكل مستخدم: إنشاء حساب، دخول، استعادة كلمة المرور، خروج، واستمرار جلسة الدخول.
- Firebase Auth وFirestore وFirebase Analytics native؛ موافقة اختيارية للتحليلات من الإعدادات.
- مهمة باسم ومدة ورمز ولون وأيام تكرار محددة؛ تعديل وأرشفة مع الاحتفاظ بالتاريخ.
- قائمة اليوم، إنجاز مرة واحدة لكل مهمة/يوم، إلغاء إنجاز، وعدد مرات التنفيذ.
- مؤقّت start/pause/resume يستعيد الموعد النهائي عند إعادة فتح التطبيق. لا يعمل كخدمة في الخلفية ولا يصدر تنبيهًا؛ يلزم تأكيد الإنجاز يدويًا.
- انتظام آخر 30 يوم، streak لكل مهمة، أعمدة الأسبوع، وتقويم إنجاز 30 يوم مع عرض اليوم وتعديل إنجازه.
- Firestore يعزل بيانات كل مستخدم ويستخدم التخزين المحلي native. تسجيل الدخول أول مرة يحتاج إنترنت، وعمليات الكتابة قد تظل معلقة لحين عودة الاتصال.
- GitHub Actions: فحص كل PR، وبناء Android وiOS عند كل push إلى main.

## 1. متطلبات التشغيل

Node.js 22 وnpm؛ حساب Firebase وحساب Expo. Android Studio لتشغيل Android محليًا، وmacOS + Xcode لتشغيل iOS محليًا. للبناء السحابي لا تحتاج Mac. هذا تطبيق native ولا يعمل داخل Expo Go بسبب React Native Firebase.

```bash
npm ci
```

## 2. إعداد Firebase

1. أنشئ مشروعًا في https://console.firebase.google.com وفعل Google Analytics للمشروع.
2. Authentication → Sign-in method → Email/Password → Enable.
3. Firestore Database → Create database → Production mode واختر المنطقة المناسبة.
4. في Project settings أضف Android app وiOS app. اختر identifiers خاصة بك، مثل `com.andrew.dailybloom`، وضع نفس القيمة في `android.package` و`ios.bundleIdentifier` داخل `app.config.js`.
5. نزّل `google-services.json` و`GoogleService-Info.plist` وضعهما بجوار `package.json`. لا تستخدم Firebase Admin service-account داخل التطبيق.
6. من Firestore → Rules انسخ محتوى `firestore.rules` ثم Publish. أو استخدم Firebase CLI:

```bash
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules
```

هيكل البيانات:

```text
users/{uid}                         { analytics: boolean }
users/{uid}/habits/{habitId}         Habit + schedule revisions
users/{uid}/entries/{habitId_DATE}   one completion per calendar day
```

القواعد تمنع مستخدمًا من الوصول لبيانات مستخدم آخر. التطبيق شخصي ولا توجد leaderboard أو صلاحيات مشرف. تحقق الجدول المتداخل يتم في العميل؛ لا تستخدم هذه البيانات لمكافآت مالية أو منافسة موثوقة دون تحقق backend إضافي.

## 3. التشغيل على جهاز

```bash
npx expo run:android
# على macOS فقط:
npx expo run:ios
# بعد تثبيت development build:
npm start
```

أعد بناء development client بعد إضافة/تغيير native modules أو ملفات Firebase. لا يكفي تحديث JavaScript.

## 4. إعداد EAS مرة واحدة

```bash
npx eas-cli login
npx eas-cli init
```

ضع UUID المشروع الناتج مكان `REPLACE_WITH_EAS_PROJECT_ID` في `app.config.js`، واحتفظ بهذه القيمة في الملف المرفوع إلى GitHub حتى تكون متاحة أيضًا على خادم البناء. لو أضاف `eas init` حقل owner، احتفظ به.

في Expo dashboard → Project → Environment variables أنشئ للبيئات development / preview / production:

| الاسم | النوع | القيمة |
|---|---|---|
| GOOGLE_SERVICES_JSON | File / Secret | ملف google-services.json |
| GOOGLE_SERVICES_PLIST | File / Secret | ملف GoogleService-Info.plist |

`app.config.js` يستخدم المسار الذي توفره EAS لهذه الملفات، ويستخدم الملفات المحلية أثناء التطوير. لا تضع service-account JSON بدل ملف إعداد Android.

نفّذ أول build تفاعليًا لضبط التوقيع قبل CI:

```bash
npx eas-cli build --platform android --profile preview
npx eas-cli device:create
npx eas-cli build --platform ios --profile preview
```

EAS يدير Android keystore وApple signing credentials. iOS على جهاز حقيقي يحتاج عضوية Apple Developer وتسجيل أجهزة الاختبار لتوزيع Ad Hoc. زيادة الأجهزة تحتاج build جديد أو إعادة توقيع. ملف IPA ليس ملفًا يمكن لأي iPhone تثبيته مباشرة.

## 5. GitHub Actions مع كل تحديث

الملف جاهز: `.github/workflows/build.yml`.

1. ارفع محتويات هذا المجلد إلى root مستودع GitHub، بما فيها `package-lock.json` ومجلد `.github` المخفي.
2. أنشئ Expo access token من https://expo.dev/accounts ثم Account settings → Access tokens.
3. GitHub → Settings → Secrets and variables → Actions → Secrets: أضف `EXPO_TOKEN`.
4. في Variables أضف `EXPO_PUBLIC_EAS_PROJECT_ID` بقيمة UUID المشروع، حتى لو كتبته في config.
5. تأكد من رفع ملفات Firebase كـ EAS File variables ومن نجاح أول build تفاعلي للمنصتين.
6. كل push إلى `main` يشغّل TypeScript والاختبارات ثم EAS build للمنصتين بالتوازي. PR يشغّل الفحوصات فقط، ولا يكشف أسرار البناء.
7. النتيجة: Android APK للتثبيت وiOS Ad Hoc IPA للأجهزة المسجلة. الروابط تظهر في EAS dashboard وداخل `build-result.json` المرفوع كـ GitHub artifact. الـartifact يحتوي بيانات ورابط البناء؛ ملف APK/IPA نفسه محفوظ في EAS.
8. لبناء إصدار المتاجر: Actions → Validate and build Android + iOS → Run workflow → profile `production`. اضبط توقيع production أولًا بـ `npx eas-cli build --platform all --profile production`.

إصدار production ينتج AAB لـ Google Play وIPA لـ App Store/TestFlight. البناء لا ينشر تلقائيًا للمتاجر. الإرسال يحتاج إعداد حسابات المتاجر ثم `eas submit`. البناء السحابي وGitHub Actions يخضعان لحصص حساباتك؛ راجع لوحة حسابك قبل تفعيل builds كثيرة.

## طريقة حساب الإحصائيات

- اليوم حسب التاريخ المحلي للجهاز. حافظ على timezone ثابت إذا كنت تقارن فترات متتالية أثناء السفر.
- نسبة الانتظام = عدد المهام المجدولة التي تم تنفيذها ÷ عدد المهام المجدولة في آخر 30 يوم × 100.
- الأيام السابقة لإنشاء المهمة وأيام الراحة لا تدخل في المقام. أيام المستقبل لا تدخل.
- تعديل المدة/أيام التكرار يبدأ غدًا؛ الاسم واللون والرمز يتغيرون فورًا. تاريخ المدة والجدول محفوظ في schedules.
- الأرشفة تبدأ غدًا ولا تحذف الإنجازات السابقة.
- streak يتجاهل أيام الراحة، ولا ينكسر بسبب عدم إكمال مهمة اليوم حتى يمر اليوم.
- أرقام الدقائق هي المدة المخططة للمهام التي علّمتها مكتملة، وليست وقت التركيز المقاس.
- المؤقّت العابر لمنتصف الليل يسجّل إنجازه بتاريخ بدايته.
- يمكنك تصحيح إنجازات آخر 30 يوم يدويًا من الإحصائيات.

## الاختبار والتحقق

```bash
npm run typecheck
npm test
npx expo install --check
```

اختبارات منطق الإحصائيات تشمل تغيير الجدول والأرشفة وأيام الراحة وعدم تكرار الإنجاز وحدود الشهر. مطلوب اختبار على Android وiOS متصلين بمشروع Firebase الخاص بك: تسجيل/دخول، إعادة تشغيل، استعادة كلمة المرور، إنشاء/تعديل، مؤقّت في الخلفية، إلغاء إنجاز، قطع وعودة الشبكة، ورفض وصول حساب آخر إلى المسارات.

لم يتم توفير credentials أو مشروع Firebase/Expo في الطلب، لذلك لا يتضمن ZIP ملفات Firebase الحقيقية أو binaries موقعة، ولم يُنفذ build native متصل بخدماتك.

## إضافات لاحقة مفيدة

الإشعارات المحلية وتحديد وقت لكل عادة، تصدير البيانات وحذف الحساب ذاتيًا، ومشاركة تحديات اختيارية. هذه ليست مفعلة في هذه النسخة. قبل نشر تطبيق عام أضف سياسة خصوصية ومسار حذف الحساب والبيانات وإفصاحات المتاجر الملائمة.

## المراجع

- https://rnfirebase.io/
- https://rnfirebase.io/analytics/usage
- https://docs.expo.dev/guides/using-firebase/
- https://docs.expo.dev/build/building-on-ci/
- https://docs.expo.dev/build/internal-distribution/
# Daily-Bloom
