import path from "path";

export function isPathSafe(baseDir: string, userPath: string){
    const resolvedBase = path.resolve(baseDir);
    const resolvedUserPath = path.resolve(baseDir, userPath);
    return resolvedUserPath.startsWith(resolvedBase + path.sep);
}