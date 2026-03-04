import { AnotherCache } from "@wxn0brp/ac";
import { internalDB } from "../init/initDataBases.js";
import jwtManager from "../init/keys.js";
import { checkUserAccess, generateToken } from "./helpers.js";
const TOKEN_CACHE_TTL = parseInt(process.env.TOKEN_CACHE_TTL) || 900; // 15 minutes
const cache = new AnotherCache({
    ttl: TOKEN_CACHE_TTL,
    cleanupInterval: TOKEN_CACHE_TTL,
});
export const authMiddleware = async (req, res, next) => {
    let token = req.headers["authorization"];
    if (!token)
        return res.status(401).json({ err: true, msg: "Access denied. No token provided." });
    if (token.includes(" "))
        token = token.split(" ")[1];
    if (cache.has(token)) {
        const u = cache.get(token);
        req.user = { _id: u };
        return next();
    }
    try {
        const data = await jwtManager.decode(token);
        if (!data || !data.uid || !data._id)
            return res.status(401).json({ err: true, msg: "Invalid token." });
        const tokenD = await internalDB.token.findOne({ _id: data._id });
        if (!tokenD)
            return res.status(401).json({ err: true, msg: "Invalid token." });
        const userD = await internalDB.user.findOne({ _id: data.uid });
        if (!userD)
            return res.status(401).json({ err: true, msg: "Invalid token." });
        req.user = { _id: data.uid };
        cache.set(token, data.uid);
        next();
    }
    catch (err) {
        res.status(400).json({ err: true, msg: "An error occurred during authentication." });
    }
};
export async function loginFunction(login, password, time = false) {
    const access = await checkUserAccess(login, password);
    if (access.err)
        return access;
    const { user } = access;
    const token = await generateToken({ uid: user._id }, time);
    cache.set(token, user._id);
    return { err: false, token };
}
