# Validation

- TypeScript strict typecheck: passed.
- Domain tests: 6 passed (schedule denominator, history-preserving revisions, archive boundaries, streak rest days, duplicate completion, month boundaries / empty denominator).
- Expo dependency compatibility check: passed.
- Metro/Hermes Android JavaScript export: passed.
- Metro/Hermes iOS JavaScript export: passed.
- Exports warn that Firebase service files are missing, as expected: user-owned Firebase credentials were not supplied.
- Native compilation, signed binaries, live Firebase integration, Firestore emulator security tests, and on-device visual/runtime testing were not performed.
- Bundling is not equivalent to a native build or device validation.
