import { compile } from "./compile"
import { parse } from "./parser"
import { matchNonRecursive, matchRecursive } from "./vm"

const r = compile(parse("a+b+"))
console.log(matchRecursive(r, "aaabb"))
console.log(matchRecursive(r, "aabbbc"))
console.log(matchRecursive(r, "bbaaa"))
console.log(matchRecursive(r, "ab"))
console.log(matchRecursive(r, "a"))
console.log()
console.log(matchNonRecursive(r, "aaabb"))
console.log(matchNonRecursive(r, "aabbbc"))
console.log(matchNonRecursive(r, "bbaaa"))
console.log(matchNonRecursive(r, "ab"))
console.log(matchNonRecursive(r, "a"))
