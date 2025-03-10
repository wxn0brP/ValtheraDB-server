import { getDatabases, getDbConfig, setConfig } from "./db";
import editor, { sqlDbSelect } from "./monaco";
import { writeResult } from "./render";

export const editorType = document.querySelector<HTMLSelectElement>("#editor-type");

function removeTypesFromCode(code: string): string {
    const cleanedCode = code
        .replace(/\b(const|let|var)\s+(\w+):\s*([\w\[\]\|]+)/g, '$1 $2')
        .replace(/\s+as\s+\w+/g, '');
    return cleanedCode;
}

function addReturnToLastLine(code: string): string {
    const lines = code.split('\n').filter(line => line.trim() !== '');
    lines[lines.length - 1] = `return await ${lines[lines.length - 1]}`;
    return lines.join('\n');
}

export async function queryTS(rawCode: string, db: any) {
    const transpiledCode = removeTypesFromCode(rawCode);
    const codeWithReturn = addReturnToLastLine(transpiledCode);

    const runCode = new Function('db', `
        return (async () => {
            try {
                ${codeWithReturn};
            } catch (e) {
                console.error(e);
            }
        })();
    `);

    try {
        const result = await runCode(db);
        return result;
    } catch (e) {
        console.error(e);
        return "Error";
    }
}

export async function querySQL(rawCode: string, db: string) {
    try {
        const cfg = getDbConfig(db);
        const result = await fetch(cfg.url + "/q/sql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": cfg.auth
            },
            body: JSON.stringify({ db, q: rawCode })
        }).then(res => res.json());
        return result;
    } catch (e) {
        console.error(e);
        return "Error";
    }
}

export async function saveConfig(rawCode: string) {
    const code = removeTypesFromCode(rawCode);
    const fn = new Function('', `
        ${code}
        return { baseCfg, cfg };
    `);

    try {
        return fn();
    } catch (e) {
        console.error(e);
        return "Error";
    }
}

export async function run() {
    const code = editor.getValue();
    if (!code || code.trim() === "") return;
    const low = code.toLowerCase();
    if (low.includes("delete") || low.includes("remove") || low.includes("drop")) {
        if (!confirm("Are you sure?")) return;
    }

    if (editorType.value === "ts") {
        const tsRes = await queryTS(code, getDatabases());
        writeResult(tsRes);
    }
    else if (editorType.value === "sql") {
        const sqlRes = await querySQL(code, sqlDbSelect.value);
        if (sqlRes.err) return writeResult(sqlRes);
        writeResult(sqlRes.result);
    }
    else if (editorType.value === "config") {
        try {
            const { baseCfg, cfg } = await saveConfig(code);
            setConfig(cfg, baseCfg);
            writeResult(true);
        } catch (e) {
            console.error(e);
            writeResult(e);
        }
    } else {
        console.log("Unknown editor type");
    }
}