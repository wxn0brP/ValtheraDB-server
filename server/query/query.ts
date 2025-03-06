import { Router } from "express";
import { isPathSafe } from "../utils/path";
import { checkPermission } from "../utils/perm";
import { DataBase } from "@wxn0brp/db";
import { ValtheraDbParsers } from "@wxn0brp/valthera-db-string-query";
const router = Router();

const ValtheraParsers = {};
for (const [name, parser] of Object.entries(ValtheraDbParsers)) {
    ValtheraParsers[name] = new parser();
}

function getDb(name: string) {
    const dbData = global.dataCenter[name];
    if (!dbData) return null;
    return dbData.db as DataBase;
}

function findMatchingString(query: string, options: string[]): string | null {
    const lowerQuery = query.toLowerCase();
    const matches = options.filter(opt => opt.toLowerCase().includes(lowerQuery));
    if (matches.length === 1) return matches[0];
    if (matches.length === 0) return null;
    return null;
}

function getParser(parserType: string) {
    const parser = ValtheraParsers[parserType];
    if(parser) return parser;

    const parserName = findMatchingString(parserType, Object.keys(ValtheraParsers));
    if(parserName) return ValtheraParsers[parserName];

    return null;
}

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

    const db = getDb(dbName);
    if (!db) {
        return res.status(400).json({ err: true, msg: "Invalid data center." });
    }

    try {
        let query;
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

        if(!db[type] || typeof db[type] !== "function"){
            return res.status(400).json({ err: true, msg: "invalid type" });
        }

        if(!await checkPermission(req.user._id, type, dbName)){
            return res.status(403).json({ err: true, msg: "access denied" });
        }

        if (!query.args || query.args.length === 0) {
            return res.status(400).json({ err: true, msg: "args is required" });
        }

        const collection = query.args.shift();

        if (!collection) {
            return res.status(400).json({ err: true, msg: "collection is required" });
        }
        if (!isPathSafe(global.baseDir, collection)) {
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