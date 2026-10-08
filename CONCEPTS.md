# Technologies & Concepts Used

A categorized reference of every framework, library, API, pattern, and tool used in this project.

---

## 1. Monorepo & Build Tooling

| Technology | What it is | How it's used here |
|---|---|---|
| **pnpm** (v9) | Fast, disk-efficient package manager with workspace support | Manages dependencies across the monorepo; `pnpm-workspace.yaml` defines `apps/*` and `packages/*` |
| **pnpm Workspaces** | Built-in monorepo feature of pnpm | Allows `apps/web` and `apps/mobile` to depend on `packages/shared` via `"shared": "workspace:^"` |
| **Turborepo** | Monorepo build orchestrator by Vercel | Runs `build`, `dev`, and `lint` tasks across workspaces with dependency ordering and caching (`turbo.json`) |
| **Turbopack** | Rust-based bundler for Next.js | Used as the production bundler for the web app (Next.js 16 default) |
| **Metro** | JavaScript bundler for React Native | Used by Expo to bundle the mobile app |

## 2. Languages

| Technology | Where used |
|---|---|
| **TypeScript** | Every source file across all three packages (web uses TS 5, shared and mobile use TS 6) |
| **JSX / TSX** | React component files in web and mobile apps |

## 3. Frontend Frameworks

| Technology | What it is | How it's used here |
|---|---|---|
| **React** (v19) | UI component library | Core of both the web and mobile interfaces |
| **Next.js** (v16.3) | React framework with file-based routing | Powers the web dashboard using the App Router with static export (`output: "export"`) |
| **React Native** (v0.86) | Framework for building native mobile apps with React | Core of the mobile app |
| **Expo** (SDK 57) | Platform and toolchain for React Native | Manages the mobile app build, dev server, native modules, and config plugins |

## 4. Routing & Navigation

| Technology | Where used | How it's used here |
|---|---|---|
| **Next.js App Router** | Web | File-based routing (`app/page.tsx`, `app/course/page.tsx`); client-side navigation via `next/link` and `useRouter` |
| **React Navigation v7** | Mobile | `@react-navigation/native-stack` for screen stacks, `@react-navigation/bottom-tabs` for the tab bar |
| **useSearchParams** | Web | Reads the course ID from query string on the static course detail page |

## 5. Styling

| Technology | Where used | How it's used here |
|---|---|---|
| **Tailwind CSS v4** | Web | Utility-first CSS framework via `@tailwindcss/postcss`; dark theme with arbitrary value classes |
| **PostCSS** | Web | CSS processing pipeline for Tailwind |
| **next/font** (Google Fonts) | Web | Loads the Inter typeface with automatic optimization |
| **React Native StyleSheet** | Mobile | Inline styles and StyleSheet objects for native components |

## 6. Firebase (Backend-as-a-Service)

| Technology | What it is | How it's used here |
|---|---|---|
| **Firebase** | Google's app development platform | Provides auth, database, hosting, and emulators for the entire project |
| **Cloud Firestore** | NoSQL document database | Stores all user data: courses, attendance logs (sub-collections), and tasks. Real-time listeners (`onSnapshot`) power live updates |
| **Firestore Security Rules** | Declarative access control | Per-user rules ensure `users/{uid}` subtrees are private (`request.auth.uid == uid`) |
| **Firebase Authentication** | Identity service | Google Sign-In on both web and mobile |
| **Firebase JS SDK** (v12) | JavaScript client library | Used in the web app for Auth and Firestore |
| **React Native Firebase** (v26) | Native Firebase SDK for React Native | Used in the mobile app for Auth and Firestore (native performance, not the JS SDK) |
| **Firebase Hosting** | Static site hosting with CDN | Serves the Next.js static export (`apps/web/out/`) with SPA rewrites |
| **Firebase Emulator Suite** | Local development emulators | Auth (port 9099) and Firestore (port 8080) emulators for offline development |
| **Firebase CLI** | Command-line deployment tool | Deploys hosting, Firestore rules, and runs emulators |

## 7. Authentication

| Technology / Concept | Where used | How it's used here |
|---|---|---|
| **Google OAuth 2.0** | Both | Users sign in with their Google account; OAuth scopes grant Classroom API access |
| **signInWithPopup** | Web | Firebase Auth popup flow for Google Sign-In |
| **GoogleAuthProvider** | Web | Firebase Auth provider configured with Classroom scopes |
| **@react-native-google-signin** | Mobile | Native Google Sign-In; ID token exchanged for a Firebase credential |
| **OAuth Access Tokens** | Both | Short-lived tokens (~1 hour) used to call the Classroom REST API; web app manages token lifecycle in `sessionStorage` with TTL tracking |
| **React Context (Auth)** | Both | `AuthContext` / `useAuth()` pattern to share auth state across components |
| **onAuthStateChanged** | Both | Firebase listener that fires when the user signs in/out; drives the auth context |

## 8. Google Classroom REST API

| Concept | Details |
|---|---|
| **API Endpoint** | `https://classroom.googleapis.com/v1/` |
| **OAuth Scopes** | `classroom.courses.readonly`, `classroom.coursework.me.readonly`, `classroom.student-submissions.me.readonly` |
| **Endpoints Used** | `GET /courses` (active courses), `GET /courses/{id}/courseWork`, `GET /courses/{id}/courseWork/{id}/studentSubmissions` |
| **Auth Mechanism** | `Authorization: Bearer <access_token>` header on every request |
| **Error Handling** | Custom `ClassroomAuthError` class thrown on HTTP 401/403 for token re-auth flow |
| **Data Mapping** | `mapClassroomToTask()` converts Classroom coursework + submissions into the shared `Task` type |

## 9. State Management & Data Patterns

| Concept | Where used | How it's used here |
|---|---|---|
| **React Context** | Both | Auth state shared via context providers |
| **React Hooks (useState, useEffect)** | Both | Local component state and side effects |
| **Firestore Real-Time Listeners (onSnapshot)** | Both | Live-updating course lists, attendance logs, and task lists |
| **Nested Listener Pattern** | Web | Parent `courses` collection listener spawns per-course `logs` sub-collection listeners using a `Map` for lifecycle management |
| **Batched Writes (writeBatch)** | Both | Atomic multi-document writes during Classroom sync and attendance updates |
| **Merge Writes (setDoc with merge)** | Both | Upsert semantics — create or update without overwriting unrelated fields |
| **sessionStorage Token Cache** | Web | OAuth access tokens stored with an expiry timestamp; cleared on sign-out or auth failure |

## 10. Data Validation

| Technology | How it's used here |
|---|---|
| **Zod** (v4) | Runtime schema definitions in `packages/shared/types.ts`; TypeScript types inferred from schemas (`z.infer<typeof Schema>`) for Course, Log, and Task |

## 11. Date & Time

| Technology | Where used | How it's used here |
|---|---|---|
| **date-fns** (v4) | Both | Date arithmetic, formatting, locale support; powers `dateFnsLocalizer` for react-big-calendar on web; used for calendar rendering on both platforms |
| **getLocalDateString()** | Shared | Custom utility returning `yyyy-mm-dd` in local timezone (used as Firestore document keys) |

## 12. Calendar & Scheduling UI

| Technology | Where used | How it's used here |
|---|---|---|
| **react-big-calendar** | Web | Full-featured calendar component (month + agenda views) for displaying tasks and deadlines |
| **dateFnsLocalizer** | Web | Connects date-fns to react-big-calendar for date formatting and week start |
| **react-native-calendars** | Mobile | Calendar component with marked dates/dots for the tasks and course detail screens |
| **Custom Calendar Grid** | Web (course detail) | Hand-built monthly grid using date-fns (`eachDayOfInterval`, `startOfMonth`, `endOfMonth`, `getDay`) with color-coded attendance cells |

## 13. Notifications

| Technology | Where used | How it's used here |
|---|---|---|
| **expo-notifications** | Mobile | Schedules local push notifications 1 hour before each task's due time |
| **expo-device** | Mobile | Checks if running on a physical device (required for push notification permissions) |
| **Notification Channels** | Mobile | Android notification channel ("Task Reminders") for categorized notifications |

## 14. Mobile-Specific Libraries

| Technology | What it does |
|---|---|
| **react-native-safe-area-context** | Handles safe area insets (notches, status bars) |
| **react-native-screens** | Native screen containers for performant navigation |
| **expo-status-bar** | Controls the device status bar appearance |
| **expo-dev-client** | Custom development client for testing native modules outside Expo Go |

## 15. Build & Deployment

| Technology | What it does | How it's used here |
|---|---|---|
| **Next.js Static Export** | Generates a fully static HTML/CSS/JS site | `output: "export"` in `next.config.ts` produces `out/` directory deployed to Firebase Hosting |
| **Firebase Hosting (SPA Rewrite)** | Serves static files with URL rewriting | Catch-all rewrite (`** → /index.html`) enables client-side routing |
| **EAS Build** | Expo Application Services cloud build | Builds Android APK via the `preview` profile (`eas.json`); no local Android Studio needed |
| **EAS Submit** | Cloud app store submission | Configured (empty profiles) for future Play Store / App Store deployment |
| **Continuous Native Generation** | Expo pattern — no checked-in `android/`/`ios/` dirs | Native projects generated at build time from `app.json` and config plugins |

## 16. Code Quality & Dev Tooling

| Technology | What it does | How it's used here |
|---|---|---|
| **ESLint 9** | JavaScript/TypeScript linter | Flat config extending `eslint-config-next` (core-web-vitals + TypeScript presets) |
| **Oxlint** | Fast Rust-based linter | Enforces `react/rules-of-hooks` and `react/only-export-components` via `.oxlintrc.json` |
| **Prettier** (v3) | Code formatter | Formats `.ts`, `.tsx`, and `.md` files across the monorepo |
| **Jest** (v30) + **ts-jest** | Testing framework | Configured for the shared package with TypeScript support |

## 17. Architecture & Design Patterns

| Pattern | Where applied |
|---|---|
| **Monorepo** | Single repository containing web app, mobile app, and shared package |
| **Shared Domain Package** | `packages/shared` contains types, business logic, and API client consumed by both apps |
| **Static Site Generation / SPA** | Web app pre-rendered at build time, hydrated on the client |
| **Client Components (`'use client'`)** | All Next.js pages are client-rendered (Firebase SDK requires browser APIs) |
| **Provider Pattern (React Context)** | Auth state wrapped in a context provider at the app root |
| **Listener Lifecycle Management** | Firestore `onSnapshot` subscriptions cleaned up in `useEffect` return functions; nested listeners tracked in a `Map` |
| **Optimistic Local State** | Attendance marks read current state from local React state to compute the next value before writing to Firestore |
| **Legacy Format Compatibility** | Attendance math handles both old `{status: 'present'}` and new `{present: N, absent: N}` log formats |
| **Token Lifecycle Management** | OAuth access tokens stored with TTL; expired tokens trigger transparent re-authentication via popup |
| **Custom Error Classes** | `ClassroomAuthError` enables typed catch blocks for auth-specific error handling |
| **Per-User Data Isolation** | Firestore rules + data model scope all data under `users/{uid}` |
| **Workspace Package Resolution** | `"shared": "workspace:^"` with `main: "src/index.ts"` lets bundlers consume raw TypeScript sources without a build step |

## 18. APIs & Protocols

| API / Protocol | How it's used here |
|---|---|
| **Google Classroom REST API v1** | Fetches active courses, coursework, and student submissions |
| **Google OAuth 2.0 (implicit grant via Firebase)** | Obtains access tokens for Classroom API via `signInWithPopup` |
| **Firestore REST Protocol** (via SDKs) | Real-time document streaming, batched writes, merge semantics |
| **Web Fetch API** | Used in the shared Classroom client for HTTP requests to Google APIs |
| **sessionStorage Web API** | Stores OAuth access tokens with expiry on the web client |

---

**Total: 60+ distinct technologies, libraries, APIs, and architectural concepts.**
