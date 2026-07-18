function sqlEscapeString(raw) {
    return `'` + raw
        .replace(/\\/g, '\\\\') // backslash
        .replace(/\0/g, '\\0') // null
        .replace(/\n/g, '\\n') // newline
        .replace(/\r/g, '\\r') // carriage return
        .replace(/\t/g, '\\t') // tab
        .replace(/\x1a/g, '\\Z') // Ctrl+Z
        .replace(/'/g, "''") // single quote
        + `'`;
}
function mapJsTypeToSqlType(value) {
    const type = typeof value;
    switch (type) {
        case "number":
            const val = value || 0;
            if (val % 1 === 0)
                return "INTEGER";
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
function getCollectionStruct(data) {
    const keys = new Map();
    for (const item of data) {
        for (const key of Object.keys(item)) {
            if (keys.has(key))
                continue;
            keys.set(key, mapJsTypeToSqlType(item[key]));
        }
    }
    return keys;
}
function processDataToOrder(data, order) {
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
                if (!val)
                    arr.push("NULL");
                else
                    arr.push(val);
        }
    }
    return arr.join(", ");
}
export class SQLFileCreator {
    db;
    opts;
    constructor(db, opts) {
        this.db = db;
        this.opts = {
            dropIfExist: true,
            createIfNotExist: true,
            enterAfterValue: true,
            ...(opts || {})
        };
    }
    async create(collections) {
        let sql = "";
        if (!collections || collections.length === 0)
            collections = await this.db.getCollections();
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
            if (c)
                createIfNotExist.push(c);
            if (i)
                insert.push(i);
        }
        if (createIfNotExist.length !== 0) {
            sql += createIfNotExist.join("\n");
            sql += "\n\n";
        }
        sql += insert.join("\n");
        return sql;
    }
    async processCollection(collection) {
        const data = await this.db.find({ collection });
        const keys = getCollectionStruct(data);
        let createIfNotExist = null;
        if (this.opts.createIfNotExist) {
            const construct = Array.from(keys).map(([k, v]) => `${k} ${v}`).join(", ");
            if (construct.trim().length > 0) {
                createIfNotExist = `CREATE TABLE IF NOT EXISTS ${collection} (${construct});`;
            }
        }
        const enter = this.opts.enterAfterValue ? "\n" : "";
        const order = Array.from(keys).map(([k]) => k);
        let insert = null;
        if (data.length > 0) {
            insert = `INSERT INTO ${collection} (${order.join(", ")}) VALUES `;
            insert += enter;
            insert +=
                data.map(d => "(" + processDataToOrder(d, order) + ")")
                    .join(", " + enter);
            insert += `;` + enter;
        }
        return {
            createIfNotExist,
            insert
        };
    }
}
