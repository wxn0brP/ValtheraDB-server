import { Valthera } from "@wxn0brp/db";
import { ValtheraDbParsers } from "@wxn0brp/db-string-query";
import { ValtheraParser } from "@wxn0brp/db-string-query/types";
import { dataCenter } from "../../init/initDataBases";

export const ValtheraParsers: Record<string, ValtheraParser> = {};
for (const [name, parser] of Object.entries(ValtheraDbParsers)) {
    ValtheraParsers[name] = new parser();
}

export function getDb(name: string) {
    const dbData = dataCenter[name];
    return dbData;
}

export function findMatchingString(query: string, options: string[]): string | null {
    const lowerQuery = query.toLowerCase();
    const matches = options.filter(opt => opt.toLowerCase().includes(lowerQuery));
    if (matches.length === 1) return matches[0];
    if (matches.length === 0) return null;
    return null;
}

export function getParser(parserType: string) {
    const parser = ValtheraParsers[parserType];
    if (parser) return parser;

    const parserName = findMatchingString(parserType, Object.keys(ValtheraParsers));
    if (parserName) return ValtheraParsers[parserName];

    return null;
}