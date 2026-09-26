import { deserializeFunctions } from "@wxn0brp/wts-run-fn";
import { dataCenter } from "../../init/initDataBases.js";
import { runtime_dir } from "../../init/vars.js";
import { isPathSafe } from "../../utils/path.js";
import logger from "../../utils/logger.js";
import { checkPermission } from "../../utils/perm.js";
export class Response {
    err;
    result;
    msg;
    code;
    e(msg, code = 400) {
        this.err = true;
        this.msg = msg;
        this.code = code;
        return this;
    }
    r(result) {
        this.err = false;
        this.result = result;
        return this;
    }
    ff(res) {
        const response = {
            err: this.err,
        };
        if (this.code)
            res.status(this.code);
        if (this.msg)
            response.msg = this.msg;
        if (this.result !== undefined)
            response.result = this.result;
        return res.json(response);
    }
}
export var Codes;
(function (Codes) {
    Codes["INVALID_DB"] = "Invalid data center.";
    Codes["TYPE_REQ"] = "type is required";
    Codes["INVALID_TYPE"] = "invalid type";
    Codes["ACCESS_DENIED"] = "access denied";
    Codes["QUERY_REQ"] = "query is required";
    Codes["QUERY_REQ_OBJ"] = "query must be an object";
    Codes["COLLECTION_REQ"] = "collection is required";
    Codes["INVALID_COLLECTION"] = "invalid collection";
})(Codes || (Codes = {}));
const collectionOp = new Set([
    "ensureCollection",
    "issetCollection",
    "removeCollection",
]);
export async function dbLogic(serverQuery) {
    const { type, dbName, userId, query, keys } = serverQuery;
    const res = new Response();
    const dbObj = dataCenter[dbName];
    if (!dbObj)
        return res.e(Codes.INVALID_DB);
    if (!type)
        return res.e(Codes.TYPE_REQ);
    try {
        const { db, dir: dbDir } = dbObj;
        if (!db[type] || typeof db[type] !== "function")
            return res.e(Codes.INVALID_TYPE);
        if (!(await checkPermission(userId, type, dbName)))
            return res.e(Codes.ACCESS_DENIED, 403);
        if (type === "getCollections") {
            const collections = await db.getCollections();
            return res.r(collections);
        }
        if (!query)
            return res.e(Codes.QUERY_REQ);
        if (typeof query !== "object")
            return res.e(Codes.QUERY_REQ_OBJ);
        if (!query.collection)
            return res.e(Codes.COLLECTION_REQ);
        const parsedVQuery = deserializeFunctions(query, keys || []);
        if (!isPathSafe(runtime_dir, dbDir, query.collection))
            return res.e(Codes.INVALID_COLLECTION);
        if (collectionOp.has(type)) {
            const result = await db[type](parsedVQuery.collection);
            return res.r(result);
        }
        const result = await db[type](parsedVQuery);
        return res.r(result);
    }
    catch (err) {
        logger.error(err);
        return res.e(err.message, 500);
    }
}
