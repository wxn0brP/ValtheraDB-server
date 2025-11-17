import { isPathSafe } from "../../utils/path";
import { checkPermission } from "../../utils/perm";
import { Router } from "@wxn0brp/falcon-frame";
import { ValtheraQuery } from "@wxn0brp/db-string-query/types";
import { sqlProxy } from "./sql";
import { getDb, getParser } from "./utils";
const router = new Router();

router.post("/sql-proxy", sqlProxy);

router.post("/:parserType", async (req, res) => {
    const dbName = req.body.db;
    const q = req.body.q;
    const parserType = req.params.parserType;

    if (!dbName || !q) {
        return res.status(400).json({ err: true, msg: "db and q are required" });
    }

    const parser = getParser(parserType);

    if (!parser) {
        return res.status(400).json({ err: true, msg: "Invalid parser type." });
    }

    const dbGet = getDb(dbName);
    if (!dbGet) {
        return res.status(400).json({ err: true, msg: "Invalid data center." });
    }

    const { db, dir } = dbGet;

    try {
        let query: ValtheraQuery;
        try {
            query = parser.parse(q);
        } catch {
            return res.status(400).json({ err: true, msg: "Invalid query." });
        }
        if (!query) {
            return res.status(400).json({ err: true, msg: "Invalid query." });
        }

        const type = query.method;

        if (type === "getCollections") {
            const collections = await db.getCollections();
            return res.json({ err: false, result: collections });
        }

        if (!db[type] || typeof db[type] !== "function") {
            return res.status(400).json({ err: true, msg: "invalid type" });
        }

        if (!await checkPermission(req.user._id, type, dbName)) {
            return res.status(403).json({ err: true, msg: "access denied" });
        }

        if (!query.args || query.args.length === 0) {
            return res.status(400).json({ err: true, msg: "args is required" });
        }

        const collection = query.args.shift();

        if (!collection) {
            return res.status(400).json({ err: true, msg: "collection is required" });
        }
        if (!isPathSafe(global.baseDir, dir, collection)) {
            return res.status(400).json({ err: true, msg: "invalid collection" });
        }

        const result = await db[type](collection, ...query.args as any[]);
        return res.json({ err: false, result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ err: true, msg: err.message });
    }
});

export default router;