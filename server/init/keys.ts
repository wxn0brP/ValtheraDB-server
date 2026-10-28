import { JwtManager, KeyIndex } from "@wxn0brp/wts-jwt";
import getSecret from "../vars/secret";
import { internalDB } from "./initDataBases";

let manager: Promise<JwtManager> | null = null;

function getJwtManager() {
	manager ??= (async () => {
		const jwt = new JwtManager(KeyIndex, await getSecret());
		await jwt.init(internalDB);
		return jwt;
	})();
	return manager;
}

export async function initKeys() {
	await getJwtManager();
}

const jwtManager = {
	async create(...args: Parameters<JwtManager["create"]>) {
		return (await getJwtManager()).create(...args);
	},
	async decode(...args: Parameters<JwtManager["decode"]>) {
		return (await getJwtManager()).decode(...args);
	},
};

export default jwtManager;
