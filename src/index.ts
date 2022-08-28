import { compile } from "./compile"
import { parse } from "./parser"
import { matchNonRecursive, matchRecursive, matchThompson } from "./vm"

const r = compile(parse("a+b+"))
console.log("Recursive")
console.log(matchRecursive(r, "aaabb"))
console.log(matchRecursive(r, "aabbbc"))
console.log(matchRecursive(r, "bbaaa"))
console.log(matchRecursive(r, "ab"))
console.log(matchRecursive(r, "a"))

console.log("Non-Recursive")
console.log(matchNonRecursive(r, "aaabb"))
console.log(matchNonRecursive(r, "aabbbc"))
console.log(matchNonRecursive(r, "bbaaa"))
console.log(matchNonRecursive(r, "ab"))
console.log(matchNonRecursive(r, "a"))

console.log("Thompson")
console.log(matchThompson(r, "aaabb"))
console.log(matchThompson(r, "aabbbc"))
console.log(matchThompson(r, "bbaaa"))
console.log(matchThompson(r, "ab"))
console.log(matchThompson(r, "a"))
