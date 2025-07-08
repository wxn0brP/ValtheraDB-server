import { Valthera } from "@wxn0brp/db";
import { Command } from "commander";
import { configDotenv } from "dotenv";
import fs from "fs";
import { generateToken } from "../server/auth/helpers.js";
import { parsersList } from "../server/init/customParser.js";
import { addUserAccess, removeUser } from "./mgmt.js";
import { initKeys } from "../server/init/keys.js";
configDotenv({ quiet: true });

const program = new Command();
global.internalDB = new Valthera(process.env.INTERNAL_VDB || "./serverDB");
const version = JSON.parse(fs.readFileSync("./package.json", "utf-8")).version;

program
    .version(version)
    .description("A CLI tool for managing the database");

program
    .command("add-db <type> <name> <folder> [opts] [customParser]")
    .alias("add")
    .alias("add-database")
    .description("Add a new database")
    .addHelpText("after", `
Parameters:
    - type: "database" or "graph"
    - opts: JSON string
    - customParser: Name of the custom parser for "parsers" directory
    `)
    .action(async (type, name, folder, opts, customParser) => {
        if (!["database", "graph"].includes(type)) {
            console.log(`Type must be "database" or "graph"`);
            process.exit(1);
        }

        const options = opts ? JSON.parse(opts) : {};
        if (customParser && !parsersList.includes(customParser)) {
            console.log("Custom parser not found");
            process.exit(1);
        }

        const dbExists = await global.internalDB.findOne("dbs", { name });
        if (dbExists) {
            console.log("Database already exists");
            process.exit(1);
        }

        await global.internalDB.add("dbs", {
            type,
            name,
            folder,
            opts: options,
            parser: customParser
        }, false);
        console.log("Done");
        process.exit(0);
    });

program
    .command("rm-db <name>")
    .alias("del-db")
    .alias("remove-db")
    .description("Remove a database")
    .action(async (name) => {
        const res = await global.internalDB.removeOne("dbs", { name });
        console.log(res ? "Done" : "Database not found");
        process.exit(0);
    });

program
    .command("list-dbs")
    .description("List all databases")
    .action(async () => {
        const dbs = await global.internalDB.find("dbs", {});
        console.log(dbs);
        process.exit(0);
    });

program
    .command("add-user <login> <password>")
    .alias("au")
    .alias("create-user")
    .description("Add a new user")
    .action(async (login, password) => {
        const res = await addUserAccess(login, password);
        console.log(res.err ? res.msg : res.user._id);
        process.exit(0);
    });

program
    .command("rm-user <login>")
    .alias("del-user")
    .description("Remove a user")
    .action(async (login) => {
        const res = await removeUser(login);
        console.log(res ? "Done" : "User not found");
        process.exit(0);
    });

program
    .command("list-users")
    .alias("lu")
    .description("List all users")
    .action(async () => {
        const users = await global.internalDB.find("user", {});
        const simplifiedUsers = users.map(u => ({
            login: u.login,
            _id: u._id
        }));
        console.log(simplifiedUsers);
        process.exit(0);
    });

program
    .command("get-token <user_id_or_login> [time] [match_chars]")
    .alias("gt")
    .description("Get a token for a user")
    .action(async (user_id_or_login, time, match_chars) => {
        const user = await global.internalDB.findOne("user", { $or: [{ login: user_id_or_login }, { _id: user_id_or_login }] });
        if (!user) {
            console.log("User not found");
            process.exit(1);
        }
        await initKeys();

        if (!isNaN(parseInt(time))) time = parseInt(time);
        if (time === "true") time = true;
        if (time === "false") time = false;

        if (typeof time === "undefined" || time === null) time = false;

        const token = await generateToken({ uid: user._id }, time);
        if (match_chars) {
            console.log(match_chars + token + match_chars);
        } else {
            console.log(token);
        }
        process.exit(0);
    });

program.parse(process.argv);