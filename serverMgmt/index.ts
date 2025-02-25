let args = process.argv.slice(2);

if(args.length == 0){
    help();
    process.exit(0);
}

import { DataBase } from "@wxn0brp/db";
import { addUserAccess, removeUser } from "../server/auth.js";
import { parsersList } from "../server/customParser.js";
global.db = new DataBase("./serverDB");

switch(args.shift()){
    case "help":
        help();
    break;
    case "add-db":
        if(args.length < 3){
            console.log("usage: add-db <type> <name> <folder> <opts> <customParser>");
            console.log("*type: 'database' or 'graph'");
            console.log("*opts: JSON object");
            console.log("*customParser: name of the custom parser (from parsers folder)");
            process.exit(1);
        }
        const type = args[0];
        const name = args[1];
        const folder = args[2];
        const opts = args[3] ? JSON.parse(args[3]) : {};
        const customParser = args[4] ? args[4] : undefined;
        if(customParser) {
            if(!parsersList.includes(customParser)){
                console.log("Custom parser not found");
                process.exit(1);
            }
        }
        
        global.db.findOne("dbs", { name }).then(dbExists => {
            if(dbExists){
                console.log("Database already exists");
                process.exit(1);
            }
    
            global.db.add("dbs", {
                type,
                name,
                folder,
                opts,
                parser: customParser
            }, false).then(() => console.log("Done"));
        });
    break;
    case "rm-db":
        if(args.length < 1){
            console.log("No database name");
            process.exit(1);
        }
        global.db.removeOne("dbs", { name: args[0] }).then((res) => console.log(res ? "Done" : "Database not found"));
    break;
    case "list-dbs":
        global.db.find("dbs", {}).then(dbs => console.log(dbs));
    break;
    case "add-user":
        if(args.length < 2){
            console.log("usage: add-user <login> <password>");
            process.exit(1);
        }
        const login = args[0];
        const password = args[1];
        addUserAccess(login, password).then((res) => console.log(res.err ? res.msg : res.user._id));
    break;
    case "rm-user":
        if(args.length < 1){
            console.log("No user login or id");
            process.exit(1);
        }
        removeUser(args[0]).then((res) => console.log(res ? "Done" : "User not found"));
    break;
    case "list-users":
        global.db.find("user", {}).then(users => {
            users = users.map(u => {
                return {
                    login: u.login,
                    _id: u._id
                }
            });
            console.log(users);
        });
    break;
    default:
        console.log("Invalid argument. Use help for more info");
}

function help(){
    console.log("commands:");
    console.log("  add-db <type> <name> <folder> <opts> <customParser>");
    console.log("  rm-db <name>");
    console.log("  list-dbs");
    console.log("  add-user <login> <password>");
    console.log("  rm-user <login>");
    console.log("  list-users");
}