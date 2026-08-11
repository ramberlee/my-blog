# Task 1 Review: server-config

## Verdict: PASS

No Critical or Important findings. The implementation satisfies the task brief and the global constraints from the spec/design.

## Spec Compliance

- PASS: `PUT /api/config` accepts `heroImages` of arbitrary length, including `[]`. Validation is length-agnostic at `server/routes/config.ts:87-95`, and tests cover a 5-item array (`server/__tests__/config.test.ts:97-108`) and an empty array (`server/__tests__/config.test.ts:110-114`).
- PASS: Every item must have non-empty string `id`, `url`, and `alt`. The check at `server/routes/config.ts:89-94` requires `typeof` string plus non-empty after `trim()` for all three fields.
- PASS: Missing or empty fields return 400 and do not write config. Validation returns at `server/routes/config.ts:94` before `readJSON`/`writeJSON` at `server/routes/config.ts:96-103`, so no write can occur; the `it.each` tests at `server/__tests__/config.test.ts:116-143` cover all six missing/empty cases and verify the stored baseline survives the rejected PUT.
- PASS: Existing stored 3-item config is returned unchanged, including order. The test at `server/__tests__/config.test.ts:145-157` PUTs a deliberately out-of-order 3-item array and asserts `toEqual` on GET; the code path preserves `heroImages` verbatim at `server/routes/config.ts:39,101`.
- PASS: JSDoc states arbitrary count. The `heroImages` contract comment is updated at `server/routes/config.ts:17`, and both GET (`server/routes/config.ts:49`) and PUT (`server/routes/config.ts:67-68`) JSDoc state that any number is supported and the array may be empty.
- PASS: GET with no stored config still returns the default 3 items; the pre-existing test at `server/__tests__/config.test.ts:64-73` already covers this and is unchanged.
- PASS: Tests are behavior-first and use the existing mocked storage setup. Assertions check HTTP status and response/stored body, not internals; the shared `vi.mock("../storage.js")` temp-dir setup is at `server/__tests__/config.test.ts:3-33`.

## Code Quality

- PASS: Validation is placed before any storage read or write, making the "invalid request never writes" guarantee structural rather than incidental.
- PASS: The rejection test observes the persisted state after the failed request, which is the right behavioral check for the no-write requirement.
- PASS: Scope is confined to the two task files; no unrelated refactors or metadata churn.
- PASS: Whitespace-only strings are rejected along with empty strings, which is consistent with the non-empty requirement.
- Minor: TDD RED evidence is self-reported only. The single commit `7db8c49` contains both tests and implementation, so the failing-first phase cannot be independently verified from the diff; this does not violate the task's required behavior.
- Minor: No test covers a mixed array with one invalid item among valid items. The implementation's `some` predicate at `server/routes/config.ts:89-94` handles this correctly, and the brief's example coverage list does not require it.

## Checks Run

- Checked `git diff --stat e6cfd81..7db8c49`: exactly `server/__tests__/config.test.ts` and `server/routes/config.ts` changed.
- Read the full diff once, plus the line-numbered current contents of both touched files.
- Verified head commit `7db8c49` is `feat: allow arbitrary hero image count in config API (Task 1)`.
- Did not re-run the test suite; the implementer's reported 14/14 focused and 81 full-suite passing results are consistent with the assertions in the diff.

## Receipt

```bash
ssf execution review changes/dynamic-hero-photography --wave server-config --base e6cfd81 --head 7db8c49 --report .superpowers/sdd/reviews/server-config.md --verdict pass
```
