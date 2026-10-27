import { Schema } from "effect"
import { Ipc } from "@opencode/plugin/gui"

const RepoInfo = Schema.Struct({
  root: Schema.String,
  branch: Schema.String,
  detached: Schema.Boolean,
  head: Schema.NullOr(Schema.String),
})

const StatusFile = Schema.Struct({
  path: Schema.String,
  oldPath: Schema.optional(Schema.String),
  index: Schema.String,
  worktree: Schema.String,
  untracked: Schema.Boolean,
  conflicted: Schema.Boolean,
})

const GraphCommit = Schema.Struct({
  hash: Schema.String,
  shortHash: Schema.String,
  parents: Schema.Array(Schema.String),
  author: Schema.String,
  email: Schema.String,
  timestamp: Schema.Number,
  refs: Schema.Array(Schema.String),
  subject: Schema.String,
  lane: Schema.Number,
  before: Schema.Array(Schema.Number),
  after: Schema.Array(Schema.Number),
  parentLanes: Schema.Array(Schema.Number),
})

const Snapshot = Schema.Struct({
  repo: Schema.NullOr(RepoInfo),
  files: Schema.Array(StatusFile),
  commits: Schema.Array(GraphCommit),
  maxLanes: Schema.Number,
  hasMore: Schema.Boolean,
})

const DiffResult = Schema.Struct({
  text: Schema.String,
  truncated: Schema.Boolean,
  binary: Schema.Boolean,
})

const CommitResult = Schema.Struct({
  hash: Schema.String,
  subject: Schema.String,
})

export const GitIpc = Ipc.define({
  id: "git-workbench.git",
  methods: {
    snapshot: {
      input: Schema.Struct({
        directory: Schema.String,
        allBranches: Schema.Boolean,
        limit: Schema.Number,
      }),
      output: Snapshot,
    },
    diff: {
      input: Schema.Struct({
        directory: Schema.String,
        path: Schema.String,
        oldPath: Schema.optional(Schema.String),
        staged: Schema.Boolean,
        untracked: Schema.Boolean,
      }),
      output: DiffResult,
    },
    stage: {
      input: Schema.Struct({
        directory: Schema.String,
        paths: Schema.Array(Schema.String),
      }),
    },
    unstage: {
      input: Schema.Struct({
        directory: Schema.String,
        paths: Schema.Array(Schema.String),
      }),
    },
    commit: {
      input: Schema.Struct({
        directory: Schema.String,
        message: Schema.String,
        amend: Schema.Boolean,
      }),
      output: CommitResult,
    },
  },
})
