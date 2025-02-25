import { DataBase, Graph } from "@wxn0brp/db";
import { DataBaseBuilder } from "./types";
import parsers, { loadParsers } from "./customParser";
global.db = new DataBase("./serverDB");
global.dataCenter = {};
await loadParsers();

const databases = await global.db.find<DataBaseBuilder>("dbs", {});
for (const db of databases) {
    switch (db.type) {
        case "database":
            const customParser = parsers[db.parser] || undefined;

            global.dataCenter[db.name] = {
                type: "database",
                db: new DataBase(db.folder, db.opts || {}, customParser)
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