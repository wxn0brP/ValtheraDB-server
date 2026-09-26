import { UserManager, WardenManager } from "@wxn0brp/gate-warden";
import crypto from "crypto";
import { generateHash } from "../server/auth/helpers.js";
import { internalDB } from "../server/init/initDataBases.js";
export const userMgmt = new UserManager(internalDB);
export const wardenMgmt = new WardenManager(internalDB);
const permissionFlags = {
    find: 1,
    f: 1,
    add: 2,
    a: 2,
    remove: 4,
    rm: 4,
    r: 4,
    update: 8,
    u: 8,
    collection: 16,
    c: 16,
    unknown: 32,
    n: 32,
    x: 32,
    "?": 32,
};
export function parsePermission(permission) {
    if (typeof permission === "number") {
        if (Number.isInteger(permission) && permission >= 0)
            return permission;
        throw new Error("Permission must be a non-negative integer or known permission flags.");
    }
    const normalized = (Array.isArray(permission) ? permission.join(" ") : permission)
        .trim()
        .toLowerCase();
    if (!normalized)
        throw new Error("Permission cannot be empty.");
    if (/^\d+$/.test(normalized))
        return Number(normalized);
    if (normalized === "all" || normalized === "full")
        return 63;
    const parts = normalized
        .split(/[\s,+|]+/)
        .filter(Boolean)
        .flatMap(part => permissionFlags[part] || /^\d+$/.test(part)
        ? [
            part,
        ]
        : part.split(""));
    const value = parts.reduce((sum, part) => {
        if (/^\d+$/.test(part))
            return sum | Number(part);
        const flag = permissionFlags[part];
        if (!flag)
            throw new Error(`Unknown permission flag "${part}".`);
        return sum | flag;
    }, 0);
    return value;
}
export async function resolveUserId(idOrLogin) {
    const user = await internalDB.user.findOne({
        $or: [
            {
                _id: idOrLogin,
            },
            {
                login: idOrLogin,
            },
        ],
    });
    if (!user)
        throw new Error(`User "${idOrLogin}" not found.`);
    return user._id;
}
export async function resolveRoleId(idOrName) {
    const id = await wardenMgmt.role.findByName(idOrName);
    return id || idOrName;
}
export async function addUserAccess(login, password = "") {
    if (!/^[a-zA-Z0-9]+$/.test(login))
        return {
            err: true,
            msg: "Login can only contain letters and numbers.",
        };
    if (login.length < 3 || login.length > 10)
        return {
            err: true,
            msg: "Login must be between 3 and 10 characters.",
        };
    if (password && (password.length < 8 || password.length > 300))
        return {
            err: true,
            msg: "Password must be between 8 and 300 characters.",
        };
    const userExists = await internalDB.user.findOne({
        login,
    });
    if (userExists)
        return {
            err: true,
            msg: "Login already exists.",
        };
    password = password ? generateHash(password) : "";
    const user = await internalDB.user.add({
        login,
        password,
    });
    await userMgmt.createUser({
        _id: user._id,
    });
    return {
        err: false,
        user,
    };
}
export async function removeUser(idOrLogin) {
    const user = await internalDB.user.findOne({
        $or: [
            {
                _id: idOrLogin,
            },
            {
                login: idOrLogin,
            },
        ],
    });
    if (!user)
        return false;
    await internalDB.user.removeOne({
        _id: user._id,
    });
    await userMgmt.deleteUser(user._id);
    return true;
}
export async function addWolfToken(userId) {
    const user = await internalDB.user.findOne({
        $or: [
            {
                _id: userId,
            },
            {
                login: userId,
            },
        ],
    });
    if (!user)
        return {
            err: true,
            msg: "User not found.",
        };
    const token = crypto.randomBytes(32).toString("hex");
    await internalDB.wolf.add({
        _id: user._id,
        token,
    });
    return {
        err: false,
        token: `_wolf_${token}`,
    };
}
export async function setWolfToken(userId, token) {
    const user = await internalDB.user.findOne({
        $or: [
            {
                _id: userId,
            },
            {
                login: userId,
            },
        ],
    });
    if (!user)
        return {
            err: true,
            msg: "User not found.",
        };
    const cleanToken = token.startsWith("_wolf_") ? token.slice(6) : token;
    await internalDB.wolf.add({
        _id: user._id,
        token: cleanToken,
    });
    return {
        err: false,
        token: `_wolf_${cleanToken}`,
    };
}
export async function listWolfTokens(userId) {
    if (userId) {
        const user = await internalDB.user.findOne({
            $or: [
                {
                    _id: userId,
                },
                {
                    login: userId,
                },
            ],
        });
        if (!user)
            return [];
        return await internalDB.wolf.find({
            _id: user._id,
        });
    }
    return await internalDB.wolf.find({});
}
export async function removeWolfToken(token) {
    const cleanToken = token.startsWith("_wolf_") ? token.slice(6) : token;
    const result = await internalDB.wolf.removeOne({
        token: cleanToken,
    });
    return !!result;
}
