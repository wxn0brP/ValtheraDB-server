import { UserManager, WardenManager } from "@wxn0brp/gate-warden";
import JSON5 from "json5";
import { cliMeta } from "./wardenMeta.js";
import { Valthera } from "@wxn0brp/db/valthera";
import { internal_db_dir } from "../server/init/vars.js";
const classes = {
    user: UserManager,
    mgr: WardenManager
};
const db = new Valthera(internal_db_dir);
const classesConstructors = {
    user: [db],
    mgr: [db],
};
const [, , className, methodName, ...args] = process.argv;
if (!className || !methodName) {
    console.error(`Usage: <class> <method> [...args]`);
    console.log("Available:");
    for (const [key, cls] of Object.entries(classes)) {
        const methods = Object.getOwnPropertyNames(cls.prototype).filter(m => m !== "constructor");
        console.log(`  ${key}: ${methods.join(", ")}`);
    }
    process.exit(1);
}
const ClassCtor = classes[className];
if (!ClassCtor) {
    console.error(`Class "${className}" not found`);
    process.exit(1);
}
let hasHelp = args.includes("--help") || args.includes("-h") || args.includes("-?");
const meta = cliMeta[className]?.[methodName];
let requiredArgs = 0;
if (meta) {
    meta.args?.forEach((a) => {
        requiredArgs += a.required ? 1 : 0;
    });
    hasHelp = hasHelp || requiredArgs > args.length;
}
if (meta && hasHelp) {
    console.log(`${className}.${methodName}()`);
    if (meta.description)
        console.log(`| ${meta.description}`);
    meta.args?.forEach((a, i) => {
        console.log(`| Arg ${i + 1}: ${a.name} (${a.type})${a.required ? " [required]" : ""}`);
    });
    if (meta.returns)
        console.log(`| Returns: ${meta.returns}`);
    process.exit(0);
}
const classArgs = classesConstructors[className] || [];
const instance = new ClassCtor(...classArgs);
const fn = instance[methodName];
if (!fn || typeof fn !== "function") {
    console.error(`Method "${methodName}" not found on class "${className}"`);
    process.exit(1);
}
const parsedArgs = args.map(arg => {
    try {
        return JSON5.parse(arg);
    }
    catch {
        return arg;
    }
});
Promise.resolve(fn.apply(instance, parsedArgs))
    .then((res) => {
    if (res !== undefined)
        console.log(JSON.stringify(res, null, 2));
})
    .catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
});
