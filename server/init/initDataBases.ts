import { Valthera } from "@wxn0brp/db";
import { GateWarden } from "@wxn0brp/gate-warden";
import { watch } from "fs";
import { join } from "path";
import { DataBaseBuilder } from "../types";
import { cache } from "../utils/perm";
import { db_base_dir, internal_db_dir } from "./vars";

export const internalDB = new Valthera(internal_db_dir);
export const dataCenter = {};
export const warden = new GateWarden(internalDB);

async function loadDataBases() {
    const databases = await internalDB.find<DataBaseBuilder>("dbs", {});
    for (const db of databases) {
        db.folder ||= db.name;

        const dir = db.folder.startsWith(".") ?
            db.folder :
            join(db_base_dir, "data", db.folder);

        dataCenter[db.name] = {
            db: new Valthera(dir, db.opts || {},),
            dir
        }
    }
}

await loadDataBases();

let reloadTimeout: NodeJS.Timeout | null = null;

async function reloadDataBases() {
    if (reloadTimeout) clearTimeout(reloadTimeout);
    reloadTimeout = setTimeout(() => {
        for (const key in dataCenter) {
            delete dataCenter[key];
        }
        loadDataBases();
    }, 100);
}

internalDB.emiter.on("*", (req) => {
    if (req[0] !== "dbs") return;
    reloadDataBases();
    cache.clear();
});

watch(join(internal_db_dir, "dbs"), () => {
    reloadDataBases();
    cache.clear();
});