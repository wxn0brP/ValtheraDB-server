import { checkPermission } from "../../utils/perm.js";
import deserializeFunctions from "../function.js";
import { isPathSafe } from "../../utils/path.js";
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
        if (this.result)
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
    Codes["PARAMS_REQ"] = "params is required";
    Codes["COLLECTION_REQ"] = "collection is required";
    Codes["INVALID_COLLECTION"] = "invalid collection";
})(Codes || (Codes = {}));
export async function dbLogic(query) {
    const { type, dbName, userId, params, keys } = query;
    const res = new Response();
    const dbObj = global.dataCenter[dbName];
    if (!dbObj)
        return res.e(Codes.INVALID_DB);
    if (!type)
        return res.e(Codes.TYPE_REQ);
    try {
        const { db, dir: dbDir } = dbObj;
        if (type === "getCollections") {
            const collections = await db.getCollections();
            return res.r(collections);
        }
        if (!db[type] || typeof db[type] !== "function")
            return res.e(Codes.INVALID_TYPE);
        if (!await checkPermission(userId, type, dbName))
            return res.e(Codes.ACCESS_DENIED, 403);
        if (!params || params.length === 0)
            return res.e(Codes.PARAMS_REQ);
        const parsedParams = deserializeFunctions(params, keys || []);
        const collection = params.shift();
        if (!collection)
            return res.e(Codes.COLLECTION_REQ);
        if (!isPathSafe(global.baseDir, dbDir, collection))
            return res.e(Codes.INVALID_COLLECTION);
        const result = await db[type](collection, ...parsedParams);
        return res.r(result);
    }
    catch (err) {
        console.error(err);
        return res.e(err.message, 500);
    }
}
