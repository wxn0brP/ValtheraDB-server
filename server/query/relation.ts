import { Id, Relation, RelationTypes, Valthera, ValtheraRemote } from "@wxn0brp/db";
import { Remote } from "@wxn0brp/db/dist/client/remote";

interface AccessCfg {
    [key: string]: Remote | string;
}

async function createRelation(accessCfg: AccessCfg, userId: Id, res: any): Promise<Relation | false> {
    const dbs: { [key: string]: Valthera | ValtheraRemote } = {};

    for (const key in accessCfg) {
        const remote = accessCfg[key];
        if (typeof remote === "string") {
            if (!global.dataCenter[remote]) {
                res.status(400).json({ err: true, msg: `remote ${remote} not found` });
                return false;
            }
            dbs[key] = global.dataCenter[remote].db as Valthera;
            if (!await checkPermission(userId, "find", remote)) {
                res.status(403).json({ err: true, msg: `access denied to ${remote}` });
                return false;
            }
        } else {
            dbs[key] = new ValtheraRemote(remote);
        }
    }

    const relation = new Relation(dbs);
    return relation;
}

function checkCollections(
    baseDir: string,
    accessCfg: AccessCfg,
    relation: RelationTypes.Relation
): boolean | RelationTypes.Path {
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

import { Router } from "express";
import deserializeFunctions from "./function";
import { isPathSafe } from "../utils/path";
import { checkPermission } from "../utils/perm";
const router = Router();

router.post('/:type', async (req, res) => {
    const { type } = req.params as { type: string };

    if (!type) {
        return res.status(400).json({ err: true, msg: "type is required" });
    }

    if (!req.body.accessCfg) {
        return res.status(400).json({ err: true, msg: "accessCfg is required" });
    }

    try {
        const relation = await createRelation(req.body.accessCfg, req.user._id, res);
        if (!relation) return;

        if (!relation[type] || typeof relation[type] !== "function") {
            return res.status(400).json({ err: true, msg: "invalid type" });
        }

        const params = req.body.params as (Object | string)[];
        if (!params || params.length <= 2)
            return res.status(400).json({ err: true, msg: "params is required" });

        // const keys = req.body.keys as string[];
        // const parsedParams = deserializeFunctions(params, keys || []);

        const collection = params.shift() as string[];
        if (!collection || collection.length !== 2) 
            return res.status(400).json({ err: true, msg: "collection is required" });
        
        if (!isPathSafe(global.baseDir, "", collection[1])) 
            return res.status(400).json({ err: true, msg: "invalid collection" });

        const check = checkCollections(global.baseDir, req.body.accessCfg, params[1] as any);
        if (typeof check === "object") {
            return res.status(400).json({ err: true, msg: "invalid accessCfg collection " + JSON.stringify(check) });
        }

        const result = await relation[type](collection, ...params as any[]);

        res.json({ err: false, result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ err: true, msg: err.message });
    }
});

export default router;