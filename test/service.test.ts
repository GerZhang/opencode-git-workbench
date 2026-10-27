import { strict as assert } from "node:assert"
import { execFileSync } from "node:child_process"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { after, before, test } from "node:test"
import { layoutGraph, type RawCommit } from "../src/git/graph.ts"
import { commit, diff, snapshot, stage, unstage } from "../src/git/service.ts"

let repo = ""

before(async () => {
  repo = await mkdtemp(path.join(tmpdir(), "git-workbench-"))
  git(["init", "-q", "-b", "main"])
  git(["config", "user.email", "test@example.com"])
  git(["config", "user.name", "Test User"])
  await writeFile(path.join(repo, "a.txt"), "one\n")
  await writeFile(path.join(repo, "b.txt"), "two\n")
  git(["add", "."])
  git(["commit", "-qm", "initial"])
})

after(async () => {
  if (repo) await rm(repo, { recursive: true, force: true })
})

test("snapshot reads branch, status, and graph", async () => {
  await writeFile(path.join(repo, "b.txt"), "two\nthree\n")
  await writeFile(path.join(repo, "d.txt"), "new\n")
  git(["mv", "a.txt", "c.txt"])

  const result = await snapshot({ directory: repo, allBranches: false, limit: 20 })

  assert.ok(result.repo)
  assert.equal(result.repo.branch, "main")
  assert.equal(result.repo.detached, false)
  assert.equal(result.repo.head?.length, 40)
  assert.equal(result.commits.length, 1)
  assert.equal(result.commits[0].subject, "initial")
  assert.equal(result.maxLanes, 1)
  assert.equal(result.hasMore, false)

  const file = (name: string) => result.files.find((entry) => entry.path === name)
  assert.equal(file("b.txt")?.worktree, "M")
  assert.equal(file("c.txt")?.index, "R")
  assert.equal(file("c.txt")?.oldPath, "a.txt")
  assert.equal(file("d.txt")?.untracked, true)
})

test("diff renders unstaged, staged, and untracked changes", async () => {
  const unstaged = await diff({ directory: repo, path: "b.txt", staged: false, untracked: false })
  assert.match(unstaged.text, /\+three/)

  const untracked = await diff({ directory: repo, path: "d.txt", staged: false, untracked: true })
  assert.match(untracked.text, /new file mode/)
  assert.match(untracked.text, /\+new/)

  const staged = await diff({ directory: repo, path: "c.txt", oldPath: "a.txt", staged: true, untracked: false })
  assert.match(staged.text, /rename from a\.txt|similarity index/)
})

test("stage and unstage move a file between sections", async () => {
  await stage({ directory: repo, paths: ["d.txt"] })
  let result = await snapshot({ directory: repo, allBranches: false, limit: 20 })
  assert.equal(result.files.find((entry) => entry.path === "d.txt")?.index, "A")

  await unstage({ directory: repo, paths: ["d.txt"] })
  result = await snapshot({ directory: repo, allBranches: false, limit: 20 })
  assert.equal(result.files.find((entry) => entry.path === "d.txt")?.untracked, true)
})

test("unstage restores both sides of a rename", async () => {
  await unstage({ directory: repo, paths: ["a.txt", "c.txt"] })
  const result = await snapshot({ directory: repo, allBranches: false, limit: 20 })
  assert.equal(result.files.find((entry) => entry.path === "a.txt")?.worktree, "D")
  assert.equal(result.files.find((entry) => entry.path === "c.txt")?.untracked, true)

  await stage({ directory: repo, paths: ["a.txt", "c.txt"] })
})

test("unstage works before the first commit", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "git-workbench-empty-"))
  try {
    execFileSync("git", ["init", "-q", "-b", "main"], { cwd: directory })
    await writeFile(path.join(directory, "a.txt"), "one\n")
    execFileSync("git", ["add", "a.txt"], { cwd: directory })

    await unstage({ directory, paths: ["a.txt"] })
    const result = await snapshot({ directory, allBranches: false, limit: 20 })
    assert.equal(result.repo?.head, null)
    assert.equal(result.files[0]?.path, "a.txt")
    assert.equal(result.files[0]?.untracked, true)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test("commit records the staged state and leaves the tree clean", async () => {
  await stage({ directory: repo, paths: ["b.txt", "c.txt"] })
  const created = await commit({ directory: repo, message: "update b and rename a", amend: false })
  assert.equal(created.subject, "update b and rename a")
  assert.ok(created.hash)

  const result = await snapshot({ directory: repo, allBranches: false, limit: 20 })
  assert.equal(result.files.length, 1)
  assert.equal(result.files[0].path, "d.txt")
  assert.equal(result.commits.length, 2)
  assert.equal(result.commits[0].subject, "update b and rename a")
})

test("commit can amend the last commit without staged changes", async () => {
  const result = await commit({ directory: repo, message: "amended message", amend: true })
  assert.equal(result.subject, "amended message")

  const snapshotResult = await snapshot({ directory: repo, allBranches: false, limit: 20 })
  assert.equal(snapshotResult.commits[0].subject, "amended message")
})

test("all branches includes another branch", async () => {
  git(["checkout", "-qb", "feature"])
  await writeFile(path.join(repo, "feature.txt"), "feature\n")
  git(["add", "feature.txt"])
  git(["commit", "-qm", "feature work"])
  git(["checkout", "-q", "main"])

  const current = await snapshot({ directory: repo, allBranches: false, limit: 20 })
  assert.equal(current.commits.some((entry) => entry.subject === "feature work"), false)

  const all = await snapshot({ directory: repo, allBranches: true, limit: 20 })
  assert.equal(all.commits.some((entry) => entry.subject === "feature work"), true)
})

test("graph layout keeps a merge on two lanes and rejoins at the base", () => {
  const commits: RawCommit[] = [
    commitRow("m", ["a", "b"]),
    commitRow("a", ["c"]),
    commitRow("b", ["c"]),
    commitRow("c", []),
  ]

  const layout = layoutGraph(commits)

  assert.equal(layout.maxLanes, 2)
  assert.deepEqual(layout.rows[0], {
    ...commits[0],
    lane: 0,
    before: [0],
    after: [0, 1],
    parentLanes: [0, 1],
  })
  assert.deepEqual(layout.rows[2].lane, 1)
  assert.deepEqual(layout.rows[2].parentLanes, [0])
  assert.deepEqual(layout.rows[2].after, [0])
  assert.deepEqual(layout.rows[3].lane, 0)
  assert.deepEqual(layout.rows[3].after, [])
})

test("graph layout stacks disconnected roots", () => {
  const layout = layoutGraph([commitRow("x", []), commitRow("y", [])])

  assert.equal(layout.maxLanes, 1)
  assert.deepEqual(layout.rows[0].after, [])
  assert.deepEqual(layout.rows[1].before, [0])
  assert.deepEqual(layout.rows[1].after, [])
})

function commitRow(hash: string, parents: string[]): RawCommit {
  return {
    hash,
    shortHash: hash,
    parents,
    author: "Test",
    email: "test@example.com",
    timestamp: 0,
    refs: [],
    subject: hash,
  }
}

function git(args: string[]): void {
  execFileSync("git", args, { cwd: repo, stdio: "pipe" })
}
