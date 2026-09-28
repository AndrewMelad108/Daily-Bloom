# Daily Bloom updates

- Arabic and English are available on the sign-in screen and in Account. The device remembers the choice. Interface text, dates, weekday names, form labels and alerts change immediately, with text alignment and layout matching the language. User-written habit names stay as entered.
- Each scheduled task has an explicit Done or Not done status. Unscheduled days are separate and never count as missed tasks. Marking a task done and undoing completion use the existing account's Firestore entries.
- Today includes a seven-day overview. Tap a day to inspect its history. Insights also supports previous/next day navigation and returning to today. Future dates cannot be completed.
- Search combines with All / Not done / Done filters. Daily summaries show completed and remaining tasks. Insights includes the last seven days' completions and the best current scheduled-day streak.
- Habits includes editable Reading, Movement and Mindfulness starters. The editor includes repeat-day presets and accepts Arabic or English duration digits.
- The existing root `logo.png` is used for the sign-in logo, app header, launcher icon and splash configuration. Android assets were regenerated with Expo prebuild. Rebuild the native app to see launcher/splash changes; future iOS prebuilds use the same configuration.

## Device smoke check

1. Switch language before signing in, restart the app, and verify the choice persists.
2. Sign in, add a starter habit, and set a duration such as `٢٠`.
3. Mark today's task done, filter by Done, then undo it and check Not done.
4. Select a previous scheduled day, change its status, and verify the calendar and statistics update. Check that rest days have no pending task.
5. Switch language in Account while a timer is running; verify names, timer state and task data persist.
6. Inspect both languages on a small screen and with larger text. Confirm the logo and launcher icon on a rebuilt device installation.

Automated checks cover model behavior, filters, schedule history, translated message coverage and duration parsing. Device/Firebase interaction still needs the smoke check above.
