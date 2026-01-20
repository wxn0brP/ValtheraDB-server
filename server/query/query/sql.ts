import { ValtheraDbParsers } from "@wxn0brp/db-string-query";
import { RouteHandler } from "@wxn0brp/falcon-frame";
import { runtime_dir } from "../../init/vars";
import { isPathSafe } from "../../utils/path";
import { checkPermission } from "../../utils/perm";
import { getDb } from "./utils";

export const sqlProxy: RouteHandler = async (req, res) => {
    if (!req.body.query) {
        return res.status(400).json({ err: true, msg: "query is required" });
    }

    if (!req.body.db) {
        return res.status(400).json({ err: true, msg: "db is required" });
    }

    const parser = new ValtheraDbParsers.sql();

    try {
        const query = parser.parse(req.body.query);
        if (!query) throw new Error("Invalid query");

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
        if (!isPathSafe(runtime_dir, dir, collection)) {
            return res.status(400).json({ err: true, msg: "invalid collection" });
        }

        const result = await db[type](collection, ...query.args as any[]);

        if (type === "find" || type === "findOne") {
            const data = Array.isArray(result) ? result : [result];
            const keys = Object.keys(Object.assign({}, ...data));
            return {
                columns: keys,
                rows: data.map(d => keys.map(k => d[k] || null))
            }
        }
        throw new Error("OK");
    } catch {
        return {
            columns: ["affected_rows"],
            rows: [[1]]
        }
    }
}