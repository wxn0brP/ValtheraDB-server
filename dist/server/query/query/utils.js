import { ValtheraDbParsers } from "@wxn0brp/db-string-query";
export const ValtheraParsers = {};
for (const [name, parser] of Object.entries(ValtheraDbParsers)) {
    ValtheraParsers[name] = new parser();
}
export function getDb(name) {
    const dbData = global.dataCenter[name];
    if (!dbData)
        return null;
    return {
        db: dbData.db,
        dir: dbData.dir
    };
}
export function findMatchingString(query, options) {
    const lowerQuery = query.toLowerCase();
    const matches = options.filter(opt => opt.toLowerCase().includes(lowerQuery));
    if (matches.length === 1)
        return matches[0];
    if (matches.length === 0)
        return null;
    return null;
}
export function getParser(parserType) {
    const parser = ValtheraParsers[parserType];
    if (parser)
        return parser;
    const parserName = findMatchingString(parserType, Object.keys(ValtheraParsers));
    if (parserName)
        return ValtheraParsers[parserName];
    return null;
}
