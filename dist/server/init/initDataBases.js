import { DataBase, Graph } from "@wxn0brp/db";
import parsers, { loadParsers } from "./customParser.js";
import { watch } from "fs";
const internalVDB = process.env.INTERNAL_VDB || "./serverDB";
global.db = new DataBase(internalVDB);
global.dataCenter = {};
await loadParsers();
async function loadDataBases() {
    const databases = await global.db.find("dbs", {});
    for (const db of databases) {
        switch (db.type) {
            case "database":
                const customParser = parsers[db.parser] || undefined;
                global.dataCenter[db.name] = {
                    type: "database",
                    db: new DataBase(db.folder, db.opts || {}, customParser)
                };
                break;
            case "graph":
                global.dataCenter[db.name] = {
                    type: "graph",
                    db: new Graph(db.folder)
                };
                break;
            default:
                const n = db.type;
                console.log(n);
        }
    }
}
await loadDataBases();
let reloadTimeout = null;
async function reloadDataBases() {
    if (reloadTimeout)
        clearTimeout(reloadTimeout);
    reloadTimeout = setTimeout(() => {
        global.dataCenter = {};
        loadDataBases();
    }, 100);
}
global.db.emiter.on("*", (req) => {
    if (req[0] !== "dbs")
        return;
    reloadDataBases();
});
watch(internalVDB + "/dbs", () => {
    reloadDataBases();
});
