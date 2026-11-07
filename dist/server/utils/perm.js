import { AnotherCache } from "@wxn0brp/ac";
import { isKnownOp } from "@wxn0brp/db-core/utils/opKind";
import { warden } from "../init/initDataBases.js";
const PERM_CACHE_TTL = (parseInt(process.env.PERM_CACHE_TTL) || 900) * 1000; // 15 minutes
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
const OP_REQUIRED = {
    find: Permissions.FIND,
    findOne: Permissions.FIND,
    count: Permissions.FIND,
    add: Permissions.ADD,
    bulkAdd: Permissions.ADD,
    update: Permissions.UPDATE,
    updateOne: Permissions.UPDATE,
    updateOneOrAdd: Permissions.UPDATE | Permissions.ADD,
    toggleOne: Permissions.REMOVE | Permissions.ADD,
    remove: Permissions.REMOVE,
    removeOne: Permissions.REMOVE,
    ensureCollection: Permissions.COLLECTION,
    issetCollection: Permissions.COLLECTION,
    removeCollection: Permissions.COLLECTION,
    createIndex: Permissions.COLLECTION,
    removeIndex: Permissions.COLLECTION,
    getCollections: Permissions.COLLECTION,
    capabilities: Permissions.COLLECTION,
};
export function requiredBits(op) {
    if (!isKnownOp(op))
        return null;
    const mask = OP_REQUIRED[op];
    if (mask === undefined)
        return null;
    const bits = [];
    for (let bit = 1; bit <= mask; bit <<= 1) {
        if (mask & bit)
            bits.push(bit);
    }
    return bits;
}
export async function checkPermission(user, operation, dataCenter) {
    const required = requiredBits(operation);
    if (!required)
        return false;
    for (const r of required) {
        const key = `${user}_${r}_${dataCenter}`;
        let granted = cache.get(key);
        if (granted === undefined) {
            const perm = await warden.hasAccess(user, dataCenter, r);
            granted = perm.granted;
            cache.set(key, granted);
        }
        if (!granted)
            return false;
    }
    return true;
}
/**
 * Whether the user can perform any CRUD operation on the data center.
 * Used to gate opening a transaction without requiring a specific operation bit.
 */
export async function checkAnyAccess(user, dataCenter) {
    for (const op of [
        "find",
        "add",
        "update",
        "remove",
    ]) {
        if (await checkPermission(user, op, dataCenter))
            return true;
    }
    return false;
}
