# git-workbench

A Git panel plugin for OpenCode Desktop, built on the OpenCode V2 GUI plugin SDK (`@opencode/plugin/gui`).

**English** | [简体中文](README.zh-CN.md)

## Features

- **Changes** — view staged and unstaged files, stage or unstage per file, inspect unified diffs, write a commit message and commit (with `--amend` support).
- **Graph** — commit history drawn in lanes, with current-branch / all-branches switch, ref labels, author and relative time, and incremental loading.
- English and Simplified Chinese UI, following OpenCode's language setting.
- All Git commands run in the Electron main process through `execFile`, never through a shell.

## Requirements

- OpenCode Desktop. The GUI plugin API is experimental, so a future OpenCode upgrade may require adapting this plugin.
- Node.js 22.6 or newer for development (`npm test` relies on `--experimental-strip-types`).

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/GerZhang/opencode-git.git
cd opencode-git
npm install
```

Add the local plugin directory to `~/.config/opencode/opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["/absolute/path/to/opencode-git"]
}
```

Restart OpenCode Desktop, then either:

- pick **Git** from the `+` menu in the session sidebar, or
- run **Open Git** from the command palette.

The plugin is listed under **Settings > Extensions > Plugins** and can be disabled there.

`dist/gui-experimental.cjs` is committed, so the plugin loads without a build step. Run `npm run build` after changing the source.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

Watch mode:

```bash
npm run watch
```

OpenCode Desktop reloads the plugin's GUI automatically after a rebuild; no app restart is needed.

## Project structure

```text
src/
├── index.ts              Server part: declares the plugin id `git-workbench`
├── gui.tsx               GUI entry: combines declarations, window setup and main
├── gui/
│   ├── contract.ts       Typed IPC between main and window (Effect Schema)
│   ├── definition.ts     i18n declarations
│   ├── main.ts           Electron main process: registers the Git IPC implementation
│   ├── window.tsx        Window: Panel / Command / MenuItem / Style
│   ├── GitPanel.tsx      Changes and Graph UI
│   └── styles.ts         CSS injected into the document
└── git/
    ├── service.ts        Git commands and parsing (status/log/diff/stage/commit)
    └── graph.ts          Lane layout for commit history
```

## Notes

- The GUI plugin API is experimental in OpenCode (`./gui-experimental`); expect adjustments across upgrades.
- This version does not push, pull, checkout, rebase or discard changes — it only covers inspecting history and committing.
- File changes are not polled automatically. Use the refresh button in the panel header, or let any Git action refresh the view.
- Commits run the repository's own hooks. If GPG signing is configured, a signing failure is shown in the panel's error bar.

## License

[MIT](LICENSE)
