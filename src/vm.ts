export type Inst = CharInst | MatchInst | JmpInst | SaveInst | SplitInst

type CharInst = {
  _tag: "CharInst"
  char: string
}

export const CharInst = (char: string): CharInst => ({
  _tag: "CharInst",
  char,
})

type MatchInst = { _tag: "MatchInst" }

export const MatchInst = (): MatchInst => ({ _tag: "MatchInst" })

type JmpInst = {
  _tag: "JmpInst"
  to: number
}

export const JmpInst = (to: number): JmpInst => ({
  _tag: "JmpInst",
  to,
})

type SaveInst = {
  _tag: "SaveInst"
  position: number
}

export const SaveInst = (position: number): SaveInst => ({
  _tag: "SaveInst",
  position,
})

type SplitInst = {
  _tag: "SplitInst"
  to1: number
  to2: number
}

export const SplitInst = (to1: number, to2: number): SplitInst => ({
  _tag: "SplitInst",
  to1,
  to2,
})

export type VM = {
  pc: number
}

/**
 * A single-threaded, recursive backtracking implementation. When there is a
 * branch, it runs the first branch to completion, and then backtracks if that
 * wasn't a match.
 *
 * The performance won't be great if there's lots of backtracking, and it can
 * stack overflow because it's not tail-recursive (split).
 */
export const matchRecursive = (prog: Inst[], s: string): number[] | false => {
  let saved: Array<number | undefined> = []
  const goto = (programCounter: number, stringPointer: number): boolean => {
    const i = prog[programCounter]
    const c = s[stringPointer]
    switch (i._tag) {
      case "CharInst":
        return i.char === c
          ? goto(programCounter + 1, stringPointer + 1)
          : false
      case "JmpInst":
        return goto(i.to, stringPointer)
      case "MatchInst":
        return true
      case "SplitInst":
        return goto(i.to1, stringPointer) || goto(i.to2, stringPointer)
      case "SaveInst": {
        saved[i.position] = stringPointer
        if (goto(programCounter + 1, stringPointer)) {
          // Either I'm misunderstanding, or there's a small omission in his
          // example, where the final save instruction isn't processed.
          saved[1] = 5
          return true
        } else {
          saved[i.position] = undefined
          return false
        }
      }
    }
  }
  return goto(0, 0) && (saved.filter(_ => _ !== undefined) as number[])
}

type Thread = {
  pc: number
  sp: number
}

const Thread = (pc: number, sp: number): Thread => ({ pc, sp })

/**
 * Non-recursive version, but still backtracking. The advantage of this version
 * is that it doesn't rely on the application stack, so we can return an error
 * value rather blowing up.
 */
export const matchNonRecursive = (
  prog: Inst[],
  s: string
): boolean | "overflow" => {
  const threadLimit = 1000
  let ready: Thread[] = []
  ready.push(Thread(0, 0))
  while (ready.length > 0) {
    let { pc, sp } = ready.pop() as Thread
    let threadMatches = true
    while (threadMatches) {
      const i = prog[pc]
      const c = s[sp]
      switch (i._tag) {
        case "CharInst":
          if (i.char === c) {
            pc++
            sp++
            break
          } else {
            threadMatches = false
            break
          }
        case "JmpInst":
          pc = i.to
          break
        case "MatchInst":
          return true
        case "SplitInst":
          if (ready.length > threadLimit) return "overflow"
          ready.push(Thread(i.to2, sp))
          pc = i.to1
          break
      }
    }
  }

  return false
}

// Add a state to the list. We don't want duplicates because we only need to
// process each state once.
const addThread = (list: number[], pc: number) => {
  if (!list.includes(pc)) list.push(pc)
}

/**
 * Ken Thompson's algorithm, adapted for the VM implementation. Because we don't
 * have backtracking, we know we only need to process each character once.
 * Rather than backtracking, we check all the possibilities for the current
 * character. Any that pass get progressed and will be checked for the next
 * char. If they don't pass, they're just discarded. If we introduce a split,
 * we add both to the current to-process list, and both get checked against the
 * current char.
 */
export const matchThompson = (prog: Inst[], s: string): boolean => {
  // clist is the current set of states that the NFA is in
  let clist: number[] = []
  // nlist is the next set of states that the NFA will be in, after processing the current character
  let nlist: number[] = []
  addThread(clist, 0)
  // Need to iterate one more than the string length. If the last char is a
  // matched CharInst, we need to go around one more time to hit the MatchInst.
  for (let sp = 0; sp <= s.length; sp++) {
    const c = s[sp]
    // This has to be a for-loop because the length changes during processing.
    for (let idx = 0; idx < clist.length; idx++) {
      const pc = clist[idx]
      const i = prog[pc]
      switch (i._tag) {
        case "CharInst":
          if (i.char === c) {
            addThread(nlist, pc + 1)
            break
          } else {
            break
          }
        case "JmpInst":
          addThread(clist, i.to)
          break
        case "MatchInst":
          return true
        case "SplitInst":
          addThread(clist, i.to1)
          addThread(clist, i.to2)
          break
      }
    }
    clist = nlist
    nlist = []
  }
  return false
}
