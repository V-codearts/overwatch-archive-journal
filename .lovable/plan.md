## 1. Unpublish the site

Take the current Lovable deployment offline so `overwatch-archive-journal.lovable.app` no longer serves the app. Note: Lovable's tooling can toggle visibility (public/private) but does not have a first-class "unpublish" action from the agent side. The reliable path is:

- Switch publish visibility to **private** (only workspace members can load it — effectively unpublished for anyone with the link who isn't in your workspace).
- If you want it fully torn down instead, do it from the Lovable UI: **Publish → Unpublish**. I'll flag this in the reply so you can one-click it.

## 2. Make the app feel smooth

The lag is coming from a few concrete places in the current code, not from the framework. Fixes, in priority order:

1. **Stop re-rendering the whole dashboard every second.** `useLiveClock` in `src/routes/index.tsx` calls `setNow(new Date())` every 1s at the top of `Dashboard`, which re-renders every `RoleCard`, the record panel, animated counters, etc. Move the clock into its own tiny `<LiveClock />` component so only that node updates.
2. **Same issue for the running timer.** `useLiveTimer` (in `src/lib/store.tsx`) ticks every second; make sure it's only consumed inside `<Timer />` (it already is) and doesn't leak into parents. Verify and, if needed, memoize.
3. **Debounced writes are fine, but state updates aren't batched.** Wrap `RoleCard` in `React.memo` and pass stable callbacks (via `useCallback`) from `Dashboard` so typing in one role doesn't re-render the others.
4. **`RichNotes` commits on every keystroke** → triggers a full `DaySession` state update → re-renders the whole notes route and re-runs debounced IndexedDB save. Debounce `onChange` locally (e.g. 150–250ms) and skip commits when HTML is unchanged.
5. **`AnimatedCounter`** — check it isn't running a rAF loop when the value hasn't changed; guard against no-op animations.
6. **IndexedDB opens on every read/write.** Cache the `IDBDatabase` handle in `src/lib/db.ts` module scope instead of re-opening per call.
7. **Timer interval consolidation.** Multiple `setInterval(…, 1000)` across components — fine individually, but combined with #1 they multiply renders. #1 alone will remove most of the perceived lag.

No visual/behavioral changes — pure perf.

## 3. Desktop & mobile app packaging

Yes, this is doable without changing the app itself. Two separate outputs from the same codebase:

### Desktop (Windows / macOS / Linux) via Electron
- Add `electron` + `@electron/packager` as devDependencies.
- Add `electron/main.cjs` that loads the built `dist/index.html` in a `BrowserWindow`.
- Set `base: './'` in `vite.config.ts` so `file://` asset paths resolve.
- Build script produces a `.zip` (macOS/Windows) or `.tar.gz` (Linux) you download and run. No installer/signing — you double-click the app.
- Data persists via the existing IndexedDB layer, so your journal stays local per machine.

### Mobile — pick one:
- **A. Installable PWA (recommended, zero friction).** Add a web manifest + icons; "Add to Home Screen" on iOS/Android gives you an app icon that launches full-screen with no browser chrome. No app stores, no signing, works on the current URL (or a private one). This is the fastest path and matches how you already use it.
- **B. Native wrapper via Capacitor.** Real `.apk` / `.ipa`. Much more setup (Android Studio / Xcode, signing, store accounts if you want to distribute). Overkill for personal use.

I'd suggest **Electron for desktop + PWA for mobile** — both free, no stores, no accounts, data stays local.

## Technical notes

- Perf fixes are all in `src/routes/index.tsx`, `src/lib/store.tsx`, `src/lib/db.ts`, `src/components/RichNotes.tsx`, `src/components/RoleCard.tsx`, `src/components/AnimatedCounter.tsx`. No schema or data changes.
- Electron packaging follows the sandbox's `@electron/packager` recipe; output archive drops into `/mnt/documents/` for download.
- PWA path uses manifest-only (no service worker) since you don't need offline beyond what IndexedDB already gives you.

## Questions before I build

1. For unpublish: **flip to private** (fastest, I can do it), or do you want to unpublish yourself from the UI?
2. Mobile: **PWA (Add to Home Screen)** or **Capacitor native app**?
3. Desktop: which OS do you actually use — **Windows, macOS, or Linux**? (I can build all three, but confirming saves time.)
