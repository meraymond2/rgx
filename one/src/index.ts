import { parse } from "./parser"


const r1 = "a?a?a?aaa"

const ast = parse(r1)

console.log(JSON.stringify(ast, null, 2))
