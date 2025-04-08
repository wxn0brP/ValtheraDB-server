import crypto from "crypto";
import jwtManager from "../init/keys";
import { genId } from "@wxn0brp/db";

function sha(str: string) {
    return crypto.createHash("sha256").update(str).digest("hex");
}

export async function generateToken(payload: any) {
    if (!payload) throw new Error("Payload is required");
    if (!payload._id) payload._id = genId();

    const token = await jwtManager.create(payload);
    const exists = await global.db.findOne("token", { _id: payload._id });
    if (!exists) await global.db.add("token", { _id: payload._id, sha: sha(token) });

    return token;
}

export async function removeToken(token: string) {
    return await global.db.removeOne("token", { token });
}

export async function checkUserAccess(login: string, password: string) {
    const user = await global.db.findOne("user", { login });
    if (!user) return { err: true, msg: "Invalid login or password." };

    const hash = generateHash(password);
    if (hash !== user.password) return { err: true, msg: "Invalid login or password." };

    delete user.password;
    return { err: false, user };
}

export function generateHash(password: string) {
    return crypto.createHash("sha256").update(password).digest("hex");
}