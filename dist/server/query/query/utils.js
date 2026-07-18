import { ValtheraDbParsers } from "@wxn0brp/db-string-query";
import { dataCenter } from "../../init/initDataBases.js";
export const ValtheraParsers = {};
for (const [name, parser] of Object.entries(ValtheraDbParsers)) {
    ValtheraParsers[name] = new parser();
}
export function getDb(name) {
    return dataCenter[name];
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
