export type Inst = CharInst | MatchInst | JmpInst | SplitInst | Label

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
  to: Label
}

export const JmpInst = (to: Label): JmpInst => ({
  _tag: "JmpInst",
  to,
})

type SplitInst = {
  _tag: "SplitInst"
  l1: Label
  l2: Label
}

export const SplitInst = (l1: Label, l2: Label): SplitInst => ({
  _tag: "SplitInst",
  l1,
  l2,
})

type Label = {
  _tag: "Label"
  name: string
}

export const Label = (name: string): Label => ({ _tag: "Label", name })

export type VM = {
  pc: number
}
