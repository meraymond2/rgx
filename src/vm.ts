export type Inst = CharInst | MatchInst | JmpInst | SplitInst

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
export const matchRecursive = (prog: Inst[], s: string): boolean => {
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
    }
  }
  return goto(0, 0)
}
