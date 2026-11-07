import { genId } from "@wxn0brp/db";
import crypto from "crypto";
import { internalDB } from "../init/initDataBases.js";
import jwtManager from "../init/keys.js";
import { auditAuth, auditWarn } from "../utils/audit.js";
export async function generateToken(payload, time = false) {
    if (!payload)
        throw new Error("Payload is required");
    if (!payload._id)
        payload._id = genId();
    const token = await jwtManager.create(payload, time);
    const exists = await internalDB.token.findOne({
        _id: payload._id,
    });
    if (!exists) {
        await internalDB.token.add({
            _id: payload._id,
            sha: generateHash(token),
        });
        await auditAuth("token_created", payload.uid, "success");
    }
    return token;
}
export async function checkUserAccess(login, password) {
    const user = await internalDB.user.findOne({
        login,
    });
    if (!user)
        return {
            err: true,
            msg: "Invalid login or password.",
        };
    if (user.password === "")
        return {
            err: true,
            msg: "Invalid login or password.",
        };
    const validPassword = await verifyPassword(password, user.password);
    if (!validPassword) {
        const validLegacyPassword = isLegacyPasswordHash(user.password)
            ? generateHash(password) === user.password
            : false;
        if (!validLegacyPassword)
            return {
                err: true,
                msg: "Invalid login or password.",
            };
        await auditWarn({
            userId: user._id,
            login: user.login,
            action: "password_legacy_hash",
            result: "success",
            message: "User authenticated with a legacy unsalted SHA-256 password hash.",
        });
    }
    delete user.password;
    return {
        err: false,
        user,
    };
}
export function generateHash(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
}
const PASSWORD_SALT_BYTES = 16;
const PASSWORD_KEY_LENGTH = 64;
function deriveKey(password, salt) {
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, PASSWORD_KEY_LENGTH, (err, key) => {
            if (err)
                reject(err);
            else
                resolve(key);
        });
    });
}
export async function hashPassword(password) {
    const salt = crypto.randomBytes(PASSWORD_SALT_BYTES).toString("hex");
    const hash = (await deriveKey(password, salt)).toString("hex");
    return `${salt}:${hash}`;
}
export async function verifyPassword(password, stored) {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash)
        return false;
    const expected = Buffer.from(hash, "hex");
    if (expected.length !== PASSWORD_KEY_LENGTH)
        return false;
    const computed = await deriveKey(password, salt);
    return crypto.timingSafeEqual(computed, expected);
}
function isLegacyPasswordHash(stored) {
    return /^[a-f0-9]{64}$/i.test(stored);
}
