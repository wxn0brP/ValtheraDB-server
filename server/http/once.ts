import { Router } from "@wxn0brp/falcon-frame";
import { PluginSystem } from "@wxn0brp/falcon-frame-plugin";
import { createRateLimiterPlugin } from "@wxn0brp/falcon-frame-plugin/plugins/rateLimit";
import { authMiddleware, loginFunction } from "../auth/auth";
import { dataCenter } from "../init/initDataBases";

const onceLimiter = new PluginSystem();
onceLimiter.register(
	createRateLimiterPlugin({
		maxRequests: parseInt(process.env.RATE_LIMIT_ONCE_MAX) || 5,
		windowMs: parseInt(process.env.RATE_LIMIT_ONCE_WINDOW) || 60_000,
		onLimitReached: (req, res) => {
			res.status(429).json({
				err: true,
				msg: "Too many requests",
			});
		},
	}),
);

export const onceRouter = new Router();
onceRouter.use(onceLimiter);

onceRouter.post("/login", async (req, res) => {
	const { login, password, time } = req.body;
	if (!login || !password)
		return res.status(400).json({
			err: true,
			msg: "Login and password are required",
		});

	if (
		time !== undefined &&
		typeof time !== "string" &&
		time !== "true" &&
		time !== "false" &&
		!Number.isNaN(parseInt(time))
	)
		return res.status(400).json({
			err: true,
			msg: "Invalid time.",
		});

	const access = await loginFunction(login, password);
	if (access.err === true) return res.status(400).json(access);

	res.json({
		err: false,
		token: access.token,
	});
});

onceRouter.post("/getDbList", authMiddleware, async (req, res) => {
	const dbsKeys = Object.keys(dataCenter);
	res.json({
		err: false,
		result: dbsKeys,
	});
});

onceRouter.post("/auth-check", authMiddleware, (req, res) => {
	res.json({
		err: false,
	});
});
