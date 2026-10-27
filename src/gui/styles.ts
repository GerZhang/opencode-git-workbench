export const styles = `
.ocgit-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: inherit;
  font-size: 12px;
  line-height: 1.45;
}

.ocgit-panel *,
.ocgit-panel *::before,
.ocgit-panel *::after {
  box-sizing: border-box;
}

.ocgit-panel button,
.ocgit-panel input,
.ocgit-panel textarea {
  font: inherit;
  color: inherit;
}

.ocgit-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid color-mix(in srgb, currentColor 12%, transparent);
}

.ocgit-branch {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  flex: 1;
  font-weight: 600;
}

.ocgit-branch-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: color-mix(in srgb, currentColor 8%, transparent);
  font-size: 11px;
  opacity: 0.75;
  flex: none;
}

.ocgit-branch-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ocgit-detached {
  flex: none;
  font-size: 9px;
  font-weight: 500;
  padding: 1px 5px;
  border-radius: 999px;
  color: #d97706;
  background: color-mix(in srgb, #d97706 13%, transparent);
}

.ocgit-icon-button {
  appearance: none;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  background: color-mix(in srgb, currentColor 4%, transparent);
  border-radius: 5px;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  flex: none;
  opacity: 0.8;
}

.ocgit-icon-button:hover:not(:disabled) {
  background: color-mix(in srgb, currentColor 11%, transparent);
  opacity: 1;
}

.ocgit-icon-button:disabled {
  opacity: 0.35;
  cursor: default;
}

.ocgit-tabs {
  display: flex;
  gap: 2px;
  padding: 4px 10px 0;
  border-bottom: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  flex: none;
}

.ocgit-tab {
  appearance: none;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: inherit;
  opacity: 0.55;
  padding: 5px 8px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
}

.ocgit-tab:hover {
  opacity: 0.8;
}

.ocgit-tab.active {
  opacity: 1;
  border-bottom-color: #2563eb;
}

.ocgit-tab-count {
  opacity: 0.6;
  margin-left: 3px;
  font-variant-numeric: tabular-nums;
}

.ocgit-banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 10px;
  font-size: 11px;
  border-bottom: 1px solid color-mix(in srgb, currentColor 10%, transparent);
  flex: none;
}

.ocgit-banner.error {
  background: color-mix(in srgb, #dc2626 10%, transparent);
}

.ocgit-banner.notice {
  background: color-mix(in srgb, #16a34a 10%, transparent);
}

.ocgit-banner-text {
  min-width: 0;
  flex: 1;
  max-height: 120px;
  overflow: auto;
  overflow-wrap: anywhere;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.ocgit-changes {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.ocgit-commit-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid color-mix(in srgb, currentColor 10%, transparent);
  flex: none;
}

.ocgit-message {
  width: 100%;
  min-height: 56px;
  max-height: 140px;
  resize: vertical;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  background: color-mix(in srgb, currentColor 3%, transparent);
  padding: 6px 8px;
  font-size: 11px;
  line-height: 1.5;
  outline: none;
}

.ocgit-message:focus {
  border-color: color-mix(in srgb, #2563eb 55%, transparent);
  box-shadow: 0 0 0 2px color-mix(in srgb, #2563eb 15%, transparent);
}

.ocgit-message::placeholder {
  color: inherit;
  opacity: 0.4;
}

.ocgit-commit-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ocgit-check {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  opacity: 0.7;
  cursor: pointer;
  min-width: 0;
}

.ocgit-check input {
  margin: 0;
  width: 12px;
  height: 12px;
  accent-color: #2563eb;
}

.ocgit-button {
  appearance: none;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  background: color-mix(in srgb, currentColor 5%, transparent);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.ocgit-button:hover:not(:disabled) {
  background: color-mix(in srgb, currentColor 12%, transparent);
}

.ocgit-button:disabled {
  opacity: 0.4;
  cursor: default;
}

.ocgit-button.primary {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

.ocgit-button.primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.ocgit-button.subtle {
  border-color: transparent;
  background: transparent;
  opacity: 0.6;
  padding: 2px 5px;
}

.ocgit-button.subtle:hover:not(:disabled) {
  opacity: 1;
  background: color-mix(in srgb, currentColor 8%, transparent);
}

.ocgit-changes-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.ocgit-section {
  border-bottom: 1px solid color-mix(in srgb, currentColor 8%, transparent);
}

.ocgit-section:last-child {
  border-bottom: none;
}

.ocgit-section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  opacity: 0.62;
}

.ocgit-section-head > span:first-child {
  flex: 1;
}

.ocgit-file {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  cursor: pointer;
  outline: none;
  min-width: 0;
}

.ocgit-file:hover,
.ocgit-file:focus-visible {
  background: color-mix(in srgb, currentColor 6%, transparent);
}

.ocgit-file.selected {
  background: color-mix(in srgb, #2563eb 12%, transparent);
}

.ocgit-status {
  width: 15px;
  flex: none;
  text-align: center;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 9px;
  font-weight: 700;
  border-radius: 3px;
  padding: 1px 0;
  background: color-mix(in srgb, currentColor 7%, transparent);
}

.ocgit-status.mod {
  color: #d97706;
}

.ocgit-status.add {
  color: #16a34a;
}

.ocgit-status.del {
  color: #dc2626;
}

.ocgit-status.rename {
  color: #2563eb;
}

.ocgit-status.conflict {
  color: #dc2626;
  background: color-mix(in srgb, #dc2626 12%, transparent);
}

.ocgit-status.untracked {
  color: #6b7280;
}

.ocgit-file-path {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
}

.ocgit-file-old {
  opacity: 0.5;
  font-size: 10px;
}

.ocgit-empty {
  padding: 18px 14px;
  text-align: center;
  font-size: 11px;
  opacity: 0.55;
  line-height: 1.6;
}

.ocgit-empty-title {
  font-weight: 600;
  opacity: 1;
  margin-bottom: 3px;
}

.ocgit-empty-hint {
  font-size: 10px;
  opacity: 0.75;
  overflow-wrap: anywhere;
}

.ocgit-diff {
  display: flex;
  flex-direction: column;
  min-height: 100px;
  max-height: 46%;
  border-top: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  flex: none;
}

.ocgit-diff-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 4px 10px;
  border-bottom: 1px solid color-mix(in srgb, currentColor 8%, transparent);
  flex: none;
}

.ocgit-diff-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  opacity: 0.72;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.ocgit-diff-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
  line-height: 1.5;
  padding: 3px 0;
}

.ocgit-diff-line {
  white-space: pre;
  padding: 0 10px;
  min-height: 1.5em;
}

.ocgit-diff-line.meta {
  opacity: 0.6;
}

.ocgit-diff-line.hunk {
  color: #2563eb;
  background: color-mix(in srgb, #2563eb 8%, transparent);
}

.ocgit-diff-line.add {
  color: #16a34a;
  background: color-mix(in srgb, #16a34a 9%, transparent);
}

.ocgit-diff-line.del {
  color: #dc2626;
  background: color-mix(in srgb, #dc2626 8%, transparent);
}

.ocgit-note {
  padding: 3px 10px;
  font-size: 9px;
  opacity: 0.55;
}

.ocgit-graph-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid color-mix(in srgb, currentColor 8%, transparent);
  flex: none;
}

.ocgit-graph-count {
  margin-left: auto;
  font-size: 9px;
  opacity: 0.5;
}

.ocgit-graph-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.ocgit-commit {
  display: flex;
  gap: 4px;
  min-height: 54px;
  padding: 3px 8px 3px 2px;
  border-bottom: 1px solid color-mix(in srgb, currentColor 6%, transparent);
}

.ocgit-commit:hover {
  background: color-mix(in srgb, currentColor 4%, transparent);
}

.ocgit-graph-col {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.ocgit-commit-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.ocgit-commit-subject {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 500;
}

.ocgit-commit-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 9px;
  opacity: 0.58;
}

.ocgit-commit-meta > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ocgit-commit-meta > span:first-child {
  min-width: 0;
  flex: 0 1 auto;
}

.ocgit-commit-refs {
  display: flex;
  align-items: center;
  gap: 3px;
  min-width: 0;
  overflow: hidden;
  max-height: 15px;
}

.ocgit-ref {
  flex: none;
  font-size: 8px;
  line-height: 13px;
  padding: 0 4px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  white-space: nowrap;
}

.ocgit-ref.head {
  color: #16a34a;
  border-color: color-mix(in srgb, #16a34a 35%, transparent);
  background: color-mix(in srgb, #16a34a 12%, transparent);
}

.ocgit-ref.branch {
  color: #2563eb;
  border-color: color-mix(in srgb, #2563eb 35%, transparent);
  background: color-mix(in srgb, #2563eb 12%, transparent);
}

.ocgit-ref.remote {
  color: #7c3aed;
  border-color: color-mix(in srgb, #7c3aed 35%, transparent);
  background: color-mix(in srgb, #7c3aed 12%, transparent);
}

.ocgit-ref.tag {
  color: #d97706;
  border-color: color-mix(in srgb, #d97706 35%, transparent);
  background: color-mix(in srgb, #d97706 12%, transparent);
}

.ocgit-ref.more {
  opacity: 0.55;
}

.ocgit-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.ocgit-load-more {
  display: block;
  width: calc(100% - 20px);
  margin: 8px 10px;
  padding: 5px;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 6px;
  background: color-mix(in srgb, currentColor 4%, transparent);
  cursor: pointer;
  font-size: 10px;
}

.ocgit-load-more:hover {
  background: color-mix(in srgb, currentColor 9%, transparent);
}
`
