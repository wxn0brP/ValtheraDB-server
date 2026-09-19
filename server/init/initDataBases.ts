import { ValtheraCreate } from "@wxn0brp/db";
import { Valthera } from "@wxn0brp/db/valthera";
import { GateWarden } from "@wxn0brp/gate-warden";
import { User as GWUser } from "@wxn0brp/gate-warden/types/system";
import { join } from "path";
import { DataBaseBuilder } from "../types";
import { User as ServerUser } from "../types/user";
import { db_base_dir, internal_db_dir } from "./vars";

interface Token {
	_id: string;
	sha: string;
}

interface WolfToken {
	_id: string;
	token: string;
}

export const internalDB = ValtheraCreate<{
	dbs: DataBaseBuilder;
	user: ServerUser;
	users: GWUser;
	token: Token;
	wolf: WolfToken;
}>(internal_db_dir);

export const dataCenter: Record<
	string,
	{
		db: Valthera;
		dir: string;
	}
> = {};
export const warden = new GateWarden(internalDB);

export async function loadDataBases() {
	const databases = await internalDB.dbs.find();

	for (const key in dataCenter) delete dataCenter[key];

	for (const db of databases) {
		db.folder ||= db.name;

		const dir = db.folder.startsWith(".")
			? db.folder
			: join(db_base_dir, "data", db.folder);

		dataCenter[db.name] = {
			db: new Valthera(dir, db.opts || {}),
			dir,
		};
	}
}

await loadDataBases();
