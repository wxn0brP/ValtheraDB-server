import jwt from "jwt-simple";
import crypto from "crypto";
import { jwtSecret } from "./vars";

export async function generateToken(payload: any) {
    const token = jwt.encode(payload, jwtSecret);
    const exists = await global.db.findOne("token", { token });
    if (!exists) await global.db.add("token", { token });
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