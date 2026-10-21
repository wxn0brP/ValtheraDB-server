import { audit, auditConfig } from "../utils/audit.js";
function getClientIp(req) {
    const forwarded = req.headers["x-forwarded-for"];
    if (Array.isArray(forwarded))
        return forwarded[0];
    if (typeof forwarded === "string")
        return forwarded.split(",")[0].trim();
    return req.socket?.remoteAddress || "";
}
export const auditMiddleware = async (req, res, next) => {
    if (!auditConfig.enabled)
        return next();
    const startTime = Date.now();
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        const duration = Date.now() - startTime;
        const entry = {
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
        audit(entry).catch(() => { });
        return originalJson(body);
    };
    next();
};
