import { isValtheraError } from "@wxn0brp/db-core/errors";
import { deserializeFunctions } from "@wxn0brp/wts-run-fn";
import { dataCenter } from "../../init/initDataBases.js";
import { runtime_dir } from "../../init/vars.js";
import { isPathSafe } from "../../utils/path.js";
import logger from "../../utils/logger.js";
import { checkAnyAccess, checkPermission } from "../../utils/perm.js";
import { beginTx, commitTx, getSession, rollbackTx, touch } from "./tx.js";
export class Response {
    err;
    result;
    msg;
    code;
    errorCode;
    suggestion;
    context;
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
    error(err, code = 500) {
        this.err = true;
        this.msg = err?.message ?? String(err);
        this.code = code;
        if (isValtheraError(err)) {
            this.errorCode = err.code;
            this.suggestion = err.suggestion;
            this.context = err.context;
        }
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
        if (this.errorCode)
            response.code = this.errorCode;
        if (this.suggestion)
            response.suggestion = this.suggestion;
        if (this.context)
            response.context = this.context;
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
    Codes["COLLECTIONS_REQ"] = "collections is required";
    Codes["TRANSACTION_REQ"] = "transaction is required";
    Codes["INVALID_TRANSACTION"] = "invalid or expired transaction";
    Codes["COLLECTION_NOT_IN_TRANSACTION"] = "collection is not part of the transaction";
})(Codes || (Codes = {}));
const collectionOp = new Set([
    "ensureCollection",
    "issetCollection",
    "removeCollection",
]);
const txControl = new Set([
    "beginTransaction",
    "commitTransaction",
    "rollbackTransaction",
]);
const SERVER_CAPABILITIES = {
    transactions: true,
    indexes: false,
    persistent: true,
};
function intersectCapabilities(caps) {
    return {
        transactions: caps.transactions && SERVER_CAPABILITIES.transactions,
        indexes: caps.indexes && SERVER_CAPABILITIES.indexes,
        persistent: caps.persistent && SERVER_CAPABILITIES.persistent,
    };
}
export async function dbLogic(serverQuery) {
    const { type, dbName, userId, query, keys } = serverQuery;
    const res = new Response();
    const dbObj = dataCenter[dbName];
    if (!dbObj)
        return res.e(Codes.INVALID_DB);
    if (!type)
        return res.e(Codes.TYPE_REQ);
    const { db, dir: dbDir } = dbObj;
    if (txControl.has(type)) {
        try {
            if (!(await checkAnyAccess(userId, dbName)))
                return res.e(Codes.ACCESS_DENIED, 403);
            if (type === "beginTransaction") {
                const collections = query?.collections;
                if (!Array.isArray(collections) || !collections.length)
                    return res.e(Codes.COLLECTIONS_REQ);
                for (const collection of collections) {
                    if (typeof collection !== "string" ||
                        !collection ||
                        !isPathSafe(runtime_dir, dbDir, collection))
                        return res.e(Codes.INVALID_COLLECTION);
                }
                const id = await beginTx(db, dbName, userId, collections);
                return res.r({
                    id,
                });
            }
            const id = query?.transaction?.id;
            if (!id)
                return res.e(Codes.TRANSACTION_REQ);
            if (type === "commitTransaction") {
                await commitTx(id, userId, dbName);
                return res.r(true);
            }
            await rollbackTx(id, userId, dbName);
            return res.r(true);
        }
        catch (err) {
            logger.error(err);
            return res.error(err);
        }
    }
    try {
        if (!db[type] || typeof db[type] !== "function")
            return res.e(Codes.INVALID_TYPE);
        if (!(await checkPermission(userId, type, dbName)))
            return res.e(Codes.ACCESS_DENIED, 403);
        if (type === "getCollections") {
            const collections = await db.getCollections();
            return res.r(collections);
        }
        if (type === "capabilities") {
            const caps = await db.capabilities();
            return res.r(intersectCapabilities(caps));
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
        const txId = parsedVQuery?.transaction?.id;
        if (txId) {
            const session = getSession(txId);
            if (!session)
                return res.e(Codes.INVALID_TRANSACTION);
            if (session.userId !== userId || session.dbName !== dbName)
                return res.e(Codes.ACCESS_DENIED, 403);
            if (!session.collections.has(parsedVQuery.collection))
                return res.e(Codes.COLLECTION_NOT_IN_TRANSACTION);
            touch(session);
            if (collectionOp.has(type))
                return res.r(await db.execute(type, parsedVQuery.collection, session.handle));
            return res.r(await db.execute(type, parsedVQuery, session.handle));
        }
        if (collectionOp.has(type))
            return res.r(await db[type](parsedVQuery.collection));
        return res.r(await db[type](parsedVQuery));
    }
    catch (err) {
        logger.error(err);
        return res.error(err);
    }
}
