import { compile } from "./compile"
import { parse } from "./parser"
import { matchRecursive } from "./vm"

const r = compile(parse("a+b+"))
console.log(matchRecursive(r, "aaabb"))
console.log(matchRecursive(r, "aabbbc"))
console.log(matchRecursive(r, "bbaaa"))
console.log(matchRecursive(r, "ab"))
console.log(matchRecursive(r, "a"))
