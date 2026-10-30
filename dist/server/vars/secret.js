import crypto from "crypto";
import { internalDB } from "../init/initDataBases.js";
const SECRET_ID = "jwt";
export default async function getSecret() {
    if (process.env.JWT)
        return process.env.JWT;
    const stored = await internalDB.secret.findOne({
        _id: SECRET_ID,
    });
    if (stored?.value)
        return stored.value;
    const secret = crypto.randomBytes(64).toString("hex");
    await internalDB.secret.add({
        _id: SECRET_ID,
        value: secret,
    });
    return secret;
}
