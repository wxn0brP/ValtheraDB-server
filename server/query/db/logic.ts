import { ValtheraCompatible } from "@wxn0brp/db";
import { checkPermission } from "../../utils/perm";
import deserializeFunctions from "../function";
import { isPathSafe } from "../../utils/path";
import { FFResponse } from "@wxn0brp/falcon-frame";

export interface Query {
    type: string;
    // db: ValtheraCompatible;
    dbName: string;
    // dbDir: string;
    userId: string;
    params: (Object | string)[];
    keys: string[];
}

export class Response {
    err: boolean;
    result: any;
    msg: Codes;
    code?: number;

    e(msg: Codes, code: number = 400) {
        this.err = true;
        this.msg = msg;
        this.code = code;
        return this;
    }

    r(result: any) {
        this.err = false;
        this.result = result;
        return this;
    }

    ff(res: FFResponse) {
        const response: any = {
            err: this.err,
        };
        if (this.code) res.status(this.code);
        if (this.msg) response.msg = this.msg;
        if (this.result) response.result = this.result;
        return res.json(response);
    }
}

export enum Codes {
    INVALID_DB = "Invalid data center.",
    TYPE_REQ = "type is required",
    INVALID_TYPE = "invalid type",
    ACCESS_DENIED = "access denied",
    PARAMS_REQ = "params is required",
    COLLECTION_REQ = "collection is required",
    INVALID_COLLECTION = "invalid collection"
}

export async function dbLogic(query: Query): Promise<Response> {
    const {
        type,
        dbName,
        userId,
        params,
        keys
    } = query;
    const res = new Response();

    const dbObj = global.dataCenter[dbName];
    if (!dbObj) return res.e(Codes.INVALID_DB);
    if (!type) return res.e(Codes.TYPE_REQ);

    try {
        const { db, dir: dbDir } = dbObj;
        if (type === "getCollections") {
            const collections = await db.getCollections();
            return res.r(collections);
        }

        if (!db[type] || typeof db[type] !== "function") return res.e(Codes.INVALID_TYPE);

        if (!await checkPermission(userId, type, dbName)) return res.e(Codes.ACCESS_DENIED, 403);

        if (!params || params.length === 0) return res.e(Codes.PARAMS_REQ);

        const parsedParams = deserializeFunctions(params, keys || []);

        const collection = params.shift() as string;
        if (!collection) return res.e(Codes.COLLECTION_REQ);

        if (!isPathSafe(global.baseDir, dbDir, collection)) return res.e(Codes.INVALID_COLLECTION);

        const result = await db[type](collection, ...parsedParams as any[]);

        return res.r(result);
    } catch (err) {
        console.error(err);
        return res.e(err.message, 500);
    }
}