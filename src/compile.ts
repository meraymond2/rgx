import { Expr, RegexAst } from "./parser"
import { CharInst, Inst, SplitInst, JmpInst, MatchInst, SaveInst } from "./vm"

let labelCounter = 0

type Label = {
  _tag: "Label"
  id: number
}

const Label = (id: number): Label => ({ _tag: "Label", id })

let saveCounter = 0

export const compile = (ast: RegexAst): Inst[] => {
  labelCounter = 0
  saveCounter = 0
  const saveStart = SaveInst(saveCounter++)
  const saveEnd = SaveInst(saveCounter++)
  return resolveLabels([saveStart, ...compileExpr(ast), MatchInst(), saveEnd])
}

const compileExpr = (expr: Expr): Array<Inst | Label> => {
  switch (expr._tag) {
    case "Alternation": {
      const l1 = labelCounter++
      const left = compileExpr(expr.left)
      const l2 = labelCounter++
      const right = compileExpr(expr.right)
      const l3 = labelCounter++
      return [
        SplitInst(l1, l2),
        Label(l1),
        ...left,
        JmpInst(l3),
        Label(l2),
        ...right,
        Label(l3),
      ]
    }
    case "Capture": {
      const saveStart = SaveInst(saveCounter++)
      const saveEnd = SaveInst(saveCounter++)
      return [saveStart, ...compileExpr(expr.expr), saveEnd]
    }
    case "Char":
      return [CharInst(expr.c)]
    case "Concatenation":
      return [...compileExpr(expr.left), ...compileExpr(expr.right)]
    case "Repetition":
      switch (expr.op) {
        case "?": {
          const l1 = labelCounter++
          const e = compileExpr(expr.expr)
          const l2 = labelCounter++
          return [SplitInst(l1, l2), Label(l1), ...e, Label(l2)]
        }
        case "+": {
          const l1 = labelCounter++
          const e = compileExpr(expr.expr)
          const l2 = labelCounter++
          return [Label(l1), ...e, SplitInst(l1, l2), Label(l2)]
        }
        case "*": {
          const l1 = labelCounter++
          const l2 = labelCounter++
          const e = compileExpr(expr.expr)
          const l3 = labelCounter++
          return [
            Label(l1),
            SplitInst(l2, l3),
            Label(l2),
            ...e,
            JmpInst(l1),
            Label(l3),
          ]
        }
      }
  }
}

// The first compilation pass is recursive, so we don't know the absolute
// position of labels. We initially point jumps to the label-id. This step
// replaces the label ids with instruction positions.
const resolveLabels = (insts: Array<Inst | Label>): Inst[] => {
  // Labels are incremental and 0-indexed, so the label's id is its index
  let labelPositions: number[] = []
  let acc: Inst[] = []
  let pos = 0
  // Remove the labels, and record their positions. Using a while loop because
  // the length of the array will mutate during processing, and I want the
  // current position of each label, not its original one.
  while (pos < insts.length) {
    const i = insts[pos]
    if (i._tag === "Label") {
      labelPositions.push(pos)
      insts.splice(pos, 1)
    } else {
      acc.push(i)
      pos++
    }
  }
  // Update anything that pointed to a label with its position. This has to be
  // done after all the labels have been processed, because jumps can point
  // ahead.
  return acc.map(inst => {
    switch (inst._tag) {
      case "CharInst":
        return inst
      case "JmpInst":
        return { ...inst, to: labelPositions[inst.to] }
      case "MatchInst":
        return inst
      case "SaveInst":
        return inst
      case "SplitInst":
        return {
          ...inst,
          to1: labelPositions[inst.to1],
          to2: labelPositions[inst.to2],
        }
    }
  })
}
