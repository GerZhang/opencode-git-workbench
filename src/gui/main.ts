import type { Plugin } from "@opencode/plugin/gui"
import { GitIpc } from "./contract.ts"
import * as git from "../git/service.ts"

export const main: Plugin.MainSetup = (ctx) => {
  ctx.provide(GitIpc, {
    snapshot: (input) => git.snapshot(input),
    diff: (input) => git.diff(input),
    stage: (input) => git.stage(input),
    unstage: (input) => git.unstage(input),
    commit: (input) => git.commit(input),
  })

  ctx.log.write("info", "opencode-git-workbench ready", { version: ctx.app.version })
}
