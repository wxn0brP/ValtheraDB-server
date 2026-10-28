import { AnotherCache } from "@wxn0brp/ac";
import { Id } from "@wxn0brp/db";
import { warden } from "../init/initDataBases";

const PERM_CACHE_TTL = (parseInt(process.env.PERM_CACHE_TTL) || 900) * 1000; // 15 minutes
export const cache = new AnotherCache<boolean>({
	ttl: PERM_CACHE_TTL,
	cleanupInterval: PERM_CACHE_TTL,
});

export enum Permissions {
	FIND = 1,
	ADD = 2,
	REMOVE = 4,
	UPDATE = 8,
	COLLECTION = 16,
	UNKNOWN = 32,
}

export async function checkPermission(
	user: Id,
	operation: string,
	dataCenter: string,
): Promise<boolean> {
	const required: number[] = [];
	const op = operation.toUpperCase();
	if (op.includes("FIND")) required.push(Permissions.FIND);
	if (op.includes("ADD")) required.push(Permissions.ADD);
	if (op.includes("REMOVE")) required.push(Permissions.REMOVE);
	if (op.includes("UPDATE")) required.push(Permissions.UPDATE);
	if (op.includes("COLLECTION")) required.push(Permissions.COLLECTION);
	if (op.includes("TOGGLE")) required.push(Permissions.REMOVE, Permissions.ADD);
	if (!required.length) required.push(Permissions.UNKNOWN);

	for (const r of new Set(required)) {
		const key = `${user}_${r}_${dataCenter}`;
		let granted = cache.get(key);

		if (granted === undefined) {
			const perm = await warden.hasAccess(user, dataCenter, r);
			granted = perm.granted;
			cache.set(key, granted);
		}

		if (!granted) return false;
	}

	return true;
}

/**
 * Whether the user can perform any CRUD operation on the data center.
 * Used to gate opening a transaction without requiring a specific operation bit.
 */
export async function checkAnyAccess(
	user: Id,
	dataCenter: string,
): Promise<boolean> {
	for (const op of [
		"find",
		"add",
		"update",
		"remove",
	]) {
		if (await checkPermission(user, op, dataCenter)) return true;
	}
	return false;
}
