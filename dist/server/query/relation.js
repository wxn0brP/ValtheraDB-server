import { Relation } from "@wxn0brp/db";
import { ValtheraRemote } from "@wxn0brp/db-client";
import { Router } from "@wxn0brp/falcon-frame";
import { dataCenter } from "../init/initDataBases.js";
import { runtime_dir } from "../init/vars.js";
import { isPathSafe } from "../utils/path.js";
import { checkPermission } from "../utils/perm.js";
const router = new Router();
async function createRelation(accessCfg, userId, res) {
    const dbs = {};
    for (const key in accessCfg) {
        const remote = accessCfg[key];
        if (typeof remote === "string") {
            if (!dataCenter[remote]) {
                res.status(400).json({ err: true, msg: `remote ${remote} not found` });
                return false;
            }
            dbs[key] = dataCenter[remote].db;
            if (!await checkPermission(userId, "find", remote)) {
                res.status(403).json({ err: true, msg: `access denied to ${remote}` });
                return false;
            }
        }
        else {
            dbs[key] = new ValtheraRemote(remote);
        }
    }
    const relation = new Relation(dbs);
    return relation;
}
function checkCollections(baseDir, accessCfg, relation) {
    for (const cfg of Object.values(relation)) {
        const [db, collection] = cfg.path;
        const isRemote = typeof accessCfg[db] !== "string";
        if (!isRemote && !isPathSafe(baseDir, db, collection)) {
            return cfg.path;
        }
        if (cfg.relations) {
            const res = checkCollections(baseDir, accessCfg, cfg.relations);
            return res === true ? true : res;
        }
    }
    return true;
}
router.post('/:type', async (req, res) => {
    const { type } = req.params;
    if (!type) {
        return res.status(400).json({ err: true, msg: "type is required" });
    }
    if (!req.body.accessCfg) {
        return res.status(400).json({ err: true, msg: "accessCfg is required" });
    }
    try {
        const relation = await createRelation(req.body.accessCfg, req.user._id, res);
        if (!relation)
            return;
        if (!relation[type] || typeof relation[type] !== "function") {
            return res.status(400).json({ err: true, msg: "invalid type" });
        }
        const params = req.body.params;
        if (!params || params.length <= 2)
            return res.status(400).json({ err: true, msg: "params is required" });
        const collection = params.shift();
        if (!collection || collection.length !== 2)
            return res.status(400).json({ err: true, msg: "collection is required" });
        if (!isPathSafe(runtime_dir, "", collection[1]))
            return res.status(400).json({ err: true, msg: "invalid collection" });
        const check = checkCollections(runtime_dir, req.body.accessCfg, params[1]);
        if (typeof check === "object") {
            return res.status(400).json({ err: true, msg: "invalid accessCfg collection " + JSON.stringify(check) });
        }
        const result = await relation[type](collection, ...params);
        res.json({ err: false, result });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ err: true, msg: err.message });
    }
});
export default router;
