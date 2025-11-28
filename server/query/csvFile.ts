import { Router } from "@wxn0brp/falcon-frame";
import { parseCSV } from "../utils/csvParser";
import { isPathSafe } from "../utils/path";
import { checkPermission } from "../utils/perm";
import { getDb } from "./query/utils";

const router = new Router();

router.post("/import", async (req, res) => {
    const dbName = req.body.db;
    const csvContent = req.body.content;
    const collection = req.body.collection as string || "";

    if (!dbName || !csvContent || !collection) {
        return res.status(400).json({ err: true, msg: "db, content, and collection are required" });
    }

    const dbGet = getDb(dbName);
    if (!dbGet) {
        return res.status(400).json({ err: true, msg: "Invalid data center." });
    }

    const { db, dir } = dbGet;

    try {
        const parsed = parseCSV(csvContent);

        const type = "add";
        if (!db[type] || typeof db[type] !== "function") {
            return res.status(400).json({ err: true, msg: `Invalid query type: ${type}` });
        }

        if (!(await checkPermission(req.user._id, type, dbName))) {
            return res.status(403).json({ err: true, msg: "Access denied for query type: " + type });
        }

        if (collection && !isPathSafe(global.baseDir, dir, collection)) {
            return res.status(400).json({ err: true, msg: "Invalid collection: " + collection });
        }

        const results = []
        for (const row of parsed) {
            const result = await db.add(collection, row);
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
    const collection = req.body.collection as string || "";

    if (!dbName || !collection) {
        return res.status(400).json({ err: true, msg: "db and collection is required" });
    }

    const dbGet = getDb(dbName);
    if (!dbGet) {
        return res.status(400).json({ err: true, msg: "Invalid data center." });
    }


    const { db, dir } = dbGet;

    try {
        if (!await checkPermission(req.user._id, "find", dbName)) return res.status(403).json({ err: true, msg: "Access denied for query type: find" });

        if (collection && !isPathSafe(global.baseDir, dir, collection)) {
            return res.status(400).json({ err: true, msg: "Invalid collection: " + collection });
        }

        const data = await db.find(collection);
        const keys = Object.keys(Object.assign({}, ...data));
        const rows = data.map((item) =>
            keys.map((key) => {
                const value = item[key];
                if (value === null || value === undefined) return "";
                if (typeof value === "object") return JSON.stringify(value);
                if (typeof value === "string") return `"${value}"`;
                return item[key];
            }
            ).join(",")).join("\n");
        const result = `${keys.join(",")}\n${rows}`;

        return res.json({ err: false, result });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ err: true, msg: err.message });
    }

});

export default router;