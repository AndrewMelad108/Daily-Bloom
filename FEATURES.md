# Tasks

The bottom navigation contains Today, Tasks, Insights and Account. The Habit feature is removed, including its data subscriptions, editor and records in task lists/statistics. Today restores the daily progress card and seven-day overview; Insights restores totals, streaks, charts, the calendar and editable day history. Both use the same task data as Tasks. Account keeps language, privacy preference and sign-out.

- Create, edit, search, filter by completion, complete and undo tasks.
- Essential tasks repeat daily. Flexible tasks use selected days and offer deletion with confirmation. Rest-day tasks remain visible under All so they can still be edited or deleted.
- Every task has a duration and focus timer. Existing tasks without a duration default to 20 minutes until edited.
- Only task records are loaded. Stored Habit data is untouched in Firestore but is not shown, edited or counted by this app. Existing task timers are preserved; saved Habit timers are discarded.
- Android shows a native countdown notification with the task name, synchronized with pause/resume. It disappears on cancellation, completion, sign-out or expiry. Allow notification permission when prompted. This feature is Android-only; expiry does not automatically complete tasks.

- New task completions store their planned duration for statistics. Older completions without recorded minutes still count as completions but do not contribute guessed minutes.

## Setup

```bash
nvm use
npm run android
```

Deploy the updated task permissions and optional duration validation separately:

```bash
npx firebase-tools deploy --only firestore:rules
```

## Verification

Automated checks cover task identity, historical completion, default durations, essential-task classification, archive handling, rest-day filters, translations and notification timing.

On a device, verify task create/edit/complete/undo/delete with Firestore, then start a one-minute timer, background the app, pause/resume and cancel. Check permission denial and expiry. Native notification behavior uses [Notifee's Android chronometer](https://notifee.app/react-native/docs/android/timers/).
