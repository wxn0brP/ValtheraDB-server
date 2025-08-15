export interface ParseCsvOptions {
    delimiter?: string;
    trimFields?: boolean;
    skipEmptyLines?: boolean;
    comment?: string;
}

export type CsvRecord = Record<string, string>;

export function parseCSV(
    input: string,
    opts: ParseCsvOptions = {}
): CsvRecord[] {
    const delimiter = opts.delimiter ?? ",";
    if (delimiter.length !== 1) throw new Error("delimiter must be a single char");
    const skipEmpty = opts.skipEmptyLines ?? true;
    const trim = opts.trimFields ?? false;

    const data = input.replace(/\r\n?/g, "\n"); // normalizacja końców linii
    let rows: string[][] = [];
    let currentRow: string[] = [];
    let field = "";
    let inQuotes = false;

    const pushField = () => {
        currentRow.push(trim ? field.trim() : field);
        field = "";
    };
    const pushRow = () => {
        if (!(skipEmpty && currentRow.length === 1 && currentRow[0] === "")) {
            rows.push([...currentRow]);
        }
        currentRow.length = 0;
    };

    let i = 0;
    const N = data.length;
    while (i < N) {
        const ch = data[i];

        if (inQuotes) {
            if (ch === '"') {
                if (i + 1 < N && data[i + 1] === '"') {
                    field += '"';
                    i += 2;
                } else {
                    inQuotes = false;
                    i++;
                }
            } else {
                field += ch;
                i++;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
                i++;
            } else if (ch === delimiter) {
                pushField();
                i++;
            } else if (ch === "\n") {
                pushField();
                pushRow();
                i++;
            } else if (
                opts.comment &&
                field === "" &&
                currentRow.length === 0 &&
                data.slice(i, i + opts.comment.length) === opts.comment
            ) {
                const nl = data.indexOf("\n", i);
                if (nl === -1) break;
                i = nl + 1;
                field = "";
                currentRow.length = 0;
            } else {
                field += ch;
                i++;
            }
        }
    }
    pushField();
    pushRow();

    if (rows.length === 0) throw new Error("CSV: no data found");
    const headers = rows[0];
    if (headers.length === 0 || headers.every(h => h.trim() === "")) {
        throw new Error("CSV: missing header row");
    }

    return rows.slice(1).map(row => {
        const obj: CsvRecord = {};
        for (let k = 0; k < headers.length; k++) {
            obj[headers[k]] = row[k] ?? "";
        }
        return obj;
    });
}
