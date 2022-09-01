/*
expr -> alternation
alternation -> concat ("|" concat)*
concatenation -> repetition repetition*
repetition -> primary ("?" | "+" | "*")?
primary -> block | char
block -> "(" expr ")"
char -> [a-z]
*/

// Reminder to self: the AST doesn't need to be identical to the grammar. In
// particular, it doesn't need to encode the precedence rules, because that's
// handled at parse-time.
export type RegexAst = Expr

export type Expr = Alternation | Concatenation | Repetition | Capture | Char

type Alternation = {
  _tag: "Alternation"
  left: Expr
  right: Expr
}

type Concatenation = {
  _tag: "Concatenation"
  left: Expr
  right: Expr
}

type Repetition = {
  _tag: "Repetition"
  expr: Expr
  op: "?" | "+" | "*"
}

type Capture = {
  _tag: "Capture"
  expr: Expr
}

type Char = {
  _tag: "Char"
  c: string
}

class StringIter {
  s: string
  pos: number
  constructor(s: string) {
    this.s = s
    this.pos = 0
  }

  peek = (): string | null => {
    if (this.pos < this.s.length) {
      return this.s[this.pos]
    }
    return null
  }

  match = (s: string): boolean => {
    if (this.peek() === s) {
      this.pos++
      return true
    }
    return false
  }

  hasNext = (): boolean => {
    return this.pos < this.s.length
  }

  next = () => {
    const nextChar = this.peek()
    this.pos++
    return nextChar
  }
}

// TODO: could use some error handling
export const parse = (rgx: string): RegexAst => parseExpr(new StringIter(rgx))

const parseExpr = (src: StringIter): Expr => parseAlternation(src)

const parseAlternation = (src: StringIter): Expr => {
  let left = parseConcatenation(src)

  while (src.match("|")) {
    const right = parseConcatenation(src)
    left = { _tag: "Alternation", left, right }
  }
  return left
}

const parseConcatenation = (src: StringIter): Expr => {
  let left = parseRepetition(src)
  while (src.hasNext() && src.peek() !== ")" && src.peek() !== "|") {
    const right = parseRepetition(src)
    left = { _tag: "Concatenation", left, right }
  }
  return left
}

const parseRepetition = (src: StringIter): Expr => {
  const expr = parsePrimary(src)
  const next = src.peek()
  if (next && ["?", "+", "*"].includes(next)) {
    const op = src.next() as "?" | "+" | "*"
    return { _tag: "Repetition", expr, op }
  }
  return expr
}

const parsePrimary = (src: StringIter): Expr => {
  if (src.match("(")) {
    const expr = parseExpr(src)
    src.match(")")
    return { _tag: "Capture", expr }
  }
  return { _tag: "Char", c: src.next() as string }
}
