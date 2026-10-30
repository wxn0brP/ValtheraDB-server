import * as path from "path";
import { realpathSync } from "fs";

const dirCache = new Map<string, string>();

// canonicalize to defeat symlinks: resolve the deepest existing ancestor, then re-append the missing tail
function canonicalPath(target: string): string {
	const rest: string[] = [];
	let current = target;
	for (;;) {
		try {
			const real = realpathSync.native(current);
			return rest.length === 0 ? real : path.join(real, ...rest.reverse());
		} catch (err) {
			// only a missing path is walkable; anything else stays lexical instead of denying access
			const code = err?.code;
			if (code !== "ENOENT" && code !== "ENOTDIR") return target;

			const parent = path.dirname(current);
			if (parent === current) return target;
			rest.push(path.basename(current));
			current = parent;
		}
	}
}

function canonicalDir(dir: string): string {
	let real = dirCache.get(dir);
	if (real === undefined) {
		real = canonicalPath(dir);
		dirCache.set(dir, real);
	}
	return real;
}

export function isPathSafe(
	baseDir: string,
	dbPath: string,
	userPath: string,
): boolean {
	if (typeof userPath !== "string") return false;
	if (userPath.includes("\0")) return false;
	if (path.isAbsolute(userPath)) return false;

	const segments = userPath.split("/").filter(segment => segment !== "");
	if (!segments.length) return false;
	if (segments.some(segment => segment === "." || segment === ".."))
		return false;

	const checkDir = path.isAbsolute(dbPath)
		? path.resolve(dbPath)
		: path.resolve(baseDir, dbPath);
	const resolvedUserPath = path.resolve(checkDir, userPath);
	if (resolvedUserPath === checkDir) return false;
	if (!resolvedUserPath.startsWith(checkDir + path.sep)) return false;

	// resolve symlinks so a link inside the data dir cannot escape the sandbox
	const realDir = canonicalDir(checkDir);
	const realUser = canonicalPath(resolvedUserPath);
	return realUser.startsWith(realDir + path.sep);
}
