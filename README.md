# Attendance Tracker

A full-stack attendance tracking application with Google Classroom integration. Built as a **pnpm monorepo** with a Next.js web dashboard and an Expo React Native mobile app, sharing a common domain layer and backed by Firebase.

## Features

### Attendance Management
- Add courses manually or sync them from Google Classroom
- Mark attendance (present/absent) per course per day with running counters
- Per-course detail page with a monthly calendar showing color-coded attendance history
- Real-time attendance percentage with a 75% target threshold
- Smart status messages ("You can miss 3 more classes" / "Need to attend 2 more classes")
- Baseline present/absent support for mid-semester onboarding

### Google Classroom Integration
- One-click sync of active Classroom courses, coursework, and submission status
- OAuth access tokens are refreshed transparently when expired (no manual sign-out needed)
- Coursework synced as tasks with due dates and completion status

### Tasks & Deadlines
- Interactive calendar (month + agenda views) showing all tasks
- Add manual tasks with custom due dates
- Toggle task completion by clicking on the calendar
- Upcoming reminders panel on the dashboard
- Push notifications on mobile (1 hour before each task's due time)

### Cross-Platform
- **Web**: Next.js dashboard deployed as a static site on Firebase Hosting
- **Mobile**: Expo/React Native app with EAS Build for Android APK distribution
- Shared domain logic (types, attendance math, Classroom client, theme) across both platforms

## Architecture

```
attendance-tracker/
├── apps/
│   ├── web/          # Next.js 16 dashboard (static export)
│   └── mobile/       # Expo SDK 57 / React Native app
├── packages/
│   └── shared/       # Shared types, math, Classroom API client, theme
├── firebase.json     # Hosting + Firestore + Emulator config
├── firestore.rules   # Per-user security rules
├── turbo.json        # Turborepo task orchestration
└── package.json      # Root workspace config
```

### Data Model (Firestore)

```
users/{uid}/
├── courses/{courseId}
│   ├── name, color, baselinePresent, baselineAbsent, classroomId?
│   └── logs/{yyyy-mm-dd}
│       └── present (number), absent (number)
└── tasks/{taskId}
    └── title, dueAt, source (classroom|manual), done, courseId?, alternateLink?
```

Security rules enforce that each user can only read/write their own `users/{uid}` subtree.

## Tech Stack

| Layer | Web | Mobile | Shared |
|---|---|---|---|
| Framework | Next.js 16.3 (App Router, static export) | Expo SDK 57, React Native 0.86 | — |
| Language | TypeScript 5 | TypeScript 6 | TypeScript 6 |
| UI | React 19, Tailwind CSS v4 | React 19, React Native core | — |
| Auth | Firebase Auth (Google Sign-In via popup) | React Native Firebase Auth + native Google Sign-In | — |
| Database | Firebase JS SDK (Firestore) | React Native Firebase (Firestore) | — |
| Calendar | react-big-calendar + date-fns | react-native-calendars + date-fns | — |
| Navigation | Next.js App Router | React Navigation v7 (tabs + native stack) | — |
| Notifications | — | expo-notifications (scheduled local) | — |
| Validation | — | — | Zod 4 |
| API Client | — | — | Classroom REST API (fetch-based) |
| Bundler | Turbopack | Metro (Expo) | — |
| Build/Deploy | Firebase Hosting | EAS Build (Android APK) | — |

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 9+
- Firebase CLI (`npm install -g firebase-tools`)

### Install

```bash
git clone https://github.com/7beastgamer/Attendance_tracker.git
cd Attendance_tracker
pnpm install
```

### Development

```bash
# Run the web dashboard
pnpm dev          # starts Next.js dev server via Turborepo

# Or run just the web app
cd apps/web
npm run dev

# Run the mobile app
cd apps/mobile
npx expo start
```

### Build

```bash
# Build all workspaces
pnpm build

# Build web only (generates static export in apps/web/out/)
cd apps/web
npm run build

# Build mobile APK via EAS
cd apps/mobile
npx eas-cli build --platform android --profile preview
```

### Deploy

```bash
# Deploy web to Firebase Hosting
firebase use tracker
firebase deploy --only hosting

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

### Firebase Emulators

```bash
firebase emulators:start
```
Auth runs on port 9099, Firestore on 8080. To connect the web app to emulators, uncomment the emulator block in `apps/web/lib/firebase.ts`.

## Project Structure

### `apps/web/` — Next.js Web Dashboard
- `app/page.tsx` — Main dashboard (courses list, task calendar, reminders)
- `app/course/page.tsx` — Course detail page (attendance calendar, counters, stats)
- `components/CourseCard.tsx` — Course card with attendance bar and quick-mark buttons
- `components/TaskCalendar.tsx` — react-big-calendar wrapper
- `lib/firebase.ts` — Firebase SDK init, Google Auth, OAuth token management
- `lib/AuthContext.tsx` — React Context for auth state

### `apps/mobile/` — Expo React Native App
- `App.tsx` — Root component with auth gating
- `src/screens/` — LoginScreen, CoursesScreen, CourseDetailsScreen, TasksScreen
- `src/navigation/RootNavigator.tsx` — Tab + stack navigator
- `src/context/AuthContext.tsx` — Auth state via React Native Firebase
- `src/utils/notifications.ts` — Local push notification scheduling

### `packages/shared/` — Shared Domain Layer
- `types.ts` — Zod schemas and TypeScript types (Course, Log, Task, CourseWithLogs)
- `attendanceMath.ts` — Attendance percentage calculator with target threshold logic
- `classroomClient.ts` — Google Classroom REST API client (courses, coursework, submissions)
- `dateUtils.ts` — Local date string helper
- `theme.ts` — Shared color palette

## Dev Tooling
- **Turborepo** — Monorepo task orchestration (build, dev, lint)
- **pnpm Workspaces** — Dependency management across packages
- **ESLint 9** — Flat config with Next.js core-web-vitals + TypeScript presets
- **Oxlint** — Fast linter for React hooks and export rules
- **Prettier** — Code formatting
- **Jest + ts-jest** — Unit testing for the shared package

## License

MIT — see the `LICENSE` file for details.
