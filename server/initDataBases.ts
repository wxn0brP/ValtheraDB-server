import { DataBase, Graph } from "@wxn0brp/db";
global.db = new DataBase("./serverDB");
global.dataCenter = {};

global.db.find("dbs", {}).then(databases => {
    for(const db of databases){
        if(db.type === "database"){
            global.dataCenter[db.name] = {
                type: "database",
                db: new DataBase(db.folder, db.opts || {})
            }
        }else if(db.type === "graph"){
            global.dataCenter[db.name] = {
                type: "graph",
                db: new Graph(db.folder)
            }
        }
    }
})
