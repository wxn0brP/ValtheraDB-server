import { Relation } from "@wxn0brp/db";
import { ValtheraRemote } from "@wxn0brp/db-client";
import { Router } from "@wxn0brp/falcon-frame";
import { changeStringToFunction } from "@wxn0brp/wts-run-fn";
import { dataCenter } from "../init/initDataBases.js";
import { runtime_dir } from "../init/vars.js";
import { isPathSafe } from "../utils/path.js";
import logger from "../utils/logger.js";
import { checkPermission } from "../utils/perm.js";
import { deserializeRegex } from "../utils/regex.js";
export const relationRouter = new Router();
async function createRelation(accessCfg, userId, res) {
    const dbs = {};
    for (const key in accessCfg) {
        const remote = accessCfg[key];
        if (typeof remote === "string") {
            if (!dataCenter[remote]) {
                res.status(400).json({
                    err: true,
                    msg: `remote ${remote} not found`,
                });
                return false;
            }
            dbs[key] = dataCenter[remote].db;
            if (!(await checkPermission(userId, "find", remote))) {
                res.status(403).json({
                    err: true,
                    msg: `access denied to ${remote}`,
                });
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
        if (!cfg || typeof cfg !== "object")
            return [
                "<invalid>",
                "entry",
            ];
        const relPath = cfg.path;
        if (!Array.isArray(relPath) || relPath.length !== 2)
            return [
                "<invalid>",
                "path",
            ];
        const [db, collection] = relPath;
        if (typeof db !== "string" || typeof collection !== "string")
            return [
                "<invalid>",
                "path",
            ];
        if (!Object.hasOwn(accessCfg, db))
            return relPath;
        const remote = accessCfg[db];
        const isRemote = typeof remote !== "string";
        if (!isRemote) {
            const dir = dataCenter[remote]?.dir;
            if (!dir || !isPathSafe(baseDir, dir, collection))
                return relPath;
        }
        if (cfg.relations) {
            const res = checkCollections(baseDir, accessCfg, cfg.relations);
            if (res !== true)
                return res;
        }
    }
    return true;
}
relationRouter.post("/:type", async (req, res) => {
    const { type } = req.params;
    if (!req.body.accessCfg)
        return res.status(400).json({
            err: true,
            msg: "accessCfg is required",
        });
    try {
        const relation = await createRelation(req.body.accessCfg, req.user._id, res);
        if (!relation)
            return;
        if (type !== "find" && type !== "findOne")
            return res.status(400).json({
                err: true,
                msg: "invalid type",
            });
        const params = req.body.params;
        if (!params || params.length <= 2)
            return res.status(400).json({
                err: true,
                msg: "params is required",
            });
        const collection = params.shift();
        if (!Array.isArray(collection) ||
            collection.length !== 2 ||
            typeof collection[0] !== "string" ||
            typeof collection[1] !== "string")
            return res.status(400).json({
                err: true,
                msg: "collection is required",
            });
        const localName = req.body.accessCfg[collection[0]];
        if (localName === undefined)
            return res.status(400).json({
                err: true,
                msg: "unknown database in collection path",
            });
        if (typeof localName === "string") {
            const dir = dataCenter[localName]?.dir;
            if (!dir || !isPathSafe(runtime_dir, dir, collection[1]))
                return res.status(400).json({
                    err: true,
                    msg: "invalid collection",
                });
        }
        const check = checkCollections(runtime_dir, req.body.accessCfg, params[1]);
        if (typeof check === "object")
            return res.status(400).json({
                err: true,
                msg: "invalid accessCfg collection " + JSON.stringify(check),
            });
        let search = params.shift();
        if (typeof search === "string")
            search = changeStringToFunction(search);
        else if (search && typeof search === "object")
            search = deserializeRegex(search);
        const relationFn = relation[type];
        const result = await relationFn(collection, search, ...params);
        res.json({
            err: false,
            result,
        });
    }
    catch (err) {
        logger.error(err);
        res.status(500).json({
            err: true,
            msg: err.message,
        });
    }
});
