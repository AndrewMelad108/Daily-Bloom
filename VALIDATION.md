# Validation

Current task (2026-09-29):

- Node 22.23.2: TypeScript check passed; 21 tests passed, including task-only data and rejection of saved Habit timers, completion isolation, rest-day filters, background deadline, pause and expiry notification state.
- Restored Today/Tasks/Insights/Account navigation (Habit feature removed, including subscriptions and editor): TypeScript check and Metro/Hermes Android export passed. The previous `configs.toReversed` failure is resolved under Node 22; use `nvm use` in each terminal.
- The preceding notification change's Android debug native build passed for x86_64 and arm64-v8a with Notifee and the generated notification icon.
- Expo Android prebuild passed; generated native files include notification permission and the bundled Notifee Maven repository.
- Emulator installation did not complete in the smoke-check session. Notification rendering, background countdown, permission denial and live task deletion still require device verification (see FEATURES.md).
- Firestore task rules were updated locally but were not deployed or tested against a Firestore emulator. Existing completion history is retained when a flexible task is deleted.
- iOS native compilation was not performed. Live countdown notifications are implemented for Android only.
