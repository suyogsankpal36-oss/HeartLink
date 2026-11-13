# HeartLink

HeartLink is a MERN dating platform with a React/Vite frontend and a versioned Express/MongoDB API. The app is organized by feature and implements the 16 supplied desktop page references as routes, with responsive layouts, account authentication, profile editing, discovery, likes, matches, messaging, settings, and safety workflows.

## Current integration status

- Registration, login, refresh-token rotation, logout, email verification, and password recovery use the backend API. Access tokens stay in memory; refresh tokens use an HTTP-only cookie.
- Profiles, discovery filters, likes, mutual matches, messages, notifications, blocks, reports, support requests, and account settings are backed by MongoDB APIs.
- Real Data Only: All demo modes, sample mock profiles, synthetic database seeds, and demo preview buttons have been completely removed from production code paths and builds. Real member photo uploads with neutral initials fallbacks and truthful empty states are strictly enforced.
- Premium plans and subscription status are server-configured, but checkout is disabled until a provider checkout endpoint and verified webhook are configured.
- Profile-photo files and structured app records are stored in the `heartlink` MongoDB Atlas database; photos use the `profilePhotos` GridFS bucket.
- Social login is not shown as an available sign-in option unless a provider is configured. Production email verification and recovery delivery require SMTP settings.
- Screen modules load on demand by route, with a loading state and page-level recovery if a route fails to render.
- Discovery search waits for a 250 ms pause before requesting profiles; changing search or filters no longer reloads matches, likes, notifications, or settings.

## Screens and routes

| Screen | Route |
| --- | --- |
| Landing / Home | `/` |
| Sign Up | `/signup` |
| Login | `/login` |
| Discover Profiles | `/discover` |
| Profile Details | `/profile/:profileId` |
| Matches | `/matches` |
| Messages | `/messages` or `/messages/:conversationId` |
| Edit Profile | `/profile/edit` |
| Likes | `/likes` |
| Settings | `/settings` |
| Premium Membership | `/premium` |
| Search and Filters | `/search` |
| Notifications | `/notifications` |
| Help and Support | `/help` |
| About Us | `/about` |
| FAQ | `/faq` |
| Super Admin Login | `/admin/login` |
| Super Admin Dashboard | `/admin/dashboard` |
| Admin User Management | `/admin/users` |
| Admin Activity Monitoring | `/admin/activity` |
| Admin Analytics | `/admin/analytics` |
| Admin Security Center | `/admin/security` |
| Admin Audit Logs | `/admin/audit-logs` |
| Admin Database Monitor | `/admin/database` |
| Admin System Health | `/admin/system` |
| Admin Notifications | `/admin/notifications` |
| Super Admin Roles | `/admin/roles` |
| Super Admin Settings | `/admin/settings` |

Additional public routes include `/forgot-password`, `/reset-password/:token`, `/verify-email/:token`, `/privacy`, and `/terms`. `/filters`, `/edit-profile`, and `/chat/:matchId` remain compatibility aliases for older links.

## Project structure

```text
HeartLink/
├── backend/
│   ├── src/
│   │   ├── config/       # Environment validation and MongoDB connection
│   │   ├── controllers/  # API handlers and domain flows
│   │   ├── middleware/   # Auth, origin checks, upload and errors
│   │   ├── models/       # Mongoose schemas and indexes
│   │   ├── routes/       # REST routes, including /api/v1
│   │   ├── services/     # Tokens, email, Google verification and storage
│   │   ├── sockets/      # Authenticated Socket.IO messaging
│   │   ├── app.js
│   │   └── server.js
│   └── tests/            # Node test runner and Supertest API checks
├── frontend/
│   ├── src/
│   │   ├── app/          # Router and application shell
│   │   ├── components/   # Shared UI and layouts
│   │   ├── features/     # Public, account, discover and message screens
│   │   ├── hooks/        # Shared session and product state
│   │   ├── services/     # Axios API and Socket.IO clients
│   │   └── styles.css    # Design tokens and responsive component styles
│   ├── eslint.config.js
│   └── vite.config.js
├── docs/design-reference/ # The 16 inspected reference PNGs
├── DESIGN_SPEC.md
└── package.json
```

## Requirements

- Node.js 20 or newer and npm
- A MongoDB Atlas URI and an IP access-list entry for the network running the API
- PowerShell on Windows, or an equivalent shell on other platforms

## Local setup

From the project root, install each app's dependencies and create local environment files:

```powershell
npm.cmd install --prefix backend
npm.cmd install --prefix frontend
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
if (!(Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
```

Set `MONGODB_URI` to the MongoDB Atlas URI from Atlas > Connect > Drivers. The app no longer falls back to a local MongoDB server; it will stop at startup until the Atlas URI is configured. Set `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` to different strong values. Generate a value with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The backend connects to the `heartlink` database through Mongoose and MongoDB Atlas. Add the API machine's public IP to the Atlas project's IP access list; Atlas rejects connections from unlisted addresses. MongoDB creates the database and its collections when the first account or other record is saved; a successful connection by itself does not insert sample data. Keep `backend/.env` private.

Firebase is used for Google Authentication only; profiles, likes, matches, messages, and other application data remain in MongoDB Atlas. Set `FIREBASE_PROJECT_ID` in `backend/.env`, and set `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID` in `frontend/.env`. The two project ID values must match. The Google buttons appear only after all frontend Firebase values are set and Google is enabled as a Firebase Authentication provider. Add localhost and the deployed frontend domain to Firebase Authentication’s authorized domains. `/api/v1/auth/google` accepts a verified Firebase ID token; new accounts also require a valid adult birth date, gender selection, and explicit Terms/Privacy consent.

Mongoose schemas in `backend/src/models/` cover users, refresh sessions, likes, matches, messages, notifications, blocks, reports, subscriptions, and support tickets. Profile-photo binaries are saved in the Atlas `profilePhotos` GridFS bucket.

Start the API and frontend in separate terminals:

```powershell
npm.cmd run dev:backend
```

```powershell
npm.cmd run dev:frontend
```

The frontend runs at `http://localhost:5173`, and the API runs at `http://localhost:5000`. The API health endpoints are `/health` and `/api/live`.

Moderator/admin support queue endpoints are available at `/api/v1/admin/support`: `GET /` returns a paginated ticket queue with optional `status` and `category` filters, and `PATCH /:id` updates a ticket status (`open`, `in_progress`, or `resolved`). The same handlers are mounted under `/api/admin/support`. Both routes require an authenticated moderator or admin account.

Safety moderation is available at `/api/v1/admin/reports`: `GET /` returns a paginated report queue with optional `status` and `reason` filters, and `PATCH /:id` updates a report status or applies `actionOnUser: "suspend"` / `"reactivate"`. Both operations require an authenticated moderator or admin account. Moderators may change member account status; only admins may act on privileged staff accounts. Suspending an account revokes its refresh sessions and disconnects its active Socket.IO connections; reactivated members must sign in again. The React staff route is `/admin/reports`.

## Environment configuration

The frontend reads `VITE_API_URL` from `frontend/.env`; its local value should be `http://localhost:5000/api/v1`. Set `VITE_SOCKET_URL` only when Socket.IO is served from a different origin.

Backend settings are documented in `backend/.env.example`:

- `MONGODB_URI` for MongoDB Atlas; the app requires it in development and production and does not fall back to local MongoDB.
- `FIREBASE_PROJECT_ID` for server-side Firebase ID-token issuer/audience verification. `GOOGLE_OAUTH_CLIENT_ID` is only needed if an integration sends direct Google OAuth ID tokens instead of Firebase ID tokens.
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID` for the Firebase web app; keep these in `frontend/.env` and make the project ID match the backend value.
- Separate `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` values. Never use the example placeholders in production.
- `CLIENT_URL` and `CORS_ORIGINS` for allowed frontend origins.
- `COOKIE_SAME_SITE=none` with HTTPS when the deployed frontend and API are cross-site. Refresh cookies are `Secure`, `httpOnly`, path-scoped to `/`, and rotated server-side in production; they are not returned to page JavaScript. Leave `COOKIE_DOMAIN` unset for a Render hostname, or set it only for an owned custom API domain. Write requests also check the request origin. For browsers that block third-party cookies, deploy same-site custom domains for the app and API.
- Optional `CLOUDINARY_*` values only if older profiles still contain Cloudinary-hosted photos that need deletion.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` together when email delivery is enabled.
- `SUBSCRIPTION_CURRENCY` and the three `PLAN_*_AMOUNT_MINOR` values for display prices. These values do not activate payment processing.

Do not commit `.env` files or provider credentials.

Run `npm.cmd run check:env` to check the required MongoDB Atlas URI and Firebase project ID alignment without printing their values. This checks configuration presence only; starting the API is what verifies a live Atlas connection.

## API overview

The frontend uses `/api/v1`. Key route groups are:

- `/auth`: registration, login, refresh, logout, email verification, password recovery, and account actions.
- `/profiles`: current and public profiles, profile edits, and photo upload/removal.
- `/likes` and `/matches`: normal likes, super-likes, passes, mutual matching, and unmatching.
- `/conversations`: authorized message history, message creation, unread state, and read receipts.
- `/notifications`, `/settings`, `/blocks`, `/reports`, `/subscriptions`, and `/support`.

REST messaging remains available when a Socket.IO connection drops. Production seed routes are disabled.

## Checks

Run frontend and backend tests, the frontend lint rules, and the Vite production build from the root:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Frontend static checks use Oxlint. Backend tests use Node's built-in test runner and Supertest. The current tests cover login form submission, the adult-only signup gate, the separate super-like action, API authentication guards, route parity between /api and /api/v1 endpoints, validation, server-configured subscription catalog, mobile navigation, help topic filtering, incoming likes display and accept flows, socket reactions, live-state event dispatch, and origin security guards.

## Deployment guide

The project includes production deployment specifications for the recommended architecture:

### 1. Frontend: Netlify (or Vercel)
- Configuration is provided in `netlify.toml` and `frontend/public/_redirects`.
- In Netlify Dashboard > Add New Site > Import from Git:
  - **Base Directory**: `frontend`
  - **Build Command**: `npm run build`
  - **Publish Directory**: `frontend/dist` (or `dist` if base directory is set to `frontend`)
- **Environment Variables**:
  - `VITE_API_URL`: Your deployed Render API URL ending in `/api/v1` (e.g., `https://heartlink-api.onrender.com/api/v1`)
  - `VITE_FIREBASE_API_KEY`: Firebase web API key (optional)
  - `VITE_FIREBASE_AUTH_DOMAIN`: Firebase auth domain (optional)
  - `VITE_FIREBASE_PROJECT_ID`: Firebase project ID (optional)
  - `VITE_FIREBASE_APP_ID`: Firebase web app ID (optional)
- The `netlify.toml` file includes standard SPA redirects (`/*` to `/index.html` with status 200) and 1-year immutable caching for assets.

### 2. Frontend Alternative: Vercel
- Configuration is provided in `vercel.json` (monorepo root) and `frontend/vercel.json` (frontend directory).
- In Vercel Project Settings:
  - **Framework Preset**: Vite
  - **Root Directory**: `frontend` (or repository root using the root `vercel.json`)
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: Your deployed Render API URL ending in `/api/v1` (e.g., `https://heartlink-api.onrender.com/api/v1`)
  - `VITE_FIREBASE_API_KEY`: Firebase web API key
  - `VITE_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
  - `VITE_FIREBASE_PROJECT_ID`: Firebase project ID
  - `VITE_FIREBASE_APP_ID`: Firebase web app ID
- The Vercel configuration includes clean URL rewrites to `/index.html` for client-side routing and 1-year immutable cache headers for hashed assets.

### 3. Backend & Realtime Engine: Render
- A production Blueprint is provided in `render.yaml`.
- In Render Dashboard > Blueprints > New Blueprint Instance, connect the repository or create a Web Service:
  - **Environment**: Node
  - **Root Directory**: `backend`
  - **Build Command**: `npm ci --omit=dev`
  - **Start Command**: `npm start`
  - **Health Check Path**: `/health`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `PORT`: `5000` (or dynamically set by Render)
  - `MONGODB_URI`: MongoDB Atlas connection URI (`mongodb+srv://...`)
  - `ACCESS_TOKEN_SECRET` & `REFRESH_TOKEN_SECRET`: Random 32+ character secrets (automatically generated by `render.yaml`)
  - `COOKIE_SAME_SITE`: `none` (required for cross-site cookie exchange between Netlify/Vercel and Render)
  - `COOKIE_DOMAIN`: leave unset for `*.onrender.com`; use only an owned API-domain value when a custom domain is configured
  - `CLIENT_URL`: HTTPS URL of your Netlify deployment (e.g., `https://heartlink.netlify.app`)
  - `CORS_ORIGINS`: Comma-separated HTTPS URLs of authorized frontend domains
  - `FIREBASE_PROJECT_ID`: Matches `VITE_FIREBASE_PROJECT_ID` (optional)
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Optional legacy photo deletion support; new uploads use MongoDB Atlas GridFS
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`: Required for password reset and email verification delivery

### 4. Database: MongoDB Atlas
- Obtain your connection URI from MongoDB Atlas: *Database > Connect > Drivers > Node.js*.
- Set `MONGODB_URI` in Render's environment settings. The app requires Atlas and prevents local fallback.
- In Atlas > Security > Network Access, add the outbound IP addresses of your Render backend or allow access from Render.

### 5. Initial Super Admin Provisioning
To create the initial Super Administrator safely:
1. In `backend/.env` or Render environment settings, define:
   ```env
   SUPERADMIN_EMAIL=admin@heartlink.app
   SUPERADMIN_PASSWORD=YourSecurePassword123!
   ```
2. Execute the bootstrap script:
   ```bash
   npm run bootstrap:admin
   ```
3. Remove `SUPERADMIN_PASSWORD` from `.env` once setup is complete.
4. Access `/admin/login` on your deployed frontend.

The source repository does not contain live provider credentials. Before public release, replace external Unsplash development photography with licensed production imagery, review legal draft documents, and verify that payment checkout remains informational until a payment processor webhook is implemented.
