import { AnotherCache } from "@wxn0brp/ac";
import { warden } from "../init/initDataBases.js";
const PERM_CACHE_TTL = parseInt(process.env.PERM_CACHE_TTL) || 900; // 15 minutes
export const cache = new AnotherCache({
    ttl: PERM_CACHE_TTL,
    cleanupInterval: PERM_CACHE_TTL,
});
export var Permissions;
(function (Permissions) {
    Permissions[Permissions["FIND"] = 1] = "FIND";
    Permissions[Permissions["ADD"] = 2] = "ADD";
    Permissions[Permissions["REMOVE"] = 4] = "REMOVE";
    Permissions[Permissions["UPDATE"] = 8] = "UPDATE";
    Permissions[Permissions["COLLECTION"] = 16] = "COLLECTION";
    Permissions[Permissions["UNKNOWN"] = 32] = "UNKNOWN";
})(Permissions || (Permissions = {}));
export async function checkPermission(user, operation, dataCenter) {
    const required = [];
    const op = operation.toUpperCase();
    if (op.includes("FIND"))
        required.push(Permissions.FIND);
    if (op.includes("ADD"))
        required.push(Permissions.ADD);
    if (op.includes("REMOVE"))
        required.push(Permissions.REMOVE);
    if (op.includes("UPDATE"))
        required.push(Permissions.UPDATE);
    if (op.includes("COLLECTION"))
        required.push(Permissions.COLLECTION);
    if (op.includes("TOGGLE"))
        required.push(Permissions.REMOVE, Permissions.ADD);
    if (!required.length)
        required.push(Permissions.UNKNOWN);
    for (const r of required) {
        const key = `${user}_${r}_${dataCenter}`;
        if (cache.has(key))
            return cache.get(key);
        const perm = await warden.hasAccess(user, dataCenter, r);
        cache.set(key, perm.granted);
        if (!perm.granted)
            return false;
    }
    return true;
}
