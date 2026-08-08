import { AnotherCache } from "@wxn0brp/ac";
import { Id } from "@wxn0brp/db";
import { FFRequest, RouteHandler } from "@wxn0brp/falcon-frame";
import { internalDB } from "../init/initDataBases";
import jwtManager from "../init/keys";
import { auditAuth } from "../utils/audit";
import { checkUserAccess, generateToken, TokenTime } from "./helpers";

function getClientIp(req: FFRequest): string {
	const forwarded = req.headers["x-forwarded-for"];
	if (Array.isArray(forwarded)) return forwarded[0];
	if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
	return req.socket?.remoteAddress || "";
}

const TOKEN_CACHE_TTL = parseInt(process.env.TOKEN_CACHE_TTL) || 900; // 15 minutes
export const cache = new AnotherCache<Id>({
	ttl: TOKEN_CACHE_TTL,
	cleanupInterval: TOKEN_CACHE_TTL,
});

export const authMiddleware: RouteHandler = async (req, res, next) => {
	let token = req.headers["authorization"];

	if (!token && req.body.auth) token = req.body.auth;

	if (!token) {
		await auditAuth("auth_missing", undefined, "denied", {
			ip: getClientIp(req),
		});
		return res.status(401).json({
			err: true,
			msg: "Access denied. No token provided.",
		});
	}

	if (token.includes(" ")) token = token.split(" ")[1];

	if (cache.has(token)) {
		const u = cache.get(token);
		req.user = {
			_id: u,
		};
		return next();
	}

	try {
		if (token.startsWith("_wolf_")) {
			token = token.replace("_wolf_", "");
			const tokenD = await internalDB.wolf.findOne({
				token,
			});
			if (!tokenD) {
				await auditAuth("wolf_token_invalid", undefined, "denied", {
					ip: getClientIp(req),
				});
				return res.status(401).json({
					err: true,
					msg: "Invalid token.",
				});
			}

			req.user = {
				_id: tokenD._id,
			};
			cache.set(token, tokenD._id);
			await auditAuth("wolf_token_valid", tokenD._id, "success");
			next();
			return;
		}

		const data = (await jwtManager.decode(token)) as {
			uid: Id;
			_id: Id;
		};
		if (!data || !data.uid || !data._id) {
			await auditAuth("jwt_decode_failed", undefined, "denied", {
				ip: getClientIp(req),
			});
			return res.status(401).json({
				err: true,
				msg: "Invalid token.",
			});
		}

		const tokenD = await internalDB.token.findOne({
			_id: data._id,
		});
		if (!tokenD) {
			await auditAuth("token_not_found", data.uid, "denied");
			return res.status(401).json({
				err: true,
				msg: "Invalid token.",
			});
		}

		const userD = await internalDB.user.findOne({
			_id: data.uid,
		});
		if (!userD) {
			await auditAuth("user_not_found", data.uid, "denied");
			return res.status(401).json({
				err: true,
				msg: "Invalid token.",
			});
		}

		req.user = {
			_id: data.uid,
		};
		cache.set(token, data.uid);
		await auditAuth("jwt_valid", data.uid, "success");
		next();
	} catch (err) {
		await auditAuth("auth_error", undefined, "error", {
			message: err.message,
			ip: getClientIp(req),
		});
		res.status(400).json({
			err: true,
			msg: "An error occurred during authentication.",
		});
	}
};

export type LoginResult =
	| {
			err: true;
			msg: string;
	  }
	| {
			err: false;
			token: string;
	  };

export async function loginFunction(
	login: string,
	password: string,
	time: TokenTime = false,
): Promise<LoginResult> {
	const access = await checkUserAccess(login, password);
	if (access.err) {
		await auditAuth("login_failed", undefined, "denied", {
			message: access.msg,
		});
		return access as LoginResult;
	}

	const { user } = access;
	const token = await generateToken(
		{
			uid: user._id,
		},
		time,
	);
	cache.set(token, user._id);

	await auditAuth("login_success", user._id, "success");

	return {
		err: false,
		token,
	};
}
