import { compile } from "./compile"
import { parse } from "./parser"
import { matchNonRecursive, matchRecursive, matchThompson } from "./vm"

const r = compile(parse("a+b+"))
const r2 = compile(parse("(a+)|(b+)"))
const r3 = compile(parse("a+?"))

console.log("\nRecursive")
console.log(matchRecursive(r, "aaabb"))
console.log(matchRecursive(r, "aabbbc"))
console.log(matchRecursive(r, "bbaaa"))
console.log(matchRecursive(r, "ab"))
console.log(matchRecursive(r, "a"))
console.log(matchRecursive(r2, "aabbbc"))
console.log(matchRecursive(r2, "bbb"))
console.log(matchRecursive(r3, "aaabb"))

console.log("\nNon-Recursive")
console.log(matchNonRecursive(r, "aaabb"))
console.log(matchNonRecursive(r, "aabbbc"))
console.log(matchNonRecursive(r, "bbaaa"))
console.log(matchNonRecursive(r, "ab"))
console.log(matchNonRecursive(r, "a"))
console.log(matchNonRecursive(r2, "aabbbc"))
console.log(matchNonRecursive(r2, "bbb"))
console.log(matchNonRecursive(r3, "aaabb"))

console.log("\nThompson")
console.log(matchThompson(r, "aaabb"))
console.log(matchThompson(r, "aabbbc"))
console.log(matchThompson(r, "bbaaa"))
console.log(matchThompson(r, "ab"))
console.log(matchThompson(r, "a"))
console.log(matchThompson(r2, "aabbbc"))
console.log(matchThompson(r2, "bbb"))
console.log(matchThompson(r3, "aaabb"))
