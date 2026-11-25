const LOGICAL_OPS = new Set([
    "$and",
    "$or",
    "$not",
]);
function setKey(target, key, value) {
    Object.defineProperty(target, key, {
        value,
        enumerable: true,
        writable: true,
        configurable: true,
    });
}
export function isSerializedRegExp(value) {
    if (!value || typeof value !== "object")
        return false;
    const pattern = value;
    if (typeof pattern.source !== "string")
        return false;
    if (pattern.flags === undefined)
        return true;
    return typeof pattern.flags === "string";
}
/**
 * Rebuild RegExp instances from the `{ source, flags }` wire format that JSON
 * needs. `db-core` only resolves `$regex` inside a search, optionally nested in
 * `$and`, `$or` or `$not`, so the walk stops at every other key. String
 * patterns are left untouched.
 */
export function deserializeRegex(search) {
    return mapSearch(search);
}
function mapSearch(search) {
    if (!search || typeof search !== "object" || Array.isArray(search))
        return search;
    const result = {};
    for (const key of Object.keys(search)) {
        const child = search[key];
        const op = key.toLowerCase();
        if (op === "$regex")
            setKey(result, key, mapPatterns(child));
        else if (LOGICAL_OPS.has(op))
            setKey(result, key, mapLogical(child));
        else
            setKey(result, key, child);
    }
    return result;
}
function mapLogical(value) {
    if (Array.isArray(value))
        return value.map(mapSearch);
    if (value && typeof value === "object")
        return mapSearch(value);
    return value;
}
function mapPatterns(patterns) {
    if (!patterns || typeof patterns !== "object" || Array.isArray(patterns))
        return patterns;
    const result = {};
    for (const field of Object.keys(patterns)) {
        const pattern = patterns[field];
        setKey(result, field, isSerializedRegExp(pattern)
            ? new RegExp(pattern.source, pattern.flags)
            : mapPatterns(pattern));
    }
    return result;
}
