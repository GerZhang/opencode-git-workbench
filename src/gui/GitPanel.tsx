import { For, Index, Show, createEffect, createMemo, createSignal } from "solid-js"
import { usePlugin, type MountedSession, type SetupContext } from "@opencode/plugin/gui"
import { GitIpc } from "./contract.ts"
import type { definition } from "./definition.ts"
import type { DiffResult, Snapshot, StatusFile } from "../git/service.ts"
import type { GraphRow } from "../git/graph.ts"

type View = "changes" | "graph"

interface SelectedFile {
  readonly path: string
  readonly oldPath?: string
  readonly staged: boolean
  readonly untracked: boolean
}

const palette = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

export function GitPanel(props: { session: MountedSession }) {
  const ctx = usePlugin<typeof definition>()
  const client = ctx.main(GitIpc)
  const desktop = () => ctx.app.platform === "desktop"

  const [view, setView] = createSignal<View>("changes")
  const [snapshot, setSnapshot] = createSignal<Snapshot | null>(null)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [notice, setNotice] = createSignal<string | null>(null)
  const [allBranches, setAllBranches] = createSignal(false)
  const [limit, setLimit] = createSignal(120)
  const [busy, setBusy] = createSignal<string | null>(null)
  const [draft, setDraft] = createSignal("")
  const [amend, setAmend] = createSignal(false)
  const [selected, setSelected] = createSignal<SelectedFile | null>(null)
  const [diff, setDiff] = createSignal<DiffResult | null>(null)
  const [diffLoading, setDiffLoading] = createSignal(false)
  const [revision, setRevision] = createSignal(0)

  let loadToken = 0
  let diffToken = 0
  let lastDirectory = ""

  const staged = createMemo(() => snapshot()?.files.filter(isStaged) ?? [])
  const unstaged = createMemo(() => snapshot()?.files.filter(isUnstaged) ?? [])
  const changeCount = createMemo(() => new Set([...staged(), ...unstaged()].map((file) => file.path)).size)
  const repo = createMemo(() => snapshot()?.repo ?? null)

  const load = async (directory: string, all: boolean, max: number, clearError = true) => {
    if (!desktop()) return
    const token = ++loadToken
    setLoading(true)
    if (clearError) setError(null)

    try {
      const next = await client.snapshot(
        { directory, allBranches: all, limit: max },
        { signal: ctx.signal },
      )
      if (token !== loadToken) return

      setSnapshot(next)

      const current = selected()
      if (current) {
        const present = next.files.some((file) =>
          file.path === current.path && (current.staged ? isStaged(file) : isUnstaged(file)),
        )
        if (!present) {
          setSelected(null)
          setDiff(null)
        }
      }
    } catch (cause) {
      if (token !== loadToken || ctx.signal.aborted) return
      setError(message(cause))
    } finally {
      if (token === loadToken) setLoading(false)
    }
  }

  const loadDiff = async (target: SelectedFile | null) => {
    const token = ++diffToken
    if (!target || !desktop()) {
      setDiff(null)
      setDiffLoading(false)
      return
    }

    setDiffLoading(true)
    try {
      const next = await client.diff(
        {
          directory: props.session.directory,
          path: target.path,
          oldPath: target.oldPath,
          staged: target.staged,
          untracked: target.untracked,
        },
        { signal: ctx.signal },
      )
      if (token !== diffToken) return
      setDiff(next)
    } catch (cause) {
      if (token !== diffToken || ctx.signal.aborted) return
      setDiff({ text: message(cause), truncated: false, binary: false })
    } finally {
      if (token === diffToken) setDiffLoading(false)
    }
  }

  const refresh = (clearError = true) => load(props.session.directory, allBranches(), limit(), clearError)

  const run = async (name: string, action: () => Promise<void>) => {
    if (busy()) return
    setBusy(name)
    setError(null)
    setNotice(null)

    try {
      await action()
    } catch (cause) {
      setError(message(cause))
    } finally {
      await refresh(false)
      setRevision((value) => value + 1)
      setBusy(null)
    }
  }

  const stage = (paths: readonly string[]) =>
    run("stage", async () => {
      await client.stage({ directory: props.session.directory, paths }, { signal: ctx.signal })
    })

  const unstage = (paths: readonly string[]) =>
    run("unstage", async () => {
      await client.unstage({ directory: props.session.directory, paths }, { signal: ctx.signal })
    })

  const stageAll = () => stage(unstaged().flatMap(filePaths))
  const unstageAll = () => unstage(staged().flatMap(filePaths))

  const commit = () =>
    run("commit", async () => {
      const text = draft().trim()
      if (!text) throw new Error(ctx.t("error.messageRequired"))

      const result = await client.commit(
        { directory: props.session.directory, message: text, amend: amend() },
        { signal: ctx.signal },
      )
      setDraft("")
      setAmend(false)
      setNotice(ctx.t("notice.committed", { hash: result.hash }))
    })

  const choose = (file: StatusFile, isStagedRow: boolean) => {
    setDiff(null)
    setSelected({
      path: file.path,
      oldPath: file.oldPath,
      staged: isStagedRow,
      untracked: file.untracked && !isStagedRow,
    })
  }

  createEffect(() => {
    const directory = props.session.directory
    const all = allBranches()
    const max = limit()
    if (!desktop()) return
    if (directory !== lastDirectory) {
      lastDirectory = directory
      setSnapshot(null)
      setSelected(null)
      setDiff(null)
    }
    void load(directory, all, max)
  })

  createEffect(() => {
    revision()
    const target = selected()
    void loadDiff(target)
  })

  return (
    <div class="ocgit-panel">
      <div class="ocgit-header">
        <div class="ocgit-branch">
          <span class="ocgit-branch-icon">
            <BranchIcon />
          </span>
          <Show when={repo()} fallback={<span class="ocgit-branch-name">{ctx.t("panel.title")}</span>}>
            {(current) => (
              <>
                <span class="ocgit-branch-name" title={current().root}>
                  {current().branch}
                </span>
                <Show when={current().detached}>
                  <span class="ocgit-detached">{ctx.t("label.detached")}</span>
                </Show>
              </>
            )}
          </Show>
        </div>
        <button
          class="ocgit-icon-button"
          type="button"
          title={ctx.t("action.refresh")}
          aria-label={ctx.t("action.refresh")}
          disabled={!desktop() || loading() || !!busy()}
          onClick={() => void refresh()}
        >
          ↻
        </button>
      </div>

      <div class="ocgit-tabs">
        <button
          class={`ocgit-tab${view() === "changes" ? " active" : ""}`}
          type="button"
          onClick={() => setView("changes")}
        >
          {ctx.t("view.changes")}
          <span class="ocgit-tab-count">{changeCount()}</span>
        </button>
        <button
          class={`ocgit-tab${view() === "graph" ? " active" : ""}`}
          type="button"
          onClick={() => setView("graph")}
        >
          {ctx.t("view.graph")}
        </button>
      </div>

      <Show when={error()}>
        <div class="ocgit-banner error">
          <div class="ocgit-banner-text">{error()}</div>
          <button class="ocgit-icon-button" type="button" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      </Show>

      <Show when={notice()}>
        <div class="ocgit-banner notice">
          <div class="ocgit-banner-text">{notice()}</div>
          <button class="ocgit-icon-button" type="button" onClick={() => setNotice(null)}>
            ×
          </button>
        </div>
      </Show>

      <Show when={desktop()} fallback={<EmptyState title={ctx.t("state.desktopOnly")} />}>
        <Show when={snapshot()} fallback={<EmptyState title={error() ? ctx.t("state.error") : ctx.t("state.loading")} />}>
          {(current) => (
            <Show
              when={current().repo}
              fallback={
                <EmptyState title={ctx.t("state.notRepo")} hint={ctx.t("state.notRepoHint")} />
              }
            >
              <Show
                when={view() === "changes"}
                fallback={
                  <GraphView
                    commits={current().commits}
                    maxLanes={current().maxLanes}
                    hasMore={current().hasMore}
                    allBranches={allBranches()}
                    onAllBranches={setAllBranches}
                    onLoadMore={() => setLimit((value) => value + 120)}
                  />
                }
              >
                <div class="ocgit-changes">
                  <div class="ocgit-commit-box">
                    <textarea
                      class="ocgit-message"
                      rows={3}
                      value={draft()}
                      placeholder={ctx.t("placeholder.message")}
                      disabled={!!busy()}
                      onInput={(event) => setDraft(event.currentTarget.value)}
                      onKeyDown={(event) => {
                        if (event.isComposing) return
                        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                          event.preventDefault()
                          void commit()
                        }
                      }}
                    />
                    <div class="ocgit-commit-actions">
                      <label class="ocgit-check">
                        <input
                          type="checkbox"
                          checked={amend()}
                          disabled={!!busy()}
                          onChange={(event) => setAmend(event.currentTarget.checked)}
                        />
                        {ctx.t("action.amend")}
                      </label>
                      <button
                        class="ocgit-button primary"
                        type="button"
                        disabled={!!busy() || !draft().trim() || (staged().length === 0 && !amend())}
                        onClick={() => void commit()}
                      >
                        {busy() === "commit" ? ctx.t("action.committing") : ctx.t("action.commit")}
                      </button>
                    </div>
                    <div class="ocgit-note">{ctx.t("hint.commit")}</div>
                  </div>

                  <div class="ocgit-changes-scroll">
                    <Show
                      when={staged().length > 0 || unstaged().length > 0}
                      fallback={<EmptyState title={ctx.t("state.clean")} />}
                    >
                      <Show when={staged().length > 0}>
                        <div class="ocgit-section">
                          <div class="ocgit-section-head">
                            <span>{ctx.t("section.staged", { count: staged().length })}</span>
                            <button
                              class="ocgit-button subtle"
                              type="button"
                              disabled={!!busy()}
                              onClick={() => void unstageAll()}
                            >
                              {ctx.t("action.unstageAll")}
                            </button>
                          </div>
                          <For each={staged()}>
                            {(file) => (
                              <FileRow
                                file={file}
                                staged
                                busy={!!busy()}
                                selected={isSelected(selected(), file, true)}
                                onSelect={() => choose(file, true)}
                                onToggle={() => void unstage(filePaths(file))}
                              />
                            )}
                          </For>
                        </div>
                      </Show>

                      <Show when={unstaged().length > 0}>
                        <div class="ocgit-section">
                          <div class="ocgit-section-head">
                            <span>{ctx.t("section.unstaged", { count: unstaged().length })}</span>
                            <button
                              class="ocgit-button subtle"
                              type="button"
                              disabled={!!busy()}
                              onClick={() => void stageAll()}
                            >
                              {ctx.t("action.stageAll")}
                            </button>
                          </div>
                          <For each={unstaged()}>
                            {(file) => (
                              <FileRow
                                file={file}
                                staged={false}
                                busy={!!busy()}
                                selected={isSelected(selected(), file, false)}
                                onSelect={() => choose(file, false)}
                                onToggle={() => void stage(filePaths(file))}
                              />
                            )}
                          </For>
                        </div>
                      </Show>
                    </Show>
                  </div>

                  <Show when={selected()}>
                    {(target) => (
                      <DiffView
                        target={target()}
                        diff={diff()}
                        loading={diffLoading()}
                        onClose={() => setSelected(null)}
                      />
                    )}
                  </Show>
                </div>
              </Show>
            </Show>
          )}
        </Show>
      </Show>
    </div>
  )
}

function FileRow(props: {
  file: StatusFile
  staged: boolean
  selected: boolean
  busy: boolean
  onSelect: () => void
  onToggle: () => void
}) {
  const ctx = usePlugin<typeof definition>()
  const char = () => (props.file.untracked ? "?" : props.staged ? props.file.index : props.file.worktree)
  const display = () => (char() === " " ? "M" : char())
  const label = () => (props.file.oldPath ? `${props.file.oldPath} → ${props.file.path}` : props.file.path)

  return (
    <div
      class={`ocgit-file${props.selected ? " selected" : ""}`}
      role="button"
      tabindex="0"
      title={label()}
      onClick={props.onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          props.onSelect()
        }
      }}
    >
      <span class={`ocgit-status ${statusClass(display())}`}>{display()}</span>
      <span class="ocgit-file-path">{props.file.path}</span>
      <button
        class="ocgit-icon-button"
        type="button"
        disabled={props.busy}
        title={ctx.t(props.staged ? "action.unstage" : "action.stage", { path: props.file.path })}
        aria-label={ctx.t(props.staged ? "action.unstage" : "action.stage", { path: props.file.path })}
        onClick={(event) => {
          event.stopPropagation()
          props.onToggle()
        }}
      >
        {props.staged ? "−" : "+"}
      </button>
    </div>
  )
}

function DiffView(props: {
  target: SelectedFile
  diff: DiffResult | null
  loading: boolean
  onClose: () => void
}) {
  const ctx = usePlugin<typeof definition>()
  const text = () => props.diff?.text ?? ""
  const title = () =>
    props.target.oldPath ? `${props.target.oldPath} → ${props.target.path}` : props.target.path

  return (
    <div class="ocgit-diff">
      <div class="ocgit-diff-head">
        <span class="ocgit-diff-title" title={props.target.path}>
          {title()}
        </span>
        <button
          class="ocgit-icon-button"
          type="button"
          title={ctx.t("action.closeDiff")}
          aria-label={ctx.t("action.closeDiff")}
          onClick={props.onClose}
        >
          ×
        </button>
      </div>
      <Show
        when={!props.loading}
        fallback={<div class="ocgit-empty">{ctx.t("state.loading")}</div>}
      >
        <Show
          when={props.diff?.binary}
          fallback={
            <Show
              when={text()}
              fallback={<div class="ocgit-empty">{ctx.t("state.noDiff")}</div>}
            >
              <div class="ocgit-diff-body">
                <Index each={text().split("\n")}>
                  {(line) => <div class={diffLineClass(line())}>{line() || " "}</div>}
                </Index>
              </div>
              <Show when={props.diff?.truncated}>
                <div class="ocgit-note">{ctx.t("label.truncated")}</div>
              </Show>
            </Show>
          }
        >
          <div class="ocgit-empty">{ctx.t("label.binary")}</div>
        </Show>
      </Show>
    </div>
  )
}

function GraphView(props: {
  commits: readonly GraphRow[]
  maxLanes: number
  hasMore: boolean
  allBranches: boolean
  onAllBranches: (value: boolean) => void
  onLoadMore: () => void
}) {
  const ctx = usePlugin<typeof definition>()

  return (
    <>
      <div class="ocgit-graph-head">
        <label class="ocgit-check">
          <input
            type="checkbox"
            checked={props.allBranches}
            onChange={(event) => props.onAllBranches(event.currentTarget.checked)}
          />
          {ctx.t("label.allBranches")}
        </label>
        <span class="ocgit-graph-count">
          {ctx.t("label.commits", { count: props.commits.length })}
        </span>
      </div>
      <div class="ocgit-graph-scroll">
        <Show
          when={props.commits.length > 0}
          fallback={<EmptyState title={ctx.t("state.noCommits")} />}
        >
          <For each={props.commits}>
            {(commit) => <CommitRow commit={commit} maxLanes={props.maxLanes} />}
          </For>
        </Show>
        <Show when={props.hasMore}>
          <button class="ocgit-load-more" type="button" onClick={props.onLoadMore}>
            {ctx.t("action.loadMore")}
          </button>
        </Show>
      </div>
    </>
  )
}

function CommitRow(props: { commit: GraphRow; maxLanes: number }) {
  const ctx = usePlugin<typeof definition>()
  const height = 54
  const center = 27
  const gap = () => (props.maxLanes > 12 ? Math.max(4, Math.floor(132 / props.maxLanes)) : 12)
  const width = () => Math.max(24, props.maxLanes * gap() + 16)
  const x = (lane: number) => 8 + lane * gap()
  const color = (lane: number) => palette[lane % palette.length]
  const lanes = createMemo(() => {
    const set = new Set<number>([
      ...props.commit.before,
      ...props.commit.after,
      props.commit.lane,
      ...props.commit.parentLanes,
    ])
    return [...set].sort((left, right) => left - right)
  })
  const time = () => relativeTime(props.commit.timestamp, ctx)
  const fullTime = () => new Date(props.commit.timestamp * 1000).toLocaleString()

  return (
    <div
      class="ocgit-commit"
      title={`${props.commit.subject}\n${props.commit.hash}\n${props.commit.author} <${props.commit.email}>\n${fullTime()}`}
    >
      <div class="ocgit-graph-col" style={{ width: `${width()}px` }}>
        <svg width={width()} height={height} aria-hidden="true">
          <For each={lanes()}>
            {(lane) => (
              <>
                <Show when={props.commit.before.includes(lane)}>
                  <line
                    x1={x(lane)}
                    y1="0"
                    x2={x(lane)}
                    y2={
                      lane === props.commit.lane || !props.commit.after.includes(lane)
                        ? center
                        : height
                    }
                    stroke={color(lane)}
                    stroke-width="1.5"
                  />
                </Show>
                <Show
                  when={lane === props.commit.lane && props.commit.after.includes(lane)}
                >
                  <line
                    x1={x(lane)}
                    y1={center}
                    x2={x(lane)}
                    y2={height}
                    stroke={color(lane)}
                    stroke-width="1.5"
                  />
                </Show>
                <Show
                  when={
                    !props.commit.before.includes(lane) &&
                    props.commit.after.includes(lane) &&
                    lane !== props.commit.lane &&
                    !props.commit.parentLanes.includes(lane)
                  }
                >
                  <line
                    x1={x(lane)}
                    y1={center}
                    x2={x(lane)}
                    y2={height}
                    stroke={color(lane)}
                    stroke-width="1.5"
                  />
                </Show>
              </>
            )}
          </For>

          <For each={props.commit.parentLanes}>
            {(parent) => (
              <Show when={parent !== props.commit.lane}>
                <path
                  d={`M ${x(props.commit.lane)} ${center} C ${x(props.commit.lane)} ${center + 12}, ${x(parent)} ${height - 12}, ${x(parent)} ${height}`}
                  fill="none"
                  stroke={color(parent)}
                  stroke-width="1.5"
                />
              </Show>
            )}
          </For>

          <circle
            cx={x(props.commit.lane)}
            cy={center}
            r="4.5"
            fill={color(props.commit.lane)}
            opacity="0.2"
          />
          <circle
            cx={x(props.commit.lane)}
            cy={center}
            r="3.2"
            fill="none"
            stroke={color(props.commit.lane)}
            stroke-width="2"
          />
        </svg>
      </div>

      <div class="ocgit-commit-info">
        <div class="ocgit-commit-subject">{props.commit.subject || "(no subject)"}</div>
        <Show when={props.commit.refs.length > 0}>
          <div class="ocgit-commit-refs">
            <For each={props.commit.refs.slice(0, 4)}>
              {(ref) => <span class={`ocgit-ref ${refKind(ref)}`}>{refLabel(ref)}</span>}
            </For>
            <Show when={props.commit.refs.length > 4}>
              <span class="ocgit-ref more">+{props.commit.refs.length - 4}</span>
            </Show>
          </div>
        </Show>
        <div class="ocgit-commit-meta">
          <span>{props.commit.author}</span>
          <span>{time()}</span>
          <span class="ocgit-mono">{props.commit.shortHash}</span>
        </div>
      </div>
    </div>
  )
}

function BranchIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="4" cy="3" r="1.6" />
      <circle cx="4" cy="13" r="1.6" />
      <circle cx="12" cy="6" r="1.6" />
      <path d="M4 4.6v6.8" />
      <path d="M12 7.6c0 2.2-2 3-4.5 3H4" />
    </svg>
  )
}

function EmptyState(props: { title: string; hint?: string }) {  return (
    <div class="ocgit-empty">
      <div class="ocgit-empty-title">{props.title}</div>
      <Show when={props.hint}>
        <div class="ocgit-empty-hint">{props.hint}</div>
      </Show>
    </div>
  )
}

function isStaged(file: StatusFile): boolean {
  return !file.untracked && file.index !== " " && file.index !== "?"
}

function isUnstaged(file: StatusFile): boolean {
  return file.untracked || (file.worktree !== " " && file.worktree !== "?")
}

function isSelected(selected: SelectedFile | null, file: StatusFile, staged: boolean): boolean {
  return selected?.path === file.path && selected.staged === staged
}

function filePaths(file: StatusFile): string[] {
  return file.oldPath ? [file.oldPath, file.path] : [file.path]
}

function statusClass(char: string): string {
  switch (char) {
    case "A":
      return "add"
    case "D":
      return "del"
    case "R":
    case "C":
      return "rename"
    case "U":
      return "conflict"
    case "?":
      return "untracked"
    default:
      return "mod"
  }
}

function diffLineClass(line: string): string {
  if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("diff ")) {
    return "ocgit-diff-line meta"
  }
  if (line.startsWith("@@")) return "ocgit-diff-line hunk"
  if (line.startsWith("+")) return "ocgit-diff-line add"
  if (line.startsWith("-")) return "ocgit-diff-line del"
  return "ocgit-diff-line"
}

function refKind(ref: string): string {
  if (ref === "HEAD" || ref.startsWith("HEAD -> ")) return "head"
  if (ref.startsWith("tag: ")) return "tag"
  if (/^(origin|upstream)\//.test(ref)) return "remote"
  return "branch"
}

function refLabel(ref: string): string {
  if (ref.startsWith("tag: ")) return ref.slice(5)
  if (ref.startsWith("HEAD -> ")) return "HEAD"
  return ref
}

function relativeTime(timestamp: number, ctx: SetupContext<typeof definition>): string {
  const seconds = Math.max(0, Math.floor(Date.now() / 1000) - timestamp)
  if (seconds < 60) return ctx.t("time.justNow")

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return ctx.t("time.minutes", { count: minutes })

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return ctx.t("time.hours", { count: hours })

  const days = Math.floor(hours / 24)
  if (days < 30) return ctx.t("time.days", { count: days })

  return new Date(timestamp * 1000).toLocaleDateString()
}

function message(value: unknown): string {
  return value instanceof Error ? value.message : String(value)
}
