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
  let matchEnd = -1
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
        matchEnd = stringPointer
        return true
      case "SplitInst":
        return goto(i.to1, stringPointer) || goto(i.to2, stringPointer)
      case "SaveInst": {
        saved[i.position] = stringPointer
        if (goto(programCounter + 1, stringPointer)) {
          // Either I'm misunderstanding, or there's a small omission in his
          // example, where the final save instruction isn't processed.
          saved[1] = matchEnd
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
  matches: number[]
}

const Thread = (pc: number, sp: number, matches: number[]): Thread => ({
  pc,
  sp,
  matches,
})

/**
 * Non-recursive version, but still backtracking. The advantage of this version
 * is that it doesn't rely on the application stack, so we can return an error
 * value rather blowing up.
 */
export const matchNonRecursive = (
  prog: Inst[],
  s: string
): number[] | false | "overflow" => {
  const threadLimit = 1000
  let ready: Thread[] = []
  ready.push(Thread(0, 0, [].slice()))
  while (ready.length > 0) {
    let { pc, sp, matches } = ready.pop() as Thread
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
          matches[1] = sp
          return matches.filter(_ => _ !== undefined)
        case "SplitInst":
          if (ready.length > threadLimit) return "overflow"
          ready.push(Thread(i.to2, sp, matches.slice()))
          pc = i.to1
          break
        case "SaveInst":
          matches[i.position] = sp
          pc++
          break
      }
    }
  }
  return false
}

type TThread = {
  pc: number
  matches: number[]
}

// Add a state to the list. We don't want duplicates because we only need to
// process each state once.
const addThread = (
  list: TThread[],
  thread: TThread,
  seen: Record<number, true>
) => {
  if (!seen[thread.pc]) {
    seen[thread.pc] = true
    list.push(thread)
  }
}

/**
 * Ken Thompson's algorithm, adapted for the VM implementation. Because we don't
 * have backtracking, we know we only need to process each character once.
 * Rather than backtracking, we check all the possibilities for the current
 * character. Any that pass get progressed and will be checked for the next
 * char. If they don't pass, they're just discarded. If we introduce a split,
 * we add both to the current to-process list, and both get checked against the
 * current char.
 *
 * There’s a comment about this VM, which turned into the Pike VM when we added
 * submatching, not respecting thread priority. I don't have a test for it. It's
 * something to do with the instructions that add more instructions to the clist
 * only adding them one at a time, so other instructions can run first and put
 * other instructions in front of them that shouldn't be first. I get that, but
 * I'm not sure how to test it.
 */
export const matchThompson = (prog: Inst[], s: string): number[] | false => {
  let matched = false
  // clist is the current set of states that the NFA is in
  let clist: TThread[] = []
  // nlist is the next set of states that the NFA will be in, after processing the current character
  let nlist: TThread[] = []
  addThread(clist, { pc: 0, matches: [] }, {})
  // Need to iterate one more than the string length. If the last char is a
  // matched CharInst, we need to go around one more time to hit the MatchInst.
  let saved: number[] = []
  for (let sp = 0; sp <= s.length; sp++) {
    let seen: Record<number, true> = {}
    const c = s[sp]
    // This has to be a for-loop because the length changes during processing.
    for (let idx = 0; idx < clist.length; idx++) {
      const t = clist[idx]
      const i = prog[t.pc]
      switch (i._tag) {
        case "CharInst":
          if (i.char === c) {
            addThread(nlist, { pc: t.pc + 1, matches: t.matches }, seen)
            break
          } else {
            break
          }
        case "JmpInst":
          addThread(clist, { pc: i.to, matches: t.matches }, seen)
          break
        case "MatchInst":
          t.matches = t.matches.slice()
          t.matches[1] = sp
          matched = true
          saved = t.matches.filter(_ => _ !== undefined)
          // If a thread matches, we want to skip the rest of the lower-priority
          // threads. For lazy quantifiers, this would mean that we would stop
          // on having matched, and not continue with the greedier branch.
          clist = []
          break
        case "SplitInst":
          addThread(clist, { pc: i.to1, matches: t.matches }, seen)
          addThread(clist, { pc: i.to2, matches: t.matches }, seen)
          break
        case "SaveInst":
          t.matches = t.matches.slice()
          t.matches[i.position] = sp
          addThread(clist, { pc: t.pc + 1, matches: t.matches }, seen)
          break
      }
    }
    clist = nlist
    nlist = []
  }
  return matched ? saved : false
}
