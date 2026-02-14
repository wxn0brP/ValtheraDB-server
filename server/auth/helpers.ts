import { genId } from "@wxn0brp/db";
import crypto from "crypto";
import { internalDB } from "../init/initDataBases";
import jwtManager from "../init/keys";

function sha(str: string) {
    return crypto.createHash("sha256").update(str).digest("hex");
}

export type TokenTime = string | number | boolean;

export async function generateToken(payload: any, time: TokenTime = false) {
    if (!payload) throw new Error("Payload is required");
    if (!payload._id) payload._id = genId();

    const token = await jwtManager.create(payload, time);
    const exists = await internalDB.token.findOne({ _id: payload._id });

    if (!exists) await internalDB.token.add({ _id: payload._id, sha: sha(token) });

    return token;
}

export async function checkUserAccess(login: string, password: string) {
    const user = await internalDB.user.findOne({ login });
    if (!user) return { err: true, msg: "Invalid login or password." };

    const hash = generateHash(password);
    if (hash !== user.password) return { err: true, msg: "Invalid login or password." };

    delete user.password;
    return { err: false, user };
}

export function generateHash(password: string) {
    return crypto.createHash("sha256").update(password).digest("hex");
}
