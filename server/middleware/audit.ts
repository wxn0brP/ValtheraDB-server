import { FFRequest, RouteHandler } from "@wxn0brp/falcon-frame";
import { audit, auditConfig } from "../utils/audit";

function getClientIp(req: FFRequest): string {
	const forwarded = req.headers["x-forwarded-for"];
	if (Array.isArray(forwarded)) return forwarded[0];
	if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
	return req.socket?.remoteAddress || "";
}

export const auditMiddleware: RouteHandler = async (req, res, next) => {
	if (!auditConfig.enabled) return next();

	const startTime = Date.now();
	const originalJson = res.json.bind(res);

	res.json = (body: any) => {
		const duration = Date.now() - startTime;
		const entry: Record<string, any> = {
			userId: req.user?._id,
			action: `${req.method} ${req.url}`,
			result: body?.err ? "error" : "success",
			duration,
		};

		if (auditConfig.includeIp) {
			entry.ip = getClientIp(req);
		}

		if (auditConfig.includePayload && req.body) {
			entry.payload = req.body;
		}

		audit(entry as any).catch(() => {});
		return originalJson(body);
	};

	next();
};
