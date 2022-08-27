export type Inst = CharInst | MatchInst | JmpInst | SplitInst

export type CharInst = {
  _tag: "CharInst"
  char: string
}

export type MatchInst = { _tag: "MatchInst" }

export type JmpInst = {
  _tag: "JmpInst"
  to: number
}

export type SplitInst = {
  _tag: "SplitInst"
  x: number
  y: number
}

export type VM = {
  pc: number
}
