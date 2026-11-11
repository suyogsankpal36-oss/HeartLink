# HeartLink design reference checklist

The original desktop screens are extracted under `docs/design-reference/HeartLink_Desktop_Pages_Frame_by_Frame/`. They were reviewed individually as implementation references; they are not used as page backgrounds or user photos.

## Page-to-route map

| Ref | Image | Route | UI module |
| --- | --- | --- | --- |
| 01 | `01_Landing_Home.png` | `/` | `frontend/src/pages/PublicPages.jsx` |
| 02 | `02_Sign_Up.png` | `/signup` | `frontend/src/pages/PublicPages.jsx` |
| 03 | `03_Login.png` | `/login` | `frontend/src/pages/PublicPages.jsx` |
| 04 | `04_Discover.png` | `/discover` | `frontend/src/pages/DiscoveryPages.jsx` |
| 05 | `05_Profile_View.png` | `/profile/:profileId` | `frontend/src/pages/DiscoveryPages.jsx` |
| 06 | `06_Matches.png` | `/matches` | `frontend/src/pages/DiscoveryPages.jsx` |
| 07 | `07_Messages_Chat.png` | `/messages`, `/chat/:matchId` | `frontend/src/pages/MessagesPage.jsx` |
| 08 | `08_Edit_Profile.png` | `/edit-profile` | `frontend/src/pages/AccountPages.jsx` |
| 09 | `09_Likes.png` | `/likes` | `frontend/src/pages/DiscoveryPages.jsx` |
| 10 | `10_Settings.png` | `/settings` | `frontend/src/pages/AccountPages.jsx` |
| 11 | `11_Premium.png` | `/premium` | `frontend/src/pages/AccountPages.jsx` |
| 12 | `12_Search_Filters.png` | `/filters` | `frontend/src/pages/AccountPages.jsx` |
| 13 | `13_Notifications.png` | `/notifications` | `frontend/src/pages/AccountPages.jsx` |
| 14 | `14_Help_Support.png` | `/help` | `frontend/src/pages/AccountPages.jsx` |
| 15 | `15_About_Us.png` | `/about` | `frontend/src/pages/PublicPages.jsx` |
| 16 | `16_FAQ.png` | `/faq` | `frontend/src/pages/PublicPages.jsx` |

## Shared visual requirements

- Pink and white palette with dark plum text, rounded cards, light borders, and soft shadows.
- Public pages use a compact top navigation; member pages use a persistent left navigation rail.
- Profile photography belongs in image/avatar components. Placeholder content is development demo data only.
- Forms, discovery cards, matches, chat, account pages, premium, and public information pages are built from HTML and reusable React components.
- Responsive layouts should preserve the same page hierarchy on tablet and mobile.

## Existing implementation notes

- All 16 screens have React route/page coverage.
- Development demo profiles are defined in `frontend/src/data.js`; they are not production database records.
- Premium presentation exists, but live pricing and payment processing require a configured provider and verified webhooks.
- Profile photo persistence currently depends on the backend upload configuration; configure Cloudinary for durable production storage.
