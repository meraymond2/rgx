import { compile } from "./compile"
import { parse } from "./parser"


const r1 = "a+b+"

const ast = parse(r1)
const isnts = compile(ast)

console.log(isnts)
