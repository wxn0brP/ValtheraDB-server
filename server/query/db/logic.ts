import { VQuery } from "@wxn0brp/db-core/types/query";
import { FFResponse } from "@wxn0brp/falcon-frame";
import { deserializeFunctions } from "@wxn0brp/wts-run-fn";
import { dataCenter } from "../../init/initDataBases";
import { runtime_dir } from "../../init/vars";
import { isPathSafe } from "../../utils/path";
import logger from "../../utils/logger";
import { checkPermission } from "../../utils/perm";

export interface Query {
	type: string;
	// db: ValtheraCompatible;
	dbName: string;
	// dbDir: string;
	userId: string;
	query: VQuery;
	keys: string[][];
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
		if (this.result !== undefined) response.result = this.result;
		return res.json(response);
	}
}

export enum Codes {
	INVALID_DB = "Invalid data center.",
	TYPE_REQ = "type is required",
	INVALID_TYPE = "invalid type",
	ACCESS_DENIED = "access denied",
	QUERY_REQ = "query is required",
	QUERY_REQ_OBJ = "query must be an object",
	COLLECTION_REQ = "collection is required",
	INVALID_COLLECTION = "invalid collection",
}

const collectionOp = new Set([
	"ensureCollection",
	"issetCollection",
	"removeCollection",
]);

export async function dbLogic(serverQuery: Query): Promise<Response> {
	const { type, dbName, userId, query, keys } = serverQuery;
	const res = new Response();

	const dbObj = dataCenter[dbName];
	if (!dbObj) return res.e(Codes.INVALID_DB);
	if (!type) return res.e(Codes.TYPE_REQ);

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

		if (!query) return res.e(Codes.QUERY_REQ);
		if (typeof query !== "object") return res.e(Codes.QUERY_REQ_OBJ);
		if (!query.collection) return res.e(Codes.COLLECTION_REQ);

		const parsedVQuery = deserializeFunctions(query, keys || []) as VQuery;

		if (!isPathSafe(runtime_dir, dbDir, query.collection))
			return res.e(Codes.INVALID_COLLECTION);

		if (collectionOp.has(type)) {
			const result = await db[type](parsedVQuery.collection);
			return res.r(result);
		}

		const result = await db[type](parsedVQuery);
		return res.r(result);
	} catch (err) {
		logger.error(err);
		return res.e(err.message, 500);
	}
}
