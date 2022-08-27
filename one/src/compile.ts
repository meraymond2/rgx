import { Expr, RegexAst } from "./parser"
import { CharInst, Inst, SplitInst, Label, JmpInst, MatchInst } from "./vm"

let labelCounter = 0

export const compile = (ast: RegexAst): Inst[] =>
  compileExpr(ast).concat(MatchInst())

const compileExpr = (expr: Expr): Inst[] => {
  switch (expr._tag) {
    case "Alternation": {
      const l1 = Label((labelCounter++).toString())
      const l2 = Label((labelCounter++).toString())
      const l3 = Label((labelCounter++).toString())
      return [
        SplitInst(l1, l2),
        l1,
        ...compileExpr(expr.left),
        l2,
        ...compileExpr(expr.right),
        l3,
      ]
    }
    case "Char":
      return [CharInst(expr.c)]
    case "Concatenation":
      return [...compileExpr(expr.left), ...compileExpr(expr.right)]
    case "Repetition":
      switch (expr.op) {
        case "?": {
          const l1 = Label((labelCounter++).toString())
          const l2 = Label((labelCounter++).toString())
          return [SplitInst(l1, l2), l1, ...compileExpr(expr.expr), l2]
        }
        case "+": {
          const l1 = Label((labelCounter++).toString())
          const l3 = Label((labelCounter++).toString())
          return [l1, ...compileExpr(expr.expr), SplitInst(l1, l3), l3]
        }
        case "*": {
          const l1 = Label((labelCounter++).toString())
          const l2 = Label((labelCounter++).toString())
          const l3 = Label((labelCounter++).toString())
          return [
            l1,
            SplitInst(l2, l3),
            l2,
            ...compileExpr(expr.expr),
            JmpInst(l1),
            l3,
          ]
        }
      }
  }
}
