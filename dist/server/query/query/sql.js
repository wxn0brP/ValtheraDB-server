import { ValtheraDbParsers } from "@wxn0brp/valthera-db-string-query";
import { checkPermission } from "../../utils/perm.js";
import { getDb } from "./utils.js";
import { isPathSafe } from "../../utils/path.js";
export const sqlProxy = async (req, res) => {
    if (!req.body.query) {
        return res.status(400).json({ err: true, msg: "query is required" });
    }
    if (!req.body.db) {
        return res.status(400).json({ err: true, msg: "db is required" });
    }
    const parser = new ValtheraDbParsers.sql();
    try {
        const query = parser.parse(req.body.query);
        if (!query)
            throw new Error("Invalid query");
        const type = query.method;
        if (!await checkPermission(req.user._id, type, req.body.db)) {
            return res.status(403).json({ err: true, msg: "access denied" });
        }
        const dbData = getDb(req.body.db);
        if (!dbData) {
            return res.status(400).json({ err: true, msg: "Invalid data center." });
        }
        const { db, dir } = dbData;
        // if (type === "getCollections") {
        //     const collections = await db.getCollections();
        //     return {
        //         columns: ["affected_rows"],
        //         rows: [[1]]
        //     }
        // }
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
        const result = await db[type](collection, ...query.args);
        if (type === "find" || type === "findOne") {
            const data = Array.isArray(result) ? result : [result];
            const keys = Object.keys(Object.assign({}, ...data));
            return {
                columns: keys,
                rows: data.map(d => keys.map(k => d[k] || null))
            };
        }
        throw new Error("OK");
    }
    catch {
        return {
            columns: ["affected_rows"],
            rows: [[1]]
        };
    }
};
