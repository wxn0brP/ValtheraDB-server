import { Logger } from "@wxn0brp/lucerna-log";
import { FileTransport } from "@wxn0brp/lucerna-log/transports/file";
export const auditConfig = {
    enabled: process.env.AUDIT_ENABLED !== "false",
    logAuth: process.env.AUDIT_LOG_AUTH !== "false",
    logRead: process.env.AUDIT_LOG_READ === "true",
    logWrite: process.env.AUDIT_LOG_WRITE !== "false",
    logPermission: process.env.AUDIT_LOG_PERMISSION !== "false",
    logAdmin: process.env.AUDIT_LOG_ADMIN !== "false",
    includePayload: process.env.AUDIT_INCLUDE_PAYLOAD === "true",
    includeIp: process.env.AUDIT_INCLUDE_IP !== "false",
    includeResult: process.env.AUDIT_INCLUDE_RESULT !== "false",
};
const auditLogFile = process.env.AUDIT_LOG_FILE || "./logs/audit.log";
const auditLogger = new Logger({
    transports: [
        new FileTransport(auditLogFile),
    ],
    loggerName: "audit",
    logLevel: "INFO",
});
export async function audit(entry) {
    if (!auditConfig.enabled)
        return;
    await auditLogger.info(JSON.stringify(entry));
}
export async function auditAuth(action, userId, result, extra) {
    if (!auditConfig.logAuth)
        return;
    await audit({
        userId,
        action,
        result,
        ...extra,
    });
}
export async function auditOperation(action, userId, resource, result, extra) {
    const isWrite = [
        "add",
        "update",
        "updateOne",
        "remove",
        "removeOne",
        "toggle",
    ].includes(action);
    const isRead = [
        "find",
        "findOne",
        "getCollections",
    ].includes(action);
    if (isWrite && !auditConfig.logWrite)
        return;
    if (isRead && !auditConfig.logRead)
        return;
    await audit({
        userId,
        action,
        resource,
        result,
        ...extra,
    });
}
export default auditLogger;
