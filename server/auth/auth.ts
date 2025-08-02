import NodeCache from "node-cache";
import { checkUserAccess, generateToken } from "./helpers";
import jwtManager from "../init/keys";
import { RouteHandler } from "@wxn0brp/falcon-frame";
import { Id } from "@wxn0brp/db";

const TOKEN_CACHE_TTL = parseInt(process.env.TOKEN_CACHE_TTL) || 900; // 15 minutes
const cache = new NodeCache({ stdTTL: TOKEN_CACHE_TTL, checkperiod: TOKEN_CACHE_TTL });

export const authMiddleware: RouteHandler = async (req, res, next) => {
    let token = req.headers["authorization"];
    if (!token) {
        return res.status(401).json({ err: true, msg: "Access denied. No token provided." });
    }

    if (token.includes(" ")) token = token.split(" ")[1];

    if (cache.has(token)) {
        const u = cache.get<Id>(token);
        req.user = { _id: u };
        return next();
    }

    try {
        const data = await jwtManager.decode(token) as { uid: Id; _id: Id };

        if (!data || !data.uid || !data._id) {
            return res.status(401).json({ err: true, msg: "Invalid token." });
        }

        const tokenD = await global.internalDB.findOne("token", { _id: data._id });
        if (!tokenD) {
            return res.status(401).json({ err: true, msg: "Invalid token." });
        }

        const userD = await global.internalDB.findOne("user", { _id: data.uid });
        if (!userD) {
            return res.status(401).json({ err: true, msg: "Invalid token." });
        }

        req.user = { _id: data.uid };
        cache.set(token, data.uid);
        next();
    } catch (err) {
        res.status(400).json({ err: true, msg: "An error occurred during authentication." });
    }
}

export async function loginFunction(login: string, password: string, time: string | number | boolean = false) {
    const { err, user } = await checkUserAccess(login, password);
    if (err) {
        return { err: true, msg: "Invalid login or password." };
    }

    const token = await generateToken({ uid: user._id }, time);
    cache.set(token, user);
    return { err: false, token };
}