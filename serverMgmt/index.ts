import { Valthera } from "@wxn0brp/db";
import { Command } from "commander";
import { configDotenv } from "dotenv";
import fs from "fs";
import { generateToken } from "../server/auth/helpers.js";
import { parsersList } from "../server/init/customParser.js";
import { addUserAccess, removeUser } from "./mgmt.js";
import { initKeys } from "../server/init/keys.js";
configDotenv();

const program = new Command();
global.db = new Valthera(process.env.INTERNAL_VDB || "./serverDB");
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

        const dbExists = await global.db.findOne("dbs", { name });
        if (dbExists) {
            console.log("Database already exists");
            process.exit(1);
        }

        await global.db.add("dbs", {
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
        const res = await global.db.removeOne("dbs", { name });
        console.log(res ? "Done" : "Database not found");
        process.exit(0);
    });

program
    .command("list-dbs")
    .description("List all databases")
    .action(async () => {
        const dbs = await global.db.find("dbs", {});
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
        const users = await global.db.find("user", {});
        const simplifiedUsers = users.map(u => ({
            login: u.login,
            _id: u._id
        }));
        console.log(simplifiedUsers);
        process.exit(0);
    });

program
    .command("add-user-access <user_id_or_login> <db_name> <access>")
    .alias("aua")
    .description("Add user access to a database")
    .addHelpText("after", `
DB name:
    - A string representing the name of the database
    - "$" for all databases

Access options:
    - A number representing the access level (0-31, e.g., 7)
    - A combination of flags: "a" (add), "r" (remove), "u" (update), "c" (collection), "n" (unknown)

Example:
    - "arcu" grants add, remove, update, and collection access.
    - "7" is equivalent to "aru" (add, remove, update).
    `)
    .action(async (user_id_or_login, db_name, accessRaw) => {
        let access = parseInt(accessRaw);

        if (isNaN(access)) {
            access = 0;
            if (accessRaw.includes("a")) access += 1;  // "a" for add
            if (accessRaw.includes("r")) access += 2;  // "r" for remove
            if (accessRaw.includes("u")) access += 4;  // "u" for update
            if (accessRaw.includes("c")) access += 8;  // "c" for collection
            if (accessRaw.includes("n")) access += 16; // "n" for unknown
        }

        const user = await global.db.findOne("user", { $or: [{ login: user_id_or_login }, { _id: user_id_or_login }] });
        if (!user) {
            console.log("User not found");
            process.exit(1);
        }

        const user_id = user._id;
        await global.db.updateOneOrAdd("perm", { u: user_id, to: db_name }, { p: access }, {}, {}, false);
        console.log("Done");
        process.exit(0);
    });

program
    .command("remove-user-access <user_id_or_login> <db_name>")
    .alias("rua")
    .description("Remove user access from a database")
    .action(async (user_id_or_login, db_name) => {
        const user = await global.db.findOne("user", { $or: [{ login: user_id_or_login }, { _id: user_id_or_login }] });
        if (!user) {
            console.log("User not found");
            process.exit(1);
        }

        const user_id = user._id;
        await global.db.removeOne("perm", { u: user_id, to: db_name });
        console.log("Done");
        process.exit(0);
    });

program
    .command("get-token <user_id_or_login> [match_chars]")
    .alias("gt")
    .description("Get a token for a user")
    .action(async (user_id_or_login, match_chars) => {
        const user = await global.db.findOne("user", { $or: [{ login: user_id_or_login }, { _id: user_id_or_login }] });
        if (!user) {
            console.log("User not found");
            process.exit(1);
        }
        await initKeys();

        const token = await generateToken({ uid: user._id });
        if (match_chars) {
            console.log(match_chars + token + match_chars);
        } else {
            console.log(token);
        }
        process.exit(0);
    });

program.parse(process.argv);