import * as path from "path";

export function isPathSafe(baseDir: string, dbPath: string, userPath: string): boolean {
    // Resolve the "check directory" based on whether dbPath is absolute or relative
    const checkDir = path.isAbsolute(dbPath)
        ? path.resolve(dbPath) // If dbPath is absolute, use it directly
        : path.resolve(baseDir, dbPath); // If dbPath is relative, resolve it relative to baseDir

    // Resolve the user-provided path relative to baseDir
    const resolvedUserPath = path.resolve(checkDir, userPath);

    // Ensure the resolved user path starts with the check directory + path separator
    return resolvedUserPath.startsWith(checkDir + path.sep);
}