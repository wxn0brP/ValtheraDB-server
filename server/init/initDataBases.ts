import { ValtheraCreate } from "@wxn0brp/db";
import { Valthera } from "@wxn0brp/db/valthera";
import { GateWarden } from "@wxn0brp/gate-warden";
import { User as GWUser } from "@wxn0brp/gate-warden/types/system";
import { watch } from "fs";
import { join } from "path";
import { cache as authCache } from "../auth/auth";
import { DataBaseBuilder } from "../types";
import { User as ServerUser } from "../types/user";
import { cache as permCache } from "../utils/perm";
import { db_base_dir, internal_db_dir } from "./vars";

interface Token {
    _id: string;
    sha: string;
}

interface WolfToken {
    _id: string;
    token: string;
}

export const internalDB = ValtheraCreate<{
    dbs: DataBaseBuilder;
    user: ServerUser;
    users: GWUser;
    token: Token;
    wolf: WolfToken;
}>(internal_db_dir);

export const dataCenter: Record<string, { db: Valthera, dir: string }> = {};
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
            db: new Valthera(dir, db.opts || {},),
            dir
        }
    }
}

await loadDataBases();

watch(internal_db_dir, { recursive: true }, (evt, file) => {
    const [dir] = file.split("/");
    if (!dir) return;

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
