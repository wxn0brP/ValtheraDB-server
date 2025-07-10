import deserializeFunctions from "./function.js";
import { isPathSafe } from "../utils/path.js";
import { checkPermission } from "../utils/perm.js";
import { Router } from "@wxn0brp/falcon-frame";
const router = new Router();
router.post('/:type', async (req, res) => {
    const { type } = req.params;
    if (!type) {
        return res.status(400).json({ err: true, msg: "type is required" });
    }
    try {
        const db = req.dataCenter;
        if (type === "getCollections") {
            const collections = await db.getCollections();
            return res.json({ err: false, result: collections });
        }
        if (!db[type] || typeof db[type] !== "function") {
            return res.status(400).json({ err: true, msg: "invalid type" });
        }
        if (!await checkPermission(req.user._id, type, req.body.db)) {
            return res.status(403).json({ err: true, msg: "access denied" });
        }
        const params = req.body.params;
        if (!params || params.length === 0)
            return res.status(400).json({ err: true, msg: "params is required" });
        const keys = req.body.keys;
        const parsedParams = deserializeFunctions(params, keys || []);
        const collection = params.shift();
        if (!collection) {
            return res.status(400).json({ err: true, msg: "collection is required" });
        }
        if (!isPathSafe(global.baseDir, req.dbDir, collection)) {
            return res.status(400).json({ err: true, msg: "invalid collection" });
        }
        const result = await db[type](collection, ...parsedParams);
        res.json({ err: false, result });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ err: true, msg: err.message });
    }
});
export default router;
