import { Id } from "@wxn0brp/db";
import NodeCache from "node-cache";

const PERM_CACHE_TTL = parseInt(process.env.PERM_CACHE_TTL) || 900; // 15 minutes
export const cache = new NodeCache({ stdTTL: PERM_CACHE_TTL, checkperiod: PERM_CACHE_TTL });

export enum Permissions {
    FIND = 1,
    ADD = 2,
    REMOVE = 4,
    UPDATE = 8,
    COLLECTION = 16,
    UNKNOWN = 32,
}

export function hasPermission(userPermissions: number, requiredPermission: number): boolean {
    return (userPermissions & requiredPermission) === requiredPermission;
}

export function hasOperationPermission(userPermissions: number, operation: string): boolean {
    operation = operation.toUpperCase();
    const permissionsKeys = Object.keys(Permissions);
    let hasPerm = false;
    for (let i = 0; i < permissionsKeys.length; i++) {
        const key = permissionsKeys[i];
        if (!isNaN(parseInt(key))) continue;

        if (operation.includes(key)) {
            const requiredPermission = Permissions[key];
            let perm = hasPermission(userPermissions, requiredPermission);
            if (!perm) return false;
            hasPerm = true;
        }
    }
    if (hasPerm) return true;
    return hasPermission(userPermissions, Permissions.UNKNOWN);
}

async function getUserPermissions(user: Id, dataCenter: string): Promise<number> {
    const cacheKey = user + "=" + dataCenter;
    if (cache.has(cacheKey)) return cache.get<number>(cacheKey);

    const dataCenterPermissions = await global.internalDB.findOne("perm", { u: user, to: dataCenter });
    if (dataCenterPermissions) {
        cache.set(cacheKey, dataCenterPermissions.p);
        return dataCenterPermissions.p;
    }

    const globalUserPermissions = await global.internalDB.findOne("perm", { u: user, to: "$" });
    if (globalUserPermissions) {
        cache.set(cacheKey, globalUserPermissions.p);
        return globalUserPermissions.p;
    }

    return 0;
}

export async function checkPermission(user: Id, operation: string, dataCenter: string): Promise<boolean> {
    const userPermissions = await getUserPermissions(user, dataCenter);
    return hasOperationPermission(userPermissions, operation);
}