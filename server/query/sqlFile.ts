import { isPathSafe } from "../utils/path";
import { checkPermission } from "../utils/perm";
import { getDb, ValtheraParsers } from "./query/utils";
import sqlSplitter from "../utils/sqlFileImport";
import { SQLFileCreator } from "../utils/sqlFileExport";
import { Router } from "@wxn0brp/falcon-frame";

const router = new Router();

router.post("/import", async (req, res) => {
    const dbName = req.body.db;
    const sqlContent = req.body.content;

    if (!dbName || !sqlContent) {
        return res.status(400).json({ err: true, msg: "db and content are required" });
    }

    const dbGet = getDb(dbName);
    if (!dbGet) {
        return res.status(400).json({ err: true, msg: "Invalid data center." });
    }

    const { db, dir } = dbGet;

    try {
        const parser = ValtheraParsers["sql"];
        if (!parser) {
            return res.status(400).json({ err: true, msg: "SQL parser not available." });
        }

        const queriesSQL = sqlSplitter.parse(sqlContent);
        const queries = queriesSQL.map((querySQL) => parser.parse(querySQL));

        for (const query of queries) {
            const type = query.method;

            if (!db[type] || typeof db[type] !== "function") {
                return res.status(400).json({ err: true, msg: `Invalid query type: ${type}` });
            }

            if (!(await checkPermission(req.user._id, type, dbName))) {
                return res.status(403).json({ err: true, msg: "Access denied for query type: " + type });
            }

            const collection = query.args[0];
            if (collection && !isPathSafe(global.baseDir, dir, collection)) {
                return res.status(400).json({ err: true, msg: "Invalid collection: " + collection });
            }
        }

        const results = [];
        for (const query of queries) {
            const collection = query.args.shift();
            const result = await db[query.method](collection, ...query.args as any[]);
            results.push(result);
        }

        return res.json({ err: false, results });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ err: true, msg: err.message });
    }
});

router.post("/export", async (req, res) => {
    const dbName = req.body.db;
    const collections = req.body.collections as string[] || [];
    const opts = req.body.opts || {};

    if (!dbName) {
        return res.status(400).json({ err: true, msg: "db is required" });
    }

    const dbGet = getDb(dbName);
    if (!dbGet) {
        return res.status(400).json({ err: true, msg: "Invalid data center." });
    }

    const { db, dir } = dbGet;

    try {
        if (!await checkPermission(req.user._id, "find", dbName)) return res.status(403).json({ err: true, msg: "Access denied for query type: find" });
        const creator = new SQLFileCreator(db, opts);

        if (collections.length > 0) {
            for (const collection of collections) {
                if (!isPathSafe(global.baseDir, dir, collection)) {
                    return res.status(400).json({ err: true, msg: "Invalid collection: " + collection });
                }
            }
        }

        const result = await creator.create(collections);
        return res.json({ err: false, result });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ err: true, msg: err.message });
    }

});

export default router;