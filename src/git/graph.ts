export interface RawCommit {
  readonly hash: string
  readonly shortHash: string
  readonly parents: readonly string[]
  readonly author: string
  readonly email: string
  readonly timestamp: number
  readonly refs: readonly string[]
  readonly subject: string
}

export interface GraphRow extends RawCommit {
  /** Lane the commit node sits in. */
  readonly lane: number
  /** Lanes that carry a line into this row. */
  readonly before: readonly number[]
  /** Lanes that carry a line out of this row. */
  readonly after: readonly number[]
  /** Lane each parent continues in, in parent order. */
  readonly parentLanes: readonly number[]
}

export interface GraphLayout {
  readonly rows: readonly GraphRow[]
  readonly maxLanes: number
}

/**
 * Lays out a git log in lanes. The log must be in topological order, with every
 * commit before its parents.
 *
 * Each lane holds the hash of the commit it is waiting for. A commit takes the
 * lane waiting for it, then hands that lane to its first parent. Extra parents
 * open a new lane, or join one that already waits for the same parent.
 */
export function layoutGraph(commits: readonly RawCommit[]): GraphLayout {
  let lanes: (string | null)[] = []
  const rows: GraphRow[] = []
  let maxLanes = 0

  for (const commit of commits) {
    const beforeHashes = lanes.slice()
    let lane = beforeHashes.indexOf(commit.hash)

    if (lane === -1) {
      const free = beforeHashes.indexOf(null)
      if (free === -1) {
        lane = beforeHashes.length
        beforeHashes.push(commit.hash)
      } else {
        lane = free
        beforeHashes[lane] = commit.hash
      }
    }

    const afterHashes = beforeHashes.slice()
    afterHashes[lane] = null

    const parentLanes: number[] = []
    for (let index = 0; index < commit.parents.length; index += 1) {
      const parent = commit.parents[index]
      let target = afterHashes.indexOf(parent)

      if (target === -1) {
        if (index === 0 && afterHashes[lane] === null) {
          target = lane
        } else {
          target = afterHashes.indexOf(null, lane + 1)
          if (target === -1) target = afterHashes.indexOf(null)
          if (target === -1) {
            target = afterHashes.length
            afterHashes.push(null)
          }
        }
        afterHashes[target] = parent
      }

      parentLanes.push(target)
    }

    const before = activeLanes(beforeHashes)
    const after = activeLanes(afterHashes)
    rows.push({ ...commit, lane, before, after, parentLanes })

    for (const index of [...before, ...after, lane, ...parentLanes]) {
      maxLanes = Math.max(maxLanes, index + 1)
    }

    lanes = afterHashes
    while (lanes.length > 0 && lanes[lanes.length - 1] === null) lanes.pop()
  }

  return { rows, maxLanes }
}

function activeLanes(lanes: readonly (string | null)[]): number[] {
  const active: number[] = []
  for (let index = 0; index < lanes.length; index += 1) {
    if (lanes[index] !== null) active.push(index)
  }
  return active
}
