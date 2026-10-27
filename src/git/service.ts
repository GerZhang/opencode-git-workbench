import { execFile } from "node:child_process"
import { readFile, stat } from "node:fs/promises"
import path from "node:path"
import { layoutGraph, type GraphRow, type RawCommit } from "./graph.ts"

const GIT_TIMEOUT = 20_000
const COMMIT_TIMEOUT = 120_000
const MAX_BUFFER = 16 * 1024 * 1024
const MAX_DIFF_CHARS = 250_000
const MAX_DIFF_LINES = 3_000
const MAX_UNTRACKED_BYTES = 1_000_000
const LOG_FORMAT = "%H%x00%P%x00%an%x00%ae%x00%at%x00%D%x00%s%x1e"

function gitEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    GIT_TERMINAL_PROMPT: "0",
    GIT_PAGER: "cat",
    GIT_OPTIONAL_LOCKS: "0",
    LC_ALL: "C",
  }
}

export interface SnapshotInput {
  readonly directory: string
  readonly allBranches: boolean
  readonly limit: number
}

export interface StatusFile {
  readonly path: string
  readonly oldPath?: string
  readonly index: string
  readonly worktree: string
  readonly untracked: boolean
  readonly conflicted: boolean
}

export interface RepoInfo {
  readonly root: string
  readonly branch: string
  readonly detached: boolean
  readonly head: string | null
}

export interface Snapshot {
  readonly repo: RepoInfo | null
  readonly files: readonly StatusFile[]
  readonly commits: readonly GraphRow[]
  readonly maxLanes: number
  readonly hasMore: boolean
}

export interface DiffInput {
  readonly directory: string
  readonly path: string
  readonly oldPath?: string
  readonly staged: boolean
  readonly untracked: boolean
}

export interface DiffResult {
  readonly text: string
  readonly truncated: boolean
  readonly binary: boolean
}

export interface PathsInput {
  readonly directory: string
  readonly paths: readonly string[]
}

export interface CommitInput {
  readonly directory: string
  readonly message: string
  readonly amend: boolean
}

export interface CommitResult {
  readonly hash: string
  readonly subject: string
}

interface RunResult {
  readonly stdout: string
  readonly stderr: string
  readonly code: number
}

interface LogResult {
  readonly commits: readonly RawCommit[]
  readonly hasMore: boolean
}

export async function snapshot(input: SnapshotInput): Promise<Snapshot> {
  const root = await repositoryRoot(input.directory)
  if (!root) {
    return { repo: null, files: [], commits: [], maxLanes: 0, hasMore: false }
  }

  const limit = Math.max(1, Math.min(Math.trunc(input.limit) || 120, 500))
  const [info, status, log] = await Promise.all([
    headInfo(root),
    runOk(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]),
    readLog(root, input.allBranches, limit),
  ])
  const files = parseStatus(status)
  const layout = layoutGraph(log.commits)

  return {
    repo: { root, ...info },
    files,
    commits: layout.rows,
    maxLanes: layout.maxLanes,
    hasMore: log.hasMore,
  }
}

export async function diff(input: DiffInput): Promise<DiffResult> {
  const root = await requireRoot(input.directory)
  const relative = repoPath(root, input.path)

  if (input.untracked) return untrackedDiff(root, relative)

  const args = ["diff", "--no-color", "--no-ext-diff", "--unified=3"]
  if (input.staged) args.push("--cached")
  const paths = [...new Set([input.path, input.oldPath].filter((value): value is string => !!value).map((value) => repoPath(root, value)))]
  args.push("--", ...paths)

  const result = await run(root, args)
  if (result.code !== 0) throw failure(args, result)
  return limitDiff(result.stdout)
}

export async function stage(input: PathsInput): Promise<void> {
  if (input.paths.length === 0) return
  const root = await requireRoot(input.directory)
  const paths = input.paths.map((value) => repoPath(root, value))
  await runOk(root, ["add", "-A", "--", ...paths])
}

export async function unstage(input: PathsInput): Promise<void> {
  if (input.paths.length === 0) return
  const root = await requireRoot(input.directory)
  const paths = input.paths.map((value) => repoPath(root, value))

  const restore = await run(root, ["restore", "--staged", "--", ...paths])
  if (restore.code === 0) return

  // A repository without a first commit has no HEAD for `restore --staged`.
  const head = await run(root, ["rev-parse", "--verify", "HEAD"])
  if (head.code === 0) throw failure(["restore", "--staged", "--", ...paths], restore)

  const remove = await run(root, ["rm", "--cached", "--ignore-unmatch", "--", ...paths])
  if (remove.code !== 0) throw failure(["restore", "--staged", "--", ...paths], restore)
}

export async function commit(input: CommitInput): Promise<CommitResult> {
  const root = await requireRoot(input.directory)
  const message = input.message.trim()
  if (!message) throw new Error("Commit message is required")

  const args = ["commit", "-m", message]
  if (input.amend) args.push("--amend")
  await runOk(root, args, COMMIT_TIMEOUT)

  const hash = (await runOk(root, ["rev-parse", "--short", "HEAD"])).trim()
  const subject = (await runOk(root, ["log", "-1", "--pretty=%s"])).trim()
  return { hash, subject }
}

async function repositoryRoot(directory: string): Promise<string | null> {
  if (!directory || !path.isAbsolute(directory)) return null
  try {
    const result = await run(directory, ["rev-parse", "--show-toplevel"])
    if (result.code !== 0) return null
    const root = result.stdout.trim()
    return root ? path.resolve(root) : null
  } catch {
    return null
  }
}

async function requireRoot(directory: string): Promise<string> {
  const root = await repositoryRoot(directory)
  if (!root) throw new Error(`Not a Git repository: ${directory}`)
  return root
}

async function headInfo(root: string): Promise<Omit<RepoInfo, "root">> {
  const head = await run(root, ["rev-parse", "--verify", "HEAD"])
  const hash = head.code === 0 ? head.stdout.trim() : null
  const symbolic = await run(root, ["symbolic-ref", "--short", "-q", "HEAD"])

  if (symbolic.code === 0 && symbolic.stdout.trim()) {
    return { branch: symbolic.stdout.trim(), detached: false, head: hash }
  }

  return { branch: hash ? hash.slice(0, 7) : "HEAD", detached: true, head: hash }
}

async function readLog(root: string, allBranches: boolean, limit: number): Promise<LogResult> {
  const head = await run(root, ["rev-parse", "--verify", "HEAD"])
  if (head.code !== 0 && !allBranches) return { commits: [], hasMore: false }

  const args = [
    "log",
    "--topo-order",
    `--max-count=${limit + 1}`,
    "--decorate=short",
    `--pretty=format:${LOG_FORMAT}`,
  ]
  if (allBranches) {
    args.push("--exclude=refs/stash", "--exclude=refs/notes/*", "--all")
  } else {
    args.push("HEAD")
  }

  const result = await run(root, args)
  if (result.code !== 0) {
    if (!allBranches && head.code !== 0) return { commits: [], hasMore: false }
    throw failure(args, result)
  }

  const commits: RawCommit[] = []
  for (const record of result.stdout.split("\x1e")) {
    const text = record.replace(/^\n+/, "").replace(/\n+$/, "")
    if (!text) continue

    const fields = text.split("\x00")
    if (fields.length < 7) continue

    const [hash, parents, author, email, timestamp, refs, subject] = fields
    commits.push({
      hash,
      shortHash: hash.slice(0, 7),
      parents: parents ? parents.split(" ").filter(Boolean) : [],
      author,
      email,
      timestamp: Number(timestamp) || 0,
      refs: refs ? refs.split(", ").filter(Boolean) : [],
      subject,
    })
  }

  const hasMore = commits.length > limit
  return { commits: hasMore ? commits.slice(0, limit) : commits, hasMore }
}

function parseStatus(raw: string): StatusFile[] {
  const entries = raw.split("\0")
  const files: StatusFile[] = []

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]
    if (!entry) continue

    const indexStatus = entry[0]
    const worktreeStatus = entry[1]
    const filePath = entry.slice(3)
    if (!filePath) continue

    let oldPath: string | undefined
    if (indexStatus === "R" || indexStatus === "C" || worktreeStatus === "R" || worktreeStatus === "C") {
      oldPath = entries[index + 1]
      index += 1
    }

    files.push({
      path: filePath,
      oldPath,
      index: indexStatus,
      worktree: worktreeStatus,
      untracked: indexStatus === "?",
      conflicted:
        indexStatus === "U" ||
        worktreeStatus === "U" ||
        (indexStatus === "A" && worktreeStatus === "A") ||
        (indexStatus === "D" && worktreeStatus === "D"),
    })
  }

  return files
}

function repoPath(root: string, value: string): string {
  if (!value || value.includes("\0")) throw new Error("Invalid path")

  const absolute = path.isAbsolute(value) ? value : path.resolve(root, value)
  const relative = path.relative(root, absolute)
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("Path is outside the repository")
  }

  return relative.split(path.sep).join("/")
}

async function untrackedDiff(root: string, relative: string): Promise<DiffResult> {
  const absolute = path.join(root, relative)
  const info = await stat(absolute)
  if (!info.isFile()) return { text: `Not a regular file: ${relative}`, truncated: false, binary: false }
  if (info.size > MAX_UNTRACKED_BYTES) {
    return { text: `File is too large to preview (${formatBytes(info.size)}).`, truncated: true, binary: false }
  }

  const buffer = await readFile(absolute)
  if (buffer.includes(0)) return { text: `Binary file: ${relative}`, truncated: false, binary: true }

  const content = buffer.toString("utf8")
  const lines = content.split("\n").map((line) => (line.endsWith("\r") ? line.slice(0, -1) : line))
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop()

  const shown = lines.slice(0, MAX_DIFF_LINES)
  const hunk = lines.length === 0 ? "@@ -0,0 +0,0 @@" : `@@ -0,0 +1,${lines.length} @@`
  const text = [
    `diff --git a/${relative} b/${relative}`,
    "new file mode 100644",
    "--- /dev/null",
    `+++ b/${relative}`,
    hunk,
    ...shown.map((line) => `+${line}`),
  ].join("\n")

  return { text, truncated: lines.length > shown.length, binary: false }
}

function limitDiff(raw: string): DiffResult {
  const binary = /^Binary files .* differ$/m.test(raw) || raw.includes("\0")
  let text = raw
  let truncated = false

  if (text.length > MAX_DIFF_CHARS) {
    text = text.slice(0, MAX_DIFF_CHARS)
    truncated = true
  }

  const lines = text.split("\n")
  if (lines.length > MAX_DIFF_LINES) {
    text = lines.slice(0, MAX_DIFF_LINES).join("\n")
    truncated = true
  }

  return { text, truncated, binary }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function run(cwd: string, args: readonly string[], timeout = GIT_TIMEOUT): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      args,
      { cwd, env: gitEnv(), maxBuffer: MAX_BUFFER, timeout, windowsHide: true },
      (error, stdout, stderr) => {
        if (!error) {
          resolve({ stdout, stderr, code: 0 })
          return
        }

        if (error.killed) {
          reject(new Error(`git ${args[0]} timed out after ${timeout}ms`))
          return
        }

        if (typeof error.code === "number") {
          resolve({ stdout, stderr, code: error.code })
          return
        }

        reject(error)
      },
    )
  })
}

async function runOk(cwd: string, args: readonly string[], timeout = GIT_TIMEOUT): Promise<string> {
  const result = await run(cwd, args, timeout)
  if (result.code !== 0) throw failure(args, result)
  return result.stdout
}

function failure(args: readonly string[], result: RunResult): Error {
  const detail = (result.stderr || result.stdout).trim().slice(0, 4_000)
  return new Error(detail || `git ${args[0] ?? ""} exited with code ${result.code}`)
}
