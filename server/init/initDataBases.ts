import { Valthera, Graph } from "@wxn0brp/db";
import { DataBaseBuilder } from "../types";
import parsers, { loadParsers } from "./customParser";
import { watch } from "fs";
import { cache } from "../utils/perm";
import { GateWarden } from "@wxn0brp/gate-warden";

const internalVDB = process.env.INTERNAL_VDB || "./serverDB";
global.internalDB = new Valthera(internalVDB);
global.dataCenter = {};
global.warden = new GateWarden(global.internalDB);
await loadParsers();

async function loadDataBases() {
    const databases = await global.internalDB.find<DataBaseBuilder>("dbs", {});
    for (const db of databases) {
        switch (db.type) {
            case "database":
                const customParser = parsers[db.parser] || undefined;

                global.dataCenter[db.name] = {
                    type: "database",
                    db: new Valthera(db.folder, db.opts || {}, customParser),
                    dir: db.folder
                }
                break;
            case "graph":
                global.dataCenter[db.name] = {
                    type: "graph",
                    db: new Graph(db.folder),
                    dir: db.folder
                }
                break;
            default:
                const n: never = db.type;
                console.log(n);
        }
    }
}

await loadDataBases();

let reloadTimeout: NodeJS.Timeout | null = null;
async function reloadDataBases() {
    if (reloadTimeout) clearTimeout(reloadTimeout);
    reloadTimeout = setTimeout(() => {
        global.dataCenter = {};
        loadDataBases();
    }, 100);
}

global.internalDB.emiter.on("*", (req) => {
    if (req[0] !== "dbs") return;
    reloadDataBases();
    cache.flushAll();
});
watch(internalVDB + "/dbs", () => {
    reloadDataBases();
    cache.flushAll();
});