import { DataBase, Graph } from "@wxn0brp/db";
import { DataBaseBuilder } from "./types";
global.db = new DataBase("./serverDB");
global.dataCenter = {};

const databases = await global.db.find<DataBaseBuilder>("dbs", {});
for (const db of databases) {
    switch (db.type) {
        case "database":
            global.dataCenter[db.name] = {
                type: "database",
                db: new DataBase(db.folder, db.opts || {})
            }
            break;
        case "graph":
            global.dataCenter[db.name] = {
                type: "graph",
                db: new Graph(db.folder)
            }
            break;
        default:
            const n: never = db.type;
            console.log(n);
    }
}