import { TransactionError } from "@wxn0brp/db-core/errors";
import { TransactionHandle } from "@wxn0brp/db-core/types/transaction";
import type { Valthera } from "@wxn0brp/db/valthera";
import logger from "../../utils/logger";

/**
 * Sentinel used to abort the transaction body on an explicit rollback.
 * It never leaves this module.
 */
const ROLLBACK = Symbol("transaction-rollback");
const TX_TIMEOUT = parseInt(process.env.TX_TIMEOUT) || 30_000;

interface Session {
	id: string;
	dbName: string;
	userId: string;
	collections: Set<string>;
	handle: TransactionHandle;
	settled: Promise<void>;
	done: {
		resolve: () => void;
		reject: (err: unknown) => void;
	};
	timer: ReturnType<typeof setTimeout> | null;
	closed: boolean;
}

const byId = new Map<string, Session>();
const activeByDb = new Map<string, string>();

export function getSession(id: string) {
	return byId.get(id);
}

/**
 * Reset the idle timeout of an active session.
 */
export function touch(session: Session) {
	if (session.closed) return;
	if (session.timer) clearTimeout(session.timer);
	session.timer = refreshTimer(session);
}

function refreshTimer(session: Session) {
	const timer = setTimeout(() => {
		rollbackTx(session.id, session.userId, session.dbName).catch(err => {
			logger.error(err);
		});
	}, TX_TIMEOUT);
	timer.unref?.();
	return timer;
}

function cleanup(session: Session) {
	if (session.timer) clearTimeout(session.timer);
	byId.delete(session.id);
	if (activeByDb.get(session.dbName) === session.id)
		activeByDb.delete(session.dbName);
}

function assertOwner(
	session: Session,
	userId: string,
	dbName: string,
	op: string,
) {
	if (session.userId !== userId || session.dbName !== dbName)
		throw new TransactionError(
			"transaction does not belong to this user or database",
			{
				context: {
					op,
					handle: session.id,
					db: dbName,
				},
			},
		);
}

export async function beginTx(
	db: Valthera,
	dbName: string,
	userId: string,
	collections: string[],
): Promise<string> {
	if (activeByDb.has(dbName))
		throw new TransactionError("transaction already active on this database", {
			context: {
				op: "beginTransaction",
				db: dbName,
				active: activeByDb.get(dbName),
			},
		});

	let readyResolve!: (id: string) => void;
	let readyReject!: (err: unknown) => void;
	const ready = new Promise<string>((resolve, reject) => {
		readyResolve = resolve;
		readyReject = reject;
	});

	let doneResolve!: () => void;
	let doneReject!: (err: unknown) => void;
	const done = new Promise<void>((resolve, reject) => {
		doneResolve = resolve;
		doneReject = reject;
	});

	let settleResolve!: () => void;
	let settleReject!: (err: unknown) => void;
	const settled = new Promise<void>((resolve, reject) => {
		settleResolve = resolve;
		settleReject = reject;
	});
	settled.catch(() => {});

	let session: Session | undefined;
	let readySettled = false;

	const run = db.transaction(collections, async tx => {
		session = {
			id: tx.handle.id,
			dbName,
			userId,
			collections: new Set(collections),
			handle: tx.handle,
			settled,
			done: {
				resolve: doneResolve,
				reject: doneReject,
			},
			timer: null,
			closed: false,
		};
		byId.set(session.id, session);
		activeByDb.set(dbName, session.id);
		session.timer = refreshTimer(session);
		readySettled = true;
		readyResolve(session.id);
		await done;
	});

	run.then(
		() => settleResolve(),
		err => {
			if (err === ROLLBACK) {
				settleResolve();
				return;
			}
			settleReject(err);
			if (!readySettled) readyReject(err);
		},
	);

	run
		.catch(() => {})
		.finally(() => {
			if (session) cleanup(session);
		});

	return await ready;
}

export async function commitTx(id: string, userId: string, dbName: string) {
	const session = byId.get(id);
	if (!session)
		throw new TransactionError("invalid or expired transaction", {
			context: {
				op: "commitTransaction",
				handle: id,
				db: dbName,
			},
		});
	assertOwner(session, userId, dbName, "commitTransaction");
	if (session.closed)
		throw new TransactionError("transaction already finished", {
			context: {
				op: "commitTransaction",
				handle: id,
			},
		});

	session.closed = true;
	if (session.timer) clearTimeout(session.timer);
	session.done.resolve();
	await session.settled;
}

export async function rollbackTx(id: string, userId: string, dbName: string) {
	const session = byId.get(id);
	if (!session) return;
	assertOwner(session, userId, dbName, "rollbackTransaction");
	if (session.closed) return;

	session.closed = true;
	if (session.timer) clearTimeout(session.timer);
	session.done.reject(ROLLBACK);
	try {
		await session.settled;
	} catch {}
}
