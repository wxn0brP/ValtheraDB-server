import { Command } from "commander";
import { configDotenv } from "dotenv";
import fs from "fs";
import { generateToken } from "../server/auth/helpers";
import { internalDB } from "../server/init/initDataBases";
import { initKeys } from "../server/init/keys";
import {
    addUserAccess,
    parsePermission,
    removeUser,
    resolveRoleId,
    resolveUserId,
    userMgmt,
    wardenMgmt
} from "./mgmt";

configDotenv({ quiet: true });

const program = new Command();
const version = JSON.parse(fs.readFileSync("./package.json", "utf-8")).version;

function printCliError(err: unknown) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
}

process.on("unhandledRejection", printCliError);
process.on("uncaughtException", printCliError);

program
    .version(version)
    .description("A CLI tool for managing the database");

const db = program
    .command("db")
    .description("Manage databases");

db
    .command("add <name> [folder] [opts]")
    .description("Add a new database")
    .addHelpText("after", `
Parameters:
    - opts: JSON string
    `)
    .action(async (name, folder, opts) => {
        const options = opts ? JSON.parse(opts) : {};
        const dbExists = await internalDB.dbs.findOne({ name });

        if (dbExists) {
            console.log("Database already exists");
            process.exit(1);
        }

        await internalDB.dbs.add({
            name,
            folder: folder || name,
            opts: options,
        }, false);
        console.log("Done");
        process.exit(0);
    });

db
    .command("rm <name>")
    .alias("remove")
    .description("Remove a database")
    .action(async (name) => {
        const res = await internalDB.dbs.removeOne({ name });
        console.log(res ? "Done" : "Database not found");
        process.exit(0);
    });

db
    .command("create <dbName> <login> <password> [permissions...]")
    .description("Create a database with a user and assign access")
    .action(async (dbName, login, password, permissions) => {
        const perm = permissions.length ? permissions.join(" ") : "all";

        const dbExists = await internalDB.dbs.findOne({ name: dbName });
        if (dbExists) {
            console.log(`Database "${dbName}" already exists`);
        } else {
            await internalDB.dbs.add({ name: dbName, folder: dbName, opts: {} }, false);
            console.log(`Database "${dbName}" created`);
        }

        const userRes = await addUserAccess(login, password);
        if (userRes.err) {
            console.log(`User: ${userRes.msg}`);
        } else {
            console.log(`User "${login}" created (id: ${userRes.user._id})`);
        }

        const userId = await resolveUserId(login);

        const roleId = `${dbName}-access`;
        try {
            await wardenMgmt.addRole({ _id: roleId, name: `${dbName} access` });
            console.log(`Role "${roleId}" created`);
        } catch {
            console.log(`Role "${roleId}" already exists`);
        }

        const permValue = parsePermission(perm);
        await wardenMgmt.addRBACRule(roleId, dbName, permValue);
        console.log(`Permissions "${perm}" (${permValue}) granted on "${dbName}" to role "${roleId}"`);

        await userMgmt.addRoleToUser(userId, roleId);
        console.log(`User "${login}" assigned to role "${roleId}"`);

        console.log("Done");
        process.exit(0);
    });

db
    .command("list [json]")
    .description("List all databases")
    .action(async (json) => {
        const dbs = await internalDB.dbs.find();
        if (json) {
            console.log(JSON.stringify(dbs));
            process.exit(0);
        }
        console.table(dbs);
        process.exit(0);
    });

const user = program
    .command("user")
    .description("Manage users and tokens");

user
    .command("add <login> <password>")
    .description("Add a new user")
    .action(async (login, password) => {
        const res = await addUserAccess(login, password);
        console.log(res.err ? res.msg : res.user._id);
        process.exit(0);
    });

user
    .command("rm <login>")
    .alias("remove")
    .description("Remove a user")
    .action(async (login) => {
        const res = await removeUser(login);
        console.log(res ? "Done" : "User not found");
        process.exit(0);
    });

user
    .command("list")
    .description("List all users")
    .action(async () => {
        const users = await internalDB.user.find();
        const simplifiedUsers = users.map(u => ({
            login: u.login,
            _id: u._id
        }));
        console.log(simplifiedUsers);
        process.exit(0);
    });

user
    .command("token <user_id_or_login> [time] [match_chars]")
    .description("Get a token for a user")
    .action(async (user_id_or_login, time, match_chars) => {
        const user = await internalDB.findOne<{ _id: string }>({
            collection: "user",
            search: {
                $or: [
                    { login: user_id_or_login },
                    { _id: user_id_or_login }
                ]
            }
        });

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
        console.log(match_chars ? match_chars + token + match_chars : token);
        process.exit(0);
    });

const role = program
    .command("role")
    .description("Manage roles and role-based access");

role
    .command("add <role_id> [name]")
    .description("Add a role")
    .action(async (roleId, name) => {
        const role = await wardenMgmt.addRole({ _id: roleId, name: name || roleId });
        console.log(role._id);
        process.exit(0);
    });

role
    .command("rm <role_id_or_name>")
    .alias("remove")
    .description("Remove a role")
    .action(async (roleIdOrName) => {
        const roleId = await resolveRoleId(roleIdOrName);
        const role = await wardenMgmt.removeRole(roleId);
        console.log(role ? "Done" : "Role not found");
        process.exit(0);
    });

role
    .command("list")
    .description("List all roles")
    .action(async () => {
        console.log(await internalDB.c("roles").find({}));
        process.exit(0);
    });

role
    .command("assign <user_id_or_login> <role_id_or_name>")
    .description("Assign a role to a user")
    .action(async (userIdOrLogin, roleIdOrName) => {
        const userId = await resolveUserId(userIdOrLogin);
        const roleId = await resolveRoleId(roleIdOrName);
        await userMgmt.addRoleToUser(userId, roleId);
        console.log(`Done: ${userId} -> ${roleId}`);
        process.exit(0);
    });

role
    .command("unassign <user_id_or_login> <role_id_or_name>")
    .description("Remove a role from a user")
    .action(async (userIdOrLogin, roleIdOrName) => {
        const userId = await resolveUserId(userIdOrLogin);
        const roleId = await resolveRoleId(roleIdOrName);
        await userMgmt.removeRoleFromUser(userId, roleId);
        console.log(`Done: ${userId} -/-> ${roleId}`);
        process.exit(0);
    });

role
    .command("grant <role_id_or_name> <entity_id> <permissions...>")
    .description("Grant entity access to a role")
    .action(async (roleIdOrName, entityId, permissions) => {
        const roleId = await resolveRoleId(roleIdOrName);
        await wardenMgmt.addRBACRule(roleId, entityId, parsePermission(permissions));
        console.log("Done");
        process.exit(0);
    });

role
    .command("revoke <role_id_or_name> <entity_id>")
    .description("Revoke entity access from a role")
    .action(async (roleIdOrName, entityId) => {
        const roleId = await resolveRoleId(roleIdOrName);
        const rule = await wardenMgmt.removeRBACRule(roleId, entityId);
        console.log(rule ? "Done" : "Rule not found");
        process.exit(0);
    });

const acl = program
    .command("acl")
    .description("Manage direct ACL access");

acl
    .command("grant <entity_id> <user_id_or_login> <permissions...>")
    .description("Grant direct ACL access to a user")
    .action(async (entityId, userIdOrLogin, permissions) => {
        const userId = await resolveUserId(userIdOrLogin);
        await wardenMgmt.addACLRule(entityId, parsePermission(permissions), userId);
        console.log("Done");
        process.exit(0);
    });

acl
    .command("revoke <entity_id> [user_id_or_login]")
    .description("Revoke direct ACL access from a user, or default ACL access when user is omitted")
    .action(async (entityId, userIdOrLogin) => {
        const userId = userIdOrLogin ? await resolveUserId(userIdOrLogin) : undefined;
        const rule = await wardenMgmt.removeACLRule(entityId, userId);
        console.log(rule ? "Done" : "Rule not found");
        process.exit(0);
    });

program.parse(process.argv);
