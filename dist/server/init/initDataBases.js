import { ValtheraCreate } from "@wxn0brp/db";
import { Valthera } from "@wxn0brp/db/valthera";
import { GateWarden } from "@wxn0brp/gate-warden";
import { watch } from "fs";
import { join } from "path";
import { cache as authCache } from "../auth/auth.js";
import { cache as permCache } from "../utils/perm.js";
import { db_base_dir, internal_db_dir } from "./vars.js";
export const internalDB = ValtheraCreate(internal_db_dir);
export const dataCenter = {};
export const warden = new GateWarden(internalDB);
async function loadDataBases() {
    const databases = await internalDB.dbs.find();
    for (const key in dataCenter)
        delete dataCenter[key];
    for (const db of databases) {
        db.folder ||= db.name;
        const dir = db.folder.startsWith(".") ?
            db.folder :
            join(db_base_dir, "data", db.folder);
        dataCenter[db.name] = {
            db: new Valthera(dir, db.opts || {}),
            dir
        };
    }
}
await loadDataBases();
watch(internal_db_dir, { recursive: true }, (evt, file) => {
    const [dir] = file.split("/");
    if (!dir)
        return;
    switch (dir) {
        case "dbs":
            loadDataBases();
            permCache.clear();
            console.log("DBs reloaded");
            break;
        case "token":
            authCache.clear();
            console.log("Token cache reloaded");
            break;
        case "acl":
        case "abac":
        case "role":
        case "roles":
        case "user":
        case "users":
        case "wolf":
        case "encryptionKeys":
            permCache.clear();
            authCache.clear();
            console.log("Permissions & Auth cache reloaded");
            break;
    }
});
