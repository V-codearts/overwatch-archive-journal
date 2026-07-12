Goal: Keep the app local-only as requested, but make it possible to back up and restore all journal data so nothing is lost long-term.

What we will build
------------------
1. Export backup
   - Add a small settings/backup area (a simple modal or bottom-of-page section) reachable from the main UI.
   - "Export" button downloads a single `.json` file containing:
     - current day session
     - full history
     - a small schema/version marker so future imports are safe
   - File is named with the date, e.g. `owcj-backup-2026-07-12.json`.

2. Import backup
   - "Import" button opens a file picker limited to `.json`.
   - Validate the file structure before overwriting anything.
   - Show a confirmation step telling the user how many history entries will be restored.
   - On confirm, replace IndexedDB/localStorage data and refresh the app state.

3. Safety guards
   - Import will not merge blindly: it will replace local data after confirmation.
   - If the imported file is malformed or missing required fields, show an error and make no changes.
   - Keep the existing auto-save behavior untouched.

4. UI placement
   - Add a small gear/settings icon in the compact header we just built.
   - The backup controls live in a modal so they do not clutter the main pages.
   - Keep text minimal since you prefer no helper/info clutter.

Technical approach
------------------
- Reuse the existing `db` helpers in `src/lib/db.ts` for reading/writing IndexedDB.
- Add two new async helpers in `src/lib/backup.ts`:
  - `exportData(): Promise<Blob>` — gather current + history and return a JSON blob.
  - `importData(file: File): Promise<{ currentCount, historyCount }>` — parse, validate, and write back via `db`.
- Create `src/components/BackupModal.tsx` with Export/Import UI.
- Wire the settings icon into `src/components/Layout.tsx`.
- No backend or Lovable Cloud needed; everything stays in the browser.

Result
------
You can click Export at any time to save a backup file to your computer or cloud drive. If you ever clear your browser, switch devices, or just want to migrate, click Import and pick the backup file. Your data is fully portable and durable as long as you keep the backup file safe.