import jwt from "jwt-simple";
import NodeCache from "node-cache";
import { jwtSecret } from "../vars";
import { checkUserAccess, generateToken } from "./helpers";

const TOKEN_CACHE_TTL = parseInt(process.env.TOKEN_CACHE_TTL) || 900; // 15 minutes
const cache = new NodeCache({ stdTTL: TOKEN_CACHE_TTL, checkperiod: TOKEN_CACHE_TTL });

export async function authMiddleware(req, res, next) {
    const token = req.headers["authorization"];
    if (!token) {
        return res.status(401).json({ err: true, msg: "Access denied. No token provided." });
    }

    if (cache.has(token)) {
        req.user = cache.get(token);
        return next();
    }

    try {
        const user = jwt.decode(token, jwtSecret);
        if (!user || !user._id) {
            return res.status(401).json({ err: true, msg: "Invalid token." });
        }

        const tokenD = await global.db.findOne("token", { token });
        if (!tokenD) {
            return res.status(401).json({ err: true, msg: "Invalid token." });
        }

        const userD = await global.db.findOne("user", { _id: user._id });
        if (!userD) {
            return res.status(401).json({ err: true, msg: "Invalid token." });
        }

        req.user = user;
        cache.set(token, user);
        next();
    } catch (err) {
        res.status(400).json({ err: true, msg: "An error occurred during authentication." });
    }
}

export async function loginFunction(login: string, password: string) {
    const { err, user } = await checkUserAccess(login, password);
    if (err) {
        return { err: true, msg: "Invalid login or password." };
    }

    const token = await generateToken({ _id: user._id });
    cache.set(token, user);
    return { err: false, token };
}