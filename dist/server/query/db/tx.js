import { TransactionError } from "@wxn0brp/db-core/errors";
import logger from "../../utils/logger.js";
/**
 * Sentinel used to abort the transaction body on an explicit rollback.
 * It never leaves this module.
 */
const ROLLBACK = Symbol("transaction-rollback");
const TX_TIMEOUT = parseInt(process.env.TX_TIMEOUT) || 30_000;
const byId = new Map();
const activeByDb = new Map();
export function getSession(id) {
    return byId.get(id);
}
/**
 * Reset the idle timeout of an active session.
 */
export function touch(session) {
    if (session.closed)
        return;
    if (session.timer)
        clearTimeout(session.timer);
    session.timer = refreshTimer(session);
}
function refreshTimer(session) {
    const timer = setTimeout(() => {
        rollbackTx(session.id, session.userId, session.dbName).catch(err => {
            logger.error(err);
        });
    }, TX_TIMEOUT);
    timer.unref?.();
    return timer;
}
function cleanup(session) {
    if (session.timer)
        clearTimeout(session.timer);
    byId.delete(session.id);
    if (activeByDb.get(session.dbName) === session.id)
        activeByDb.delete(session.dbName);
}
function assertOwner(session, userId, dbName, op) {
    if (session.userId !== userId || session.dbName !== dbName)
        throw new TransactionError("transaction does not belong to this user or database", {
            context: {
                op,
                handle: session.id,
                db: dbName,
            },
        });
}
export async function beginTx(db, dbName, userId, collections) {
    if (activeByDb.has(dbName))
        throw new TransactionError("transaction already active on this database", {
            context: {
                op: "beginTransaction",
                db: dbName,
                active: activeByDb.get(dbName),
            },
        });
    let readyResolve;
    let readyReject;
    const ready = new Promise((resolve, reject) => {
        readyResolve = resolve;
        readyReject = reject;
    });
    let doneResolve;
    let doneReject;
    const done = new Promise((resolve, reject) => {
        doneResolve = resolve;
        doneReject = reject;
    });
    let settleResolve;
    let settleReject;
    const settled = new Promise((resolve, reject) => {
        settleResolve = resolve;
        settleReject = reject;
    });
    settled.catch(() => { });
    let session;
    let readySettled = false;
    const run = db.transaction(collections, async (tx) => {
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
    run.then(() => settleResolve(), err => {
        if (err === ROLLBACK) {
            settleResolve();
            return;
        }
        settleReject(err);
        if (!readySettled)
            readyReject(err);
    });
    run
        .catch(() => { })
        .finally(() => {
        if (session)
            cleanup(session);
    });
    return await ready;
}
export async function commitTx(id, userId, dbName) {
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
    if (session.timer)
        clearTimeout(session.timer);
    session.done.resolve();
    await session.settled;
}
export async function rollbackTx(id, userId, dbName) {
    const session = byId.get(id);
    if (!session)
        return;
    assertOwner(session, userId, dbName, "rollbackTransaction");
    if (session.closed)
        return;
    session.closed = true;
    if (session.timer)
        clearTimeout(session.timer);
    session.done.reject(ROLLBACK);
    try {
        await session.settled;
    }
    catch { }
}
