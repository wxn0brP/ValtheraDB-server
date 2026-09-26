import { ValtheraCreate } from "@wxn0brp/db";
import { Valthera } from "@wxn0brp/db/valthera";
import { GateWarden } from "@wxn0brp/gate-warden";
import { join } from "path";
import { db_base_dir, internal_db_dir } from "./vars.js";
export const internalDB = ValtheraCreate(internal_db_dir);
export const dataCenter = {};
export const warden = new GateWarden(internalDB);
export async function loadDataBases() {
    const databases = await internalDB.dbs.find();
    for (const key in dataCenter)
        delete dataCenter[key];
    for (const db of databases) {
        db.folder ||= db.name;
        const dir = db.folder.startsWith(".")
            ? db.folder
            : join(db_base_dir, "data", db.folder);
        dataCenter[db.name] = {
            db: new Valthera(dir, db.opts || {}),
            dir,
        };
    }
}
await loadDataBases();
