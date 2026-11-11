# HeartLink Desktop Design Specification

## Purpose and reference set

This document records the intended desktop design for all 16 HeartLink screens, maps them to React routes, and tracks implementation status. The reference descriptions are visual targets; the code audit and progress notes below describe what is currently implemented.

The inspected reference set is in `docs/design-reference/HeartLink_Desktop_Pages_Frame_by_Frame/`. It contains all 16 numbered PNGs. Every PNG is **384 × 256 px**. These are small, annotated frame exports rather than full-resolution browser captures: black page-name labels are part of the reference image, and some exports show a thin portion of a neighboring frame at an edge. Treat those labels and neighboring fragments as annotations/cropping, not as product UI. Use the full-size dimensions below as implementation targets rather than copying the 384 × 256 export size.

## Design system

### Desktop canvas and shared geometry

Use **1440 × 900 px** as the primary review viewport, with the page itself fluid at larger and smaller widths.

| Element | Desktop target | Notes |
| --- | ---: | --- |
| Public content rail | 1180 px max | Centered with 32 px minimum side gutters |
| Public navigation | 68 px high | Rounded white bar, 22 px top margin on wide desktop |
| Landing hero | 1180 × ~448 px minimum | Two columns, close to a 1:1 split |
| Authentication card | 1000 px max; ~610 px minimum height | Two equal panels, form and photo collage |
| Member sidebar | 222 px wide; full viewport height | Sticky left rail, 14–24 px inner padding |
| Member top bar | 70 px high | Sticky; global search left, actions right |
| Member content | 1320 px max | Centered inside workspace; 33 px top and 55 px bottom padding |
| Discovery / likes / match grid | 4 columns on wide desktop | 15 px typical gaps; card image height 175–245 px |
| Messenger | ~680 px high, two columns | 300 px conversation list and flexible chat panel |
| Settings | 190 px section index + flexible panel | Sticky section index on desktop |

The existing stylesheet already uses these principal values. If a PNG's crop makes a dimension ambiguous, preserve its proportion and visual hierarchy instead of treating a thumbnail pixel as a CSS pixel.

### Color, type, and surfaces

The references and current CSS use a soft pink-and-white interface with dark plum text. Use the existing CSS tokens as the working palette and tune by visual comparison to the PNGs:

| Token | Value | Use |
| --- | --- | --- |
| Primary rose | `#F52E72` | Primary actions, active links, highlights |
| Dark rose | `#D91E5D` | Hover/pressed actions, emphasis |
| Soft rose | `#FFF0F4` | Active navigation, selected states, chips |
| Pale rose | `#FFF7F9` | Page and card washes |
| Canvas | `#FFF6F8` / `#FFF8FA` | Public and member backgrounds |
| Surface | `#FFFFFF` | Cards, forms, navigation |
| Plum | `#351426` | Strong headings and premium surfaces |
| Body text | `#2D1924` | Main copy |
| Muted text | `#857781` | Secondary labels, timestamps |
| Border | `#F1E7EB` | Dividers and card outlines |
| Success green | Approx. `#52CF89` | Online/available indicator only when real status is available |

- **UI font:** DM Sans, with a system sans-serif fallback. Use 9–13 px for dense desktop UI labels/body copy, 28–32 px for member page headings, and 10–12 px for public body copy as in the compact reference composition.
- **Editorial font:** Playfair Display for selected romantic/mission headings and premium headline emphasis; use sparingly.
- **Buttons:** 42 px default height, 12 px radius; small controls 31–36 px. Primary buttons use a rose gradient, white text, and a soft rose shadow.
- **Cards:** white surface, 1 px pink-gray border, 14–18 px radius, subtle shadow. Public hero uses a larger 26 px radius. Chips and status badges are pill-shaped.
- **Motion:** small hover lift/scale and short color transitions only; respect reduced-motion preferences.
- **Icons:** consistent 16–20 px line icons. The project currently draws a small custom SVG icon set; the PNGs do not define an external icon pack.

### Shared navigation and reusable components

**Public shell:** HeartLink mark and wordmark at the left; links for Home, About, Features, Success Stories, and FAQ in the center/right; Login and Sign Up actions at the right. Footer repeats About, FAQ, Help/Contact, Privacy, and Terms.

**Member shell:** persistent left rail with Discover, Likes, Matches, Messages, Profile, and Premium; a second section for Settings, Help & Support, and Log out; a premium callout and signed-in account summary at the bottom. The sticky top bar contains global people/location search, membership action, notifications, and account avatar. Active navigation is rose on a pale-pink rounded background.

Build shared React pieces for: public/member layouts, navigation items, page title/eyebrow, buttons, icon button, form field, segmented tabs, avatar, verified badge, interest chip, profile card, profile image gallery, match card/list row, notification row, message bubble/composer, settings row/toggle, plan card, accordion, toast/alert, loading skeleton, and empty state. Controls need visible focus, keyboard operation, accessible names, and disabled/loading states.

### Responsive behavior

The reference set is desktop-first, while the current app stylesheet has breakpoints at 1100, 820, and 600 px. Preserve the page hierarchy at every size:

- **Above 1100 px:** full 222 px member sidebar; 4-column profile grids; full search and top-bar actions.
- **821–1100 px:** reduce sidebar to about 198 px and page gutters; use 3-column grids.
- **601–820 px:** collapse member navigation to a 68 px icon rail; use 2-column profile grids; settings index becomes an inline grid; retain a compact top search.
- **600 px and below:** use a fixed bottom member navigation bar with a reachable More/profile menu for destinations removed from the bar; public nav links collapse behind a compact header; authentication becomes one column and hides the photo collage; member grids remain 2 columns where readable; messenger reduces its conversation list to an avatar rail; profile gallery and forms stack; filter and plan cards become single-column or horizontally scrollable without clipping.
- At all widths, avoid horizontal page scrolling, keep touch targets at least 40–44 px, let content grow vertically, and preserve labels for icon-only controls.

## Page-by-page specification

### 01. Landing / Home

- **Reference:** `01_Landing_Home.png` · **Route:** `/`
- **Layout/dimensions:** public shell. Center a 1180 px max-width hero beneath the header; 1:1 copy/photo columns; hero min-height ~448 px. Follow with a three-part statistic strip, a three-card feature section, a testimonial/story strip, and footer.
- **Visuals/type:** pale pink radial wash, white rounded hero card, plum headline with rose emphasis, large DM Sans headline (about 52–61 px on wide desktop), romantic couple image on the right with floating match/heart callouts.
- **Reusable UI:** public header/footer, button, feature card, avatar cluster, callout badge, statistic item, story quote.
- **Navigation/actions:** Get Started → `/signup`; Login → `/login`; About/FAQ/footer links; Learn More scrolls to features; demo entry must be clearly labelled demo content. Any numbers or testimonials must be real or explicitly marked illustrative.
- **Responsive:** stack copy above image at 600 px; reduce nav links at tablet; stack feature cards; keep CTA visible without overlap.

### 02. Sign Up

- **Reference:** `02_Sign_Up.png` · **Route:** `/signup`
- **Layout/dimensions:** centered 1000 px max-width, ~610 px tall split card. Form panel ~52%; image/benefit panel ~48%. The reference shows four account fields and social sign-in buttons on the left, layered portraits and benefit callouts on the right.
- **Visuals/type:** white card over a pale pink gradient; centered logo/title; compact form fields with leading line icons; full-width rose submit button. Use DM Sans for fields and a short supporting headline in the display face.
- **Reusable UI:** auth shell, logo, labeled input/password field, visibility control, checkbox, primary/secondary provider button, inline validation message, photo collage.
- **Navigation/actions:** name, email, password, confirm password, date of birth/adult eligibility, terms/privacy consent; submit; Login link. Google/Facebook controls shown in the reference require configured providers and must not imply an unconfigured provider is live.
- **Responsive:** hide/collapse the right collage at 600 px; keep the full form in one column; inputs and submit become full width; allow vertical scrolling.

### 03. Login

- **Reference:** `03_Login.png` · **Route:** `/login`
- **Layout/dimensions:** same 1000 px split auth card as signup. Left panel has logo, welcome heading, email/password fields, Forgot Password, Login, divider and provider buttons; right panel uses three offset portraits plus a short connection headline.
- **Visuals/type:** same public/auth background and form system as signup, with plum title and rose emphasis in the right-side headline.
- **Reusable UI:** auth shell and fields from Sign Up; error/notice banner; social-provider buttons.
- **Navigation/actions:** submit login; password visibility; Forgot Password → `/forgot-password`; Signup link. Preserve a safe intended destination after sign-in.
- **Responsive:** same as signup; on phone remove the image panel and place recovery/sign-up links directly under the form.

### 04. Discover Profiles

- **Reference:** `04_Discover.png` · **Route:** `/discover`
- **Layout/dimensions:** member shell. Workspace header is 70 px; page content max 1320 px. Title and filter action above a small tab row/search result count. Wide desktop shows four profile cards; card image is 175–245 px tall, with name/details/actions below.
- **Visuals/type:** white cards on a near-white pink canvas; large cropped profile photography; subtle image pagination markers; small distance/status pill; 14–15 px card radius. Names are bold DM Sans; locations and interests use muted text and pale chips.
- **Reusable UI:** member shell, search input, filter link, profile card, avatar, verified/status badge, interest chips, pass/like/spark actions, skeleton and empty/error states.
- **Navigation/actions:** global search by name, interest, or location; filters → `/search`; open profile → `/profile/:profileId`; like/pass; pagination or Load More. The star action is a super-like in the reference and is now sent to the API as a distinct action type. A daily quota/entitlement is not yet configured, so do not imply one in the UI.
- **Responsive:** 4 columns desktop, 3 at <=1100 px, 2 at <=820 px, 2 compact at <=600 px; adjust photo height and retain readable card actions.

### 05. Profile View

- **Reference:** `05_Profile_View.png` · **Route:** `/profile/:profileId`
- **Layout/dimensions:** member shell and a centered white profile detail card. Main gallery spans the card width; use one large photo plus two smaller stacked images (roughly 68/32 split), ~315 px gallery height on desktop. Details below use a max-width ~900 px content column.
- **Visuals/type:** generous photo area, plum serif name/age heading, small verification check, city and live status line, rose action controls, pale-pink interest pills, clear section spacing.
- **Reusable UI:** gallery/photo dots, avatar fallback, verified badge, location/status, interest chips, biography, lifestyle/prompt panels, round action buttons, report/block menu.
- **Navigation/actions:** back to Discover; like, pass, spark, message where an active match permits it; report and block. Handle unavailable or blocked profiles with a neutral empty state.
- **Responsive:** gallery height ~230 px on phone; preserve a 1.55:0.75 large/small split where width allows; otherwise use swipeable gallery; stack actions and details.

### 06. Matches

- **Reference:** `06_Matches.png` · **Route:** `/matches`
- **Layout/dimensions:** member shell. The reference presents a Matches heading, search field, a horizontal row of circular match portraits, then a vertical conversation/match list with preview, timestamp, and unread badge. Keep the content within the member workspace rather than stretching under the sidebar.
- **Visuals/type:** clean white list rows, small circular portraits, thin dividers, active row in pale pink, rose unread counter, muted preview text.
- **Reusable UI:** match avatar strip, search, conversation row, unread badge, empty state, unmatch confirmation.
- **Navigation/actions:** search matches; select a match or row to open `/messages/:conversationId`; open full profile; unmatch only after confirmation. Show only mutual active matches.
- **Responsive:** portrait strip scrolls horizontally; list rows remain full-width; hide nonessential preview metadata on narrow screens.

### 07. Messages / Chat

- **Reference:** `07_Messages_Chat.png` · **Routes:** `/messages` and `/messages/:conversationId` (legacy alias `/chat/:matchId`)
- **Layout/dimensions:** member shell with a two-column messenger card, target ~680 px high with 300 px conversation rail and flexible chat pane. Conversation rail includes heading, search and rows; chat pane includes match header, message area and composer.
- **Visuals/type:** white panels with a thin pale border; selected conversation gets a pale-rose wash; incoming bubbles are light rose, outgoing bubbles are saturated pink with white text; small timestamps; unobtrusive header controls.
- **Reusable UI:** conversation list item, avatar/status, message bubble, date divider, typing/read state, composer, send/attachment/emoji controls, safety menu.
- **Navigation/actions:** search conversations; select a row; send persisted messages; show online/last-seen only if backed by privacy-aware presence; read receipts follow the user setting; report/block and unmatch available in conversation options.
- **Responsive:** at <=600 px reduce the conversation list to an avatar rail; allow a conversation-only view and back control; composer remains pinned above the mobile navigation; messages scroll independently.

### 08. Edit Profile

- **Reference:** `08_Edit_Profile.png` · **Routes:** `/profile/edit` (preferred) and `/edit-profile` (compatibility alias)
- **Layout/dimensions:** member shell; two-column form area. Photo management panel is about 30–35% width; form panel fills the rest. Save Changes sits in the title/action row. The reference shows a lead photo, add-photo tile and thumbnail strip, then name, age, location and bio fields.
- **Visuals/type:** white outlined panels; compact fields and labels; photo tiles with camera/add affordances; rose Save Changes button.
- **Reusable UI:** gallery manager, file picker/validation hint, text input, textarea/count, interest-chip picker, save/cancel state, preview panel.
- **Navigation/actions:** upload, remove, and reorder photos; update display name, bio, city, interests, prompts/lifestyle where included; age is derived from date of birth and should not be editable as a free number. Show errors and success only after a persisted response.
- **Responsive:** photo gallery becomes a compact horizontal strip above fields; stack form controls; keep save action reachable at page top/bottom.

### 09. Likes

- **Reference:** `09_Likes.png` · **Route:** `/likes`
- **Layout/dimensions:** member shell; page heading; two equal-width tabs (“People Who Liked You” and “People You Liked”); 3-column photo-card grid at desktop, flowing to 2 columns at tablet/mobile.
- **Visuals/type:** large portrait image, compact name/age and city line, heart badge; active tab solid rose, inactive white with thin border; white card with 14–15 px radius.
- **Reusable UI:** tabs, like/profile card, view action, like-back action, empty/privacy state, membership teaser only when membership rules are real.
- **Navigation/actions:** switch received/sent likes; view profile; like back to create a mutual match; remove a sent like where allowed. Avoid fabricated timestamps or hiding identities without an implemented membership entitlement.
- **Responsive:** tabs wrap or become scrollable; cards shrink to 2 columns; preserve photo focus and action sizes.

### 10. Settings

- **Reference:** `10_Settings.png` · **Route:** `/settings`
- **Layout/dimensions:** member shell; title and a centered white settings panel. Reference uses a vertical menu of rows for Edit Profile, Account Settings, Notifications, Privacy & Safety, Blocked Users, Subscription, Help & Support, and Logout; each row has a simple icon and right chevron. Detailed controls open within the selected section.
- **Visuals/type:** 14 px radius surface, subtle separators, dark plum row label, muted icons, destructive Logout in red.
- **Reusable UI:** settings section navigation, icon row, toggle, select/range, password form, blocked-user list, destructive confirmation modal.
- **Navigation/actions:** Edit Profile → `/profile/edit`; change password, notification/privacy controls, manage blocked accounts, membership → `/premium`, help → `/help`, logout, delete account with explicit confirmation. Persist settings to the server.
- **Responsive:** desktop menu can become sticky side index; at tablet/mobile convert to wrapped tabs or accordions, then show one section at a time; destructive actions separated from ordinary settings.

### 11. Premium Membership

- **Reference:** `11_Premium.png` · **Route:** `/premium`
- **Layout/dimensions:** use a focused, full-width membership surface with HeartLink branding at the upper left; the reference does not show the standard member sidebar. The dark premium hero introduces benefits; three plan cards (1, 3, 12 months) align in a row beneath it. Feature list sits left of plans where width allows; a centered CTA and renewal note finish the section. Provide a clear back-to-app path for signed-in members.
- **Visuals/type:** dark plum gradient hero/surface, rose and gold crown/heart accents, white plan borders, selected plan with rose outline, serif price emphasis.
- **Reusable UI:** benefit checklist, plan card, selected radio, current-subscription status, payment button, security/renewal note.
- **Navigation/actions:** load prices and subscription status from the server; select a plan; submit only when provider checkout is configured; confirm status only after a verified provider webhook. Never show a success state from a client-only click.
- **Responsive:** stack hero text and benefits, then plan cards; allow selected plan and price text to remain visible; CTA full width on phone.

### 12. Search & Filters

- **Reference:** `12_Search_Filters.png` · **Routes:** `/search` (preferred) and `/filters` (compatibility alias)
- **Layout/dimensions:** member shell; one large filter card. Each row uses a ~220 px label column and flexible controls column, with a 98 px minimum row height. Reference groups interest chips first, then gender selection, dual age range, location and distance; Reset at upper-right and Search/Apply at the footer.
- **Visuals/type:** white surface, horizontal separators, segmented selector, rose active state, thin range track, removable pale-rose chips.
- **Reusable UI:** text search, location input, segmented control, dual slider, distance slider, interest-chip multiselect, verified toggle, reset/apply bar.
- **Navigation/actions:** apply server-validated age, gender, city, distance, interests, online/verified options; Reset restores default values; Search returns to `/discover` with filters retained.
- **Responsive:** label above control rather than in a fixed left column; dual range remains keyboard accessible; chips wrap; footer actions become stacked/full-width.

### 13. Notifications

- **Reference:** `13_Notifications.png` · **Route:** `/notifications`
- **Layout/dimensions:** member shell; heading/action followed by filter tabs (All, Likes, Matches, Messages, System) and a vertical list of ~60–82 px rows. The list width is about 850 px max, left aligned in the workspace.
- **Visuals/type:** white list card; avatar or type icon; title in bold, event detail and relative time below; unread item gets a pale background and rose dot; category icon color can vary.
- **Reusable UI:** filter tabs, notification row, icon/avatar, unread dot, mark-all/read action, empty state.
- **Navigation/actions:** filter by event type; mark one/all read; open linked profile, match, or conversation where an entity exists. Use backend-generated events only.
- **Responsive:** full-width card; reduce metadata before removing titles; tabs can become horizontally scrollable.

### 14. Help & Support

- **Reference:** `14_Help_Support.png` · **Route:** `/help`
- **Layout/dimensions:** member shell; page title and help-article search; one broad white accordion card with categories: Getting Started, Account & Profile, Matches & Messaging, Premium Features, Privacy & Safety, Technical Issues. A prominent Contact Support button sits at the bottom.
- **Visuals/type:** compact rows, leading circular icons, right chevron, 12–15 px panel radius, rose contact button.
- **Reusable UI:** searchable FAQ/knowledge row, accordion, search field, contact form, submitted/error notice.
- **Navigation/actions:** search/filter articles; expand a category; contact support opens the support form or an inline form; confirmation follows successful ticket persistence.
- **Responsive:** accordion rows remain full-width; search and contact action expand to width; use a dialog or separate route for the form on narrow screens.

### 15. About Us

- **Reference:** `15_About_Us.png` · **Route:** `/about`
- **Layout/dimensions:** public shell with normal public header. Center a wide two-column intro: large couple image on the left (~50%), mission heading/copy and three illustrative statistic blocks on the right. Below, show three value cards for Mission, Vision and Values.
- **Visuals/type:** white and pale-rose panels; large crop with rounded corners; serif/rose-accented headline; three balanced icon cards with light borders.
- **Reusable UI:** public header/footer, image card, mission copy, statistic item, value/feature card.
- **Navigation/actions:** About active in header; footer and CTA lead to FAQ/help/signup. Statistics/testimonials must be labeled sample data or replaced with measured values.
- **Responsive:** image and copy stack; statistic blocks become a three-column compact strip or wrap; value cards stack at phone width.

### 16. FAQ

- **Reference:** `16_FAQ.png` · **Route:** `/faq`
- **Layout/dimensions:** public shell; centered narrow content column (~760 px max), title and short introduction, followed by six full-width accordion rows. The reference shows a single expanded-width list rather than a multi-column FAQ.
- **Visuals/type:** white rows on pale pink canvas, fine dividers and small chevrons; section heading in plum with rose highlight.
- **Reusable UI:** public header/footer, accessible accordion, FAQ search, contact link.
- **Navigation/actions:** expand one or multiple answers; search questions; contact/help link → `/help`. Content covers account/profile, matching, privacy/safety and membership. Membership copy must reflect the actual payment state.
- **Responsive:** maintain the single column; enlarge touch target and allow answers to wrap naturally.

## Project audit and implementation gaps

### Current code organization and route coverage

- React/Vite entry is `frontend/src/main.jsx`; route definitions are in `frontend/src/app/router.jsx`; shared shell/components are in `frontend/src/components/`; screen modules are grouped under `frontend/src/features/`; global design tokens and screen styles are in `frontend/src/styles.css`.
- All 16 target screens have route/page coverage. Current compatibility paths include `/edit-profile`, `/filters`, `/chat/:matchId`, and aliases to the preferred `/profile/edit`, `/search`, and `/messages/:conversationId` routes.
- The current UI retains its custom CSS and shared SVG icon fallback. Tailwind CSS v4 is configured through the Vite plugin and imported in the global stylesheet; React Hook Form and Zod validate the auth forms; Lucide React, React Hot Toast, and Framer Motion are installed and used. Redux Toolkit is not installed or required by the current state-hook architecture.
- Backend code is organized under `backend/src/` with config, controllers, middleware, models, routes, services, sockets, and utilities. MongoDB/Mongoose, Express, JWT, bcryptjs, Helmet, CORS, rate limiting, Multer, Socket.IO, and Nodemailer are listed as dependencies. Cloudinary upload is implemented through the signed HTTP API in a service rather than the Cloudinary SDK.
- The root README has been reconciled with the current structure, environment setup, route map, integration caveats, and available commands.

### Assets and external configuration

- There is no populated `frontend/src/assets/` folder. The current app uses remote Unsplash portraits/hero photos and remote Dicebear fallback avatars. Replace these with licensed, approved production assets or retain clearly labeled development placeholders; do not turn the mockup portraits into user records.
- No local font files or source logo/vector asset are present. The stylesheet fetches DM Sans and Playfair Display from Google Fonts; either keep that runtime dependency or bundle approved font files. The HeartLink mark is currently rendered as inline SVG/CSS.
- Google/Facebook provider buttons appear in the reference auth screens. Firebase Google sign-in and sign-up are wired through the modular web SDK and shown only when the `VITE_FIREBASE_*` config is present; the backend verifies issuer and audience against `FIREBASE_PROJECT_ID`, and new sign-ups still complete the adult profile and terms consent. Facebook client credentials and verification are absent.
- Cloudinary environment credentials are blank in the example configuration; durable production photo hosting requires real Cloudinary credentials. Local development uploads are not an equivalent production storage guarantee.
- SMTP credentials are optional and needed for email verification/password recovery; support tickets are stored in MongoDB and can be reviewed in the staff queue, while outbound ticket email needs an explicitly approved support inbox. A payment provider, provider credentials, checkout session endpoint, and verified webhook are not configured; Premium must stay informational/disabled until those dependencies exist.
- Distance search depends on user coordinates. City text filtering exists; geocoding/consented coordinate capture and a clear approximate-distance policy are still needed to promise radius search.
- Vitest, React Testing Library, jest-dom, user-event, jsdom, ESLint, and Prettier are installed and locked for the frontend. Playwright/browser automation is not configured. Backend tests use Node's test runner and Supertest. The package locks have been synchronized; the latest test/build status is recorded below.

### Reference-to-route and module map

| Ref | Screen | Intended route | Current React module |
| ---: | --- | --- | --- |
| 01 | Landing / Home | `/` | `frontend/src/features/public/pages/PublicPages.jsx` |
| 02 | Sign Up | `/signup` | `frontend/src/features/public/pages/PublicPages.jsx` |
| 03 | Login | `/login` | `frontend/src/features/public/pages/PublicPages.jsx` |
| 04 | Discover Profiles | `/discover` | `frontend/src/features/discover/pages/DiscoveryPages.jsx` |
| 05 | Profile View | `/profile/:profileId` | `frontend/src/features/discover/pages/DiscoveryPages.jsx` |
| 06 | Matches | `/matches` | `frontend/src/features/discover/pages/DiscoveryPages.jsx` |
| 07 | Messages / Chat | `/messages/:conversationId` | `frontend/src/features/messages/pages/MessagesPage.jsx` |
| 08 | Edit Profile | `/profile/edit` | `frontend/src/features/account/pages/AccountPages.jsx` |
| 09 | Likes | `/likes` | `frontend/src/features/discover/pages/DiscoveryPages.jsx` |
| 10 | Settings | `/settings` | `frontend/src/features/account/pages/AccountPages.jsx` |
| 11 | Premium Membership | `/premium` | `frontend/src/features/account/pages/AccountPages.jsx` |
| 12 | Search & Filters | `/search` | `frontend/src/features/account/pages/AccountPages.jsx` |
| 13 | Notifications | `/notifications` | `frontend/src/features/account/pages/AccountPages.jsx` |
| 14 | Help & Support | `/help` | `frontend/src/features/account/pages/AccountPages.jsx` |
| 15 | About Us | `/about` | `frontend/src/features/public/pages/PublicPages.jsx` |
| 16 | FAQ | `/faq` | `frontend/src/features/public/pages/PublicPages.jsx` |

## Implementation checklist ordered by dependencies

1. **Design inputs — complete:** all 16 PNG references are catalogued and described above; canonical routes, 1440 × 900 desktop target, palette, typography, and responsive behavior are documented. Still obtain approved production photo licenses and confirm final font/logo hosting and production domains.
2. **Technical foundation — implemented, Atlas credentials pending:** Node 20+ requirement and frontend/backend package locks are in place; README and environment examples reflect the current app. Mongoose requires `MONGODB_URI` and no longer falls back to local MongoDB. Firebase web config and server project verification use environment variables. Tailwind Vite integration, React Hook Form/Zod, icon/toast/motion libraries, test utilities, and lint/format scripts are configured. Playwright remains optional and is not installed.
3. **Shared design foundation and shells — implemented, visual audit pending:** design tokens, focus and reduced-motion handling, shared UI primitives, public/member layouts, and protected routing exist. Compare each shell and responsive breakpoint against the references and close any deviations.
4. **Public/auth routes — implemented, end-to-end audit pending:** Landing, Sign Up, Login, About, FAQ, password recovery, email verification, and terms/privacy routes exist. Auth forms use schema validation. Firebase Google sign-in and sign-up are available when configured; new accounts require a valid adult birth date, gender selection, and terms acceptance. Complete user journeys still need an actual Firebase project and Atlas URI.
5. **Auth/data contracts — implemented, deployment verification pending:** registration/login/refresh/logout, adult DOB validation, refresh-session revocation, API validation, and optional email verification/recovery are present. Verify production secrets, cookie domain/SameSite policy, SMTP delivery, and deployment origins.
6. **Profile and discovery — implemented, provider and edge-case audit pending:** profile read/edit, discovery filters, photo upload, and profile actions have API support. Supply production Cloudinary credentials, verify file validation/gallery workflows, and decide whether consented geocoding/radius search will be supported; city search alone is not distance search.
7. **Like/match domain — implemented, behavior verification pending:** persisted like/super-like types, mutual match creation, received/sent likes, and match APIs exist. Match creation and match notifications now tolerate repeated requests; verify concurrent request races, block/report privacy, unmatch behavior, and whether a super-like quota is required.
8. **Conversation domain — implemented, integration verification pending:** message persistence, read state/unread counts, conversation APIs, and Socket.IO support exist. Opening a conversation marks messages read through the authenticated API and clears the local unread badge; REST and Socket.IO suppress peer-facing read receipts when the reader disables them, and read-only message retrieval no longer changes state. Messages also supports conversation search plus profile, report, and confirmed unmatch actions; successful unmatches return to the inbox. Local server startup now loads the socket service and the unauthenticated socket handshake is rejected. Verify authenticated delivery, reconnect behavior, pagination, presence/privacy settings, and live notification delivery with multiple accounts.
9. **Account/support screens — implemented, workflow audit pending:** settings, blocks, reports, notifications, and support request APIs/screens exist. New-match, like, and message notification preferences now gate persistent and live notification events; read-receipt privacy is enforced across message APIs and sockets. Report and support submissions have focused hourly rate limits. Signed-in support tickets use the member's account email as their contact address; moderator/admin APIs and role-gated staff queues provide paginated ticket review, report reason filters, status updates, and confirmed suspension/reactivation actions. The report API restricts moderator actions on privileged staff accounts to admins; suspending an account also revokes refresh sessions and disconnects active sockets, while reactivation requires a fresh sign-in. Account deletion removes linked support tickets and subscription records, and removes dependent database records before deleting the user. Outbound support email requires SMTP credentials and an explicitly approved destination inbox; ticket records remain available in MongoDB without it.
10. **Premium dependency gate — informational only:** the standalone Premium page now follows the reference's focused shell and includes a back-to-app link. Server-owned plans/status exist; checkout is disabled until a payment provider, server-created checkout session, signed webhook, and entitlement checks are configured and verified.
11. **Visual and functional verification — in progress:** backend and frontend tests, frontend lint, backend syntax/import checks, local MongoDB health/catalog smoke checks, and production build passed in the current workspace. Conversation search, notification category filters and destinations, and match-scoped privacy-aware online status are implemented. The current presence registry is process-local; multi-instance deployment needs shared presence storage and a Socket.IO adapter. The isolated browser preview covered the public landing, About, Help, demo Discover, and standalone Premium shells. Complete route-by-route desktop/tablet/phone review at 1440 × 900 and target breakpoints, keyboard/focus checks, empty/loading/error states, licensed image crops, and live-provider flows.

### Implementation progress (2026-10-27)

- Added frontend form validation, toast/motion/icon foundation, keyboard focus and reduced-motion styling, and focused auth/super-like tests.
- Hardened like/super-like and match duplicate handling; added like notifications, message read timestamps, unread counts, and Supertest API/security coverage.
- Fixed demo profile normalization so bundled demo image URLs reach the Discover cards instead of rendering blank photo panels.
- Matched Premium to the standalone reference layout, protected it with the existing auth gate, added the return link, and made demo mode avoid the authenticated subscription-status request.
- Added a mobile “More” navigation panel for Premium, Settings, Help & Support, and Log out; Escape and outside clicks dismiss it.
- Reworked About into the specified image/mission split with product facts; rebuilt Help around searchable category accordions and a support form, using the member shell when signed in and the public shell for footer visitors.
- Fixed the Socket.IO auth-token service import that prevented the API server from loading. Reactions now validate one emoji, persist per authenticated user, and broadcast the stored result instead of trusting a client-supplied reaction array.
- Connected the Messages conversation search to conversation names and latest-message text, with an accessible no-results state.
- Connected notification rows to their referenced match conversation or sender profile after marking them read; system notifications without a destination remain read-only.
- Added Notifications category tabs for All, Likes, Matches, Messages, and System, including normalization of match/message event aliases and super-likes.
- Replaced the chat “More” placeholder with profile, report, and confirmed unmatch actions; successful unmatches return to the inbox.
- Tied the top-bar notification dot to unread notification state so it clears after messages are marked read.
- Added accessible names and explicit button types to the Settings switches.
- Created the ignored local `backend/.env` with the local MongoDB URI fallback and generated development token secrets; the API health response confirmed the database connection.
- Enforced the read-receipts privacy setting in message, match, conversation, REST, and Socket.IO responses; message-history GET requests no longer mark messages as read.
- Applied recipient notification preferences to persistent and live new-match, like/super-like, and message events; direct Socket.IO messages now emit a notification event only when enabled.
- Implemented match-scoped online presence using active, unblocked matches; the saved visibility preference is enforced on connect, disconnect, and settings changes, and matched screens update live.
- Made match notifications idempotent for repeated likes by upserting on recipient, sender, and match ID.
- Added focused hourly limits to report and support submission endpoints in addition to the general API request limit.
- Extended account deletion to remove the user's linked support tickets and subscription records from MongoDB, then delete the user only after dependent record deletion succeeds.
- Bound signed-in support ticket contact addresses to the authenticated account email instead of trusting a user-submitted address.
- Added a moderator/admin support queue API with pagination, status/category filters, and constrained ticket status updates.
- Added a role-gated support queue page with status updates, filter controls, and pagination; exposed the authenticated user's role in auth and private-profile responses so staff navigation remains available after profile edits.
- Added a role-gated safety report queue with status/reason filters, pagination, and confirmation before account suspension or reactivation.
- Restricted moderation of privileged accounts to admins at the report API, with matching staff-account messaging in the queue UI.
- Made account suspension revoke refresh sessions and disconnect active Socket.IO connections immediately.
- Required MongoDB Atlas through `MONGODB_URI` with local database fallback disabled; added Firebase Google Auth web config in `frontend/.env` and project-scoped ID token verification through `FIREBASE_PROJECT_ID` in `backend/.env`.
- Added env-gated Firebase Google sign-in and profile-complete Google sign-up; narrowed dependencies to Firebase App/Auth only after npm audit found zero vulnerabilities without the unused all-services package.
- Added a dedicated 10-attempt/15-minute rate limit to the Google auth endpoint and both API aliases.
- Added `npm run check:env` to validate Atlas configuration and Firebase project ID alignment without displaying credential values.
- Marked conversations read through the authenticated REST endpoint when opened and cleared their local unread count; the realtime socket read event remains active.
- Updated the project README, environment example, package scripts, and package locks.
- Split public, discovery, account, messaging, and moderation page modules into route-loaded chunks; added an accessible loading state and a page-level recovery screen for rendering or chunk-load failures.
- Debounced discovery queries by 250 ms and separated profile fetching from account bootstrap requests, so search/filter changes no longer refetch matches, likes, notifications, or settings.
- Real-Data-Only Architecture and Production Hardening (2026-10-28):
  - Completely purged demo mode, demo controls, and sample profile mock data from the frontend (`DEMO_USER`, `DEMO_PROFILES`, `DEMO_LIKES`, `DEMO_MATCHES`, `INITIAL_MESSAGES`, `DEMO_NOTIFICATIONS`, `enterDemo()`, and `isDemo` guards).
  - Permanently removed synthetic database seeding endpoints and controllers (`backend/src/routes/seedRoutes.js`, `backend/src/controllers/seedController.js`, `/api/seed`, and `/api/v1/seed`).
  - Implemented truthful, honest empty states across all 16 canonical screens when real accounts have no likes, matches, messages, notifications, or discover profiles.
  - Enforced real photo uploads only; when a user has not uploaded a photo, the app renders a neutral initials avatar badge across ProfileCards, Matches, Likes, and Profile details rather than broken images or generated faces.
  - Prepared standard deployment configurations for Vercel (frontend SPA with root and frontend `vercel.json` rewrites and caching) and Render (backend API + Socket.IO with `render.yaml` blueprint).
  - Realtime state consistency: incoming likes reload on socket like/superlike notifications and match events; matches reload on match events; deduplicated inflight requests prevent race conditions.
  - Full suite verification: 11 backend tests passed (100%), 8 frontend tests passed (100%), ESLint passed with 0 errors and 0 warnings, Vite production build succeeded in ~4.9s with 0 warnings and zero demo artifacts, and `node --check` passed across all backend JavaScript files.
- Modern Modular Architecture & Real-Time Hardening (2026-10-30):
  - Refactored frontend structure into cleanly isolated domains (`context/AuthContext`, `context/SocketContext`, `pages/PublicPages`, `pages/DiscoveryPages`, `pages/MessagesPage`, `pages/AccountPages`, `components/Layout`, `components/ui`).
  - Added dedicated `refreshLimiter` (120 req / 15 min) in `backend/src/app.js` to decouple session token renewals from the strict 10-attempt `loginLimiter`.
  - Mutual like acceptance fix: updated `discoverController.swipeLike` so liking a profile back from the Likes tab succeeds even if one-way discover filters differ.
  - Block filtering in conversations: `conversationController.getConversations` filters out blocked or deactivated accounts.
  - Complete Socket.IO event bus: handles token rotation, server disconnect recovery, real-time incoming like refreshes on `like_received` or `new_notification`, match synchronization on `new_match_event` (updating matches and purging pending incoming likes), unmatch synchronization on `match_removed`, and presence updates on `presence_update`.
  - Race-condition elimination in `useRemote`: added sequence counter (`sequenceRef`), mount guard (`isMountedRef`), and silent background reload (`{ silent: true }`) so live socket events update state without UI spinner flicker and out-of-order responses are discarded.
  - Unread badges: wired real-time counters to the topbar notification bell and navigation links.
  - Verification: 21 backend unit and integration tests passed (100%), Oxlint 0 warnings/0 errors, Vite production build passed in ~300ms, and `node backend/src/config/checkEnv.js` validated environment configuration.
- Not yet verified end-to-end: live MongoDB Atlas production cluster connection, live Firebase project ID token verification, outbound SMTP delivery, and live Cloudinary persistence (local credentials remain blank until production account provisioning).
