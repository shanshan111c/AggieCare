# Aggie Care

An independent, student-built interface for publicly listed UC Davis resources. It is not an official UC Davis service or an emergency response system. [Live site](https://aggie-care-now.byebyelittlemouse.chatgpt.site/).

## Start locally

Requires Node.js 22.13+ and pnpm. Run `pnpm install`, then `pnpm dev` to preview the public site. Run `pnpm build` before publishing. The site is a Vinext/React app backed by a Cloudflare Worker and a D1 aggregate-analytics table.

## Edit without hunting through code

Run `pnpm maintain` and open `http://127.0.0.1:4317`. The maintenance tool binds **only to localhost** and has two separate screens:

- **UI 编辑:** edit the home-page hero text in all seven languages, plus the Settings announcement and poster path. It saves to [`app/site-content.json`](app/site-content.json). Put replacement poster images in `public/` first. Saving changes source files only; build and deploy to update the live site.
- **后台监控:** import a CSV or JSON export of the D1 `usage_daily` table. It charts daily totals and counts by action. The file stays in the browser; there is no public analytics dashboard. The table stores daily aggregate search/click counts only—**not** search phrases, IP addresses, user IDs, or location.

To get a current production export, use your authorized Sites D1 database access and export `usage_daily` with columns `day,kind,target,count`. Keep the export private. A GitHub checkout does not grant access to production analytics.

## Source map

| Area | Files | Change here for |
| --- | --- | --- |
| Editable UI copy | `app/site-content.json`, `tools/maintainer.html`, `scripts/maintainer.mjs` | Hero wording, banner, poster |
| Public screen | `app/page.tsx`, `app/globals.css` | Layout, resource cards, schedules, interaction |
| Search | `app/english-search.ts`, `app/resource-prompts.ts`, `app/resource-patches.ts` | Intent matching and aliases |
| Resources and map | `app/page.tsx`, `app/map-data.ts`, `app/resource-localization.ts` | Verified services, map markers, Chinese resource copy |
| Analytics backend | `worker/index.ts`, `db/schema.ts`, `drizzle/` | Anonymous event collection and D1 schema |
| Static assets | `public/` | Icons, campus map, poster |
| Regression checks | `tests/` | Search, safety and resource tests |

For a new resource, add its card and official URL in `app/page.tsx`, add reviewed search phrases in `app/resource-prompts.ts`, and add Chinese copy in `app/resource-localization.ts`. Do not invent opening hours or mark appointment-only services as walk-in. Run the search tests before publishing.

## Test and package

Run `node --test tests/english-random-20000.test.mjs tests/all-resources-typo-500.test.mjs tests/resource-expansion.test.mjs` for the core search/resource regression, then `pnpm build`. The 20,000-query test uses deterministic variations of 100 manually labelled seeds; it is **not** a trained language model or 20,000 independent real-world requests.

This repository deliberately contains no Apple signing key, Android keystore, API key, production analytics export, or `.env` file. Keep those outside GitHub. `.openai/hosting.json` holds the Sites project identifier and deployment bindings, not credentials; deploying still requires authorized access to that Site. A source ZIP is not an installable mobile app package.
