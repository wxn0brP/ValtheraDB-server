import { Logger } from "@wxn0brp/lucerna-log";
import { FileTransport } from "@wxn0brp/lucerna-log/transports/file";

export interface AuditConfig {
	enabled: boolean;
	logAuth: boolean;
	logRead: boolean;
	logWrite: boolean;
	logPermission: boolean;
	logAdmin: boolean;
	includePayload: boolean;
	includeIp: boolean;
	includeResult: boolean;
}

export const auditConfig: AuditConfig = {
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

export interface AuditEntry {
	userId?: string;
	login?: string;
	action: string;
	resource?: string;
	ip?: string;
	result?: "success" | "error" | "denied";
	payload?: Record<string, any>;
	message?: string;
}

export async function audit(entry: AuditEntry): Promise<void> {
	if (!auditConfig.enabled) return;
	await auditLogger.info(JSON.stringify(entry));
}

export async function auditAuth(
	action: string,
	userId?: string,
	result?: "success" | "error" | "denied",
	extra?: Partial<AuditEntry>,
): Promise<void> {
	if (!auditConfig.logAuth) return;
	await audit({
		userId,
		action,
		result,
		...extra,
	});
}

export async function auditOperation(
	action: string,
	userId: string,
	resource?: string,
	result?: "success" | "error" | "denied",
	extra?: Partial<AuditEntry>,
): Promise<void> {
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

	if (isWrite && !auditConfig.logWrite) return;
	if (isRead && !auditConfig.logRead) return;

	await audit({
		userId,
		action,
		resource,
		result,
		...extra,
	});
}

export default auditLogger;
