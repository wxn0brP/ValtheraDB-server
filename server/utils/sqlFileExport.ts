import { Valthera } from "@wxn0brp/db";

export interface Opts {
    dropIfExist: boolean,
    createIfNotExist: boolean,
    enterAfterValue: boolean,
}

function sqlEscapeString(raw: string): string {
    return `'` + raw
      .replace(/\\/g, '\\\\')     // backslash
      .replace(/\0/g, '\\0')      // null
      .replace(/\n/g, '\\n')      // newline
      .replace(/\r/g, '\\r')      // carriage return
      .replace(/\t/g, '\\t')      // tab
      .replace(/\x1a/g, '\\Z')    // Ctrl+Z
      .replace(/'/g, "''")        // single quote
      + `'`;
  }
  

function mapJsTypeToSqlType(value: any) {
    const type = typeof value;
    switch (type) {
        case "number":
            const val = value || 0;
            if (val % 1 === 0) return "INTEGER";
            return "REAL";
        case "string":
            return "TEXT";
        case "boolean":
            return "BOOLEAN";
        case "object":
            return "JSON";
        default:
            return "TEXT";
    }
}

function getCollectionStruct(data: any[]) {
    const keys = new Map<string, string>();
    for (const item of data) {
        for (const key of Object.keys(item)) {
            if (keys.has(key)) continue;
            keys.set(key, mapJsTypeToSqlType(item[key]));
        }
    }
    return keys;
}

function processDataToOrder(data: any, order: string[]) {
    const arr = [];
    for (const key of order) {
        const val = data[key];
        switch (typeof val) {
            case "string":
                arr.push(sqlEscapeString(val));
                break;
            case "object":
                arr.push(`'${JSON.stringify(val)}'`);
                break;
            default:
                if (!val) arr.push("NULL");
                else arr.push(val);
        }
    }
    return arr.join(", ");
}

export class SQLFileCreator {
    opts: Opts;

    constructor(private db: Valthera, opts?: Partial<Opts>) {
        this.opts = {
            dropIfExist: true,
            createIfNotExist: true,
            enterAfterValue: true,
            ...(opts || {})
        }

    }

    async create(collections?: string[]) {
        let sql = "";
        if (!collections || collections.length === 0) collections = await this.db.getCollections();

        if (this.opts.dropIfExist) {
            for (const collection of collections) {
                sql += "DROP TABLE IF EXISTS " + collection + ";\n";
            }
            sql += "\n";
        }

        const createIfNotExist = [];
        const insert = [];

        for (const collection of collections) {
            const { createIfNotExist: c, insert: i } = await this.processCollection(collection);
            if (c) createIfNotExist.push(c);
            if (i) insert.push(i);
        }

        if (createIfNotExist.length !== 0) {
            sql += createIfNotExist.join("\n");
            sql += "\n\n";
        }
        sql += insert.join("\n");
        return sql;
    }

    async processCollection(collectionName: string) {
        const data = await this.db.find(collectionName, {});
        const keys = getCollectionStruct(data);

        const createIfNotExist = this.opts.createIfNotExist ?
            `CREATE TABLE IF NOT EXISTS ${collectionName} (${Array.from(keys).map(([k, v]) => `${k} ${v}`).join(", ")});` :
            null;

        const enter = this.opts.enterAfterValue ? "\n" : "";

        const order = Array.from(keys).map(([k]) => k);

        let insert = null;

        if (data.length > 0) {
            insert =
                `INSERT INTO ${collectionName} (${order.join(", ")}) VALUES ` + enter +
                data.map(d => "(" + processDataToOrder(d, order) + ")").join(", " + enter)
                +`;`+enter;
        }

        return {
            createIfNotExist,
            insert
        }
    }
}