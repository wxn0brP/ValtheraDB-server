import { genId } from "@wxn0brp/db";
import crypto from "crypto";
import { internalDB } from "../init/initDataBases.js";
import jwtManager from "../init/keys.js";
function sha(str) {
    return crypto.createHash("sha256").update(str).digest("hex");
}
export async function generateToken(payload, time = false) {
    if (!payload)
        throw new Error("Payload is required");
    if (!payload._id)
        payload._id = genId();
    const token = await jwtManager.create(payload, time);
    const exists = await internalDB.token.findOne({ _id: payload._id });
    if (!exists)
        await internalDB.token.add({ _id: payload._id, sha: sha(token) });
    return token;
}
export async function checkUserAccess(login, password) {
    const user = await internalDB.user.findOne({ login });
    if (!user)
        return { err: true, msg: "Invalid login or password." };
    const hash = generateHash(password);
    if (hash !== user.password)
        return { err: true, msg: "Invalid login or password." };
    delete user.password;
    return { err: false, user };
}
export function generateHash(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
}
