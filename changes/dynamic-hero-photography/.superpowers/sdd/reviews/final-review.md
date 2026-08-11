# Final Review: dynamic-hero-photography

**Verdict: PASS**

## Scope Reviewed

- Base `e6cfd81`, head `4723a6a`; 8 implementation commits plus the Task 3 report artifact.
- Full diff read once: 11 files, +487/-75; no package, lockfile, or unrelated source churn.
- Approved artifacts read: `spec.md`, `execution-contract.md`, `design.md`, `tasks.md`, wave plan and receipts.
- Wave review receipts are all PASS (`server-config`, `frontend-experience`, `integration-docs`).
- Test evidence accepted as supplied: 113 unit/component tests, build, lint, and 2 e2e tests passing. The suite was not re-run.

## Completeness

- `PUT /api/config` accepts any `heroImages` length, including `[]`, and validates non-empty string `id`, `url`, and `alt` before any storage write (`server/routes/config.ts:87-103`).
- Homepage renders 1-8 images dynamically, renders no grid or empty state for `[]`, and collapses >8 to the first 6 with an expand/collapse control (`src/components/home/HeroSection.tsx:12-16`, `src/components/home/HeroSection.tsx:136-218`).
- Admin supports add with `crypto.randomUUID()`, per-row upload, URL/alt editing, and delete; save persists through the existing `configApi.update` (`src/components/ConfigManager.tsx:52-56`, `src/components/ConfigManager.tsx:58-82`, `src/components/ConfigManager.tsx:145-158`).
- Existing 3-image configs are preserved verbatim, and the default is still 3 images when no config exists (`server/routes/config.ts:39`, `server/routes/config.ts:96-103`).
- All SHALL/MUST requirements from the spec are implemented; the non-goals (new endpoints, new dependencies, drag sorting, auth changes, full hero redesign) are respected.

## Strengths

- Behavior-first coverage is strong: server tests cover 5 items, empty array, all six missing/empty field cases with a no-write assertion, and unchanged 3-item reads (`server/__tests__/config.test.ts:97-157`).
- HeroSection tests cover 0, 1, 3, 5, and 20 images, including expand to 20 and collapse back to 6 with `aria-expanded` assertions (`src/__tests__/HeroSection.test.tsx:46-94`).
- ConfigManager tests cover add, delete + save, save empty, and save a newly added row with the generated UUID (`src/__tests__/ConfigManager.test.tsx:64-126`).
- The e2e test covers the approved end-to-end path: admin add, save, then homepage renders the actual `img[src]`/`alt` (`e2e/config.spec.ts:65-105`).
- The implementation follows the design: CSS grid instead of a masonry library, `LazyImage` for all gallery images, no new endpoints, and local edit-form state until save.
- The expand control is a native `<button>` with `aria-expanded`, count text, and the designed thumbnail collage; all expanded gallery images use one 4/3 aspect ratio (`src/components/home/HeroSection.tsx:166-215`).

## Findings

### Minor

- **Stale "slot" comments:** `server/routes/config.ts:4` and `src/config/heroImages.ts:4` still describe hero images as fixed slots. The public JSDoc and README are correct, but these two internal comments are not fully synchronized with the arbitrary-count behavior.
- **No automated hero-upload test:** the upload path exists and reuses `uploadApi.image` (`src/components/ConfigManager.tsx:58-82`), but the new tests cover add/remove/save rather than simulating a file upload into a hero row. The e2e covers URL entry, so this is a coverage polish item, not a functional gap.
- **E2E cleanup residual risk:** `resetConfig` hardcodes `/api` and ignores CSRF/reset responses (`e2e/config.spec.ts:12-24`). In the isolated port-3002 run, cleanup may not have hit the backend under test; the default Playwright/Vite proxy setup is unaffected. The two passing tests still validate the new flow.
- **SPA cache residual risk:** `useSiteConfig` keeps a module-level cache (`src/hooks/useSiteConfig.ts:4`, `src/hooks/useSiteConfig.ts:12-23`) that `ConfigManager.handleSave` does not invalidate (`src/components/ConfigManager.tsx:27-30`). In-app `<Link>` navigation back to the homepage can therefore show the previous config until a full page load; the e2e verifies via `page.goto('/')`, so the approved acceptance path passes. This is a pre-existing cache pattern, but it is worth a follow-up if immediate in-app propagation is desired.

## Assessment

No Critical or Important findings. The branch is complete against the approved spec, design, and execution contract, stays within the scope fence, and has meaningful behavior-first tests plus an end-to-end check of the primary user flow. The Minor items are documentation, test polish, and residual-risk notes only and do not block the change.
