import { AnotherCache } from "@wxn0brp/ac";
import { Id } from "@wxn0brp/db";

const PERM_CACHE_TTL = parseInt(process.env.PERM_CACHE_TTL) || 900; // 15 minutes
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

export async function checkPermission(user: Id, operation: string, dataCenter: string): Promise<boolean> {
    const required: number[] = [];
    const op = operation.toUpperCase();
    if (op.includes("FIND")) required.push(Permissions.FIND);
    if (op.includes("ADD")) required.push(Permissions.ADD);
    if (op.includes("REMOVE")) required.push(Permissions.REMOVE);
    if (op.includes("UPDATE")) required.push(Permissions.UPDATE);
    if (op.includes("COLLECTION")) required.push(Permissions.COLLECTION);
    if (!required.length) required.push(Permissions.UNKNOWN);

    for (const r of required) {
        const key = `${user}_${r}_${dataCenter}`;
        if (cache.has(key)) return cache.get(key);

        const perm = await global.warden.hasAccess(user, dataCenter, r);
        cache.set(key, perm.granted);

        if (!perm.granted) return false;
    }

    return true;
}