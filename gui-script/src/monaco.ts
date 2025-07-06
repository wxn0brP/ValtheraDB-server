import * as monaco from "monaco-editor/esm/vs/editor/editor.main.js";
import { getConfig, getDatabases } from "./db";
import { convertJsonToJS } from "./utils";

export const sqlDbSelect = document.querySelector<HTMLSelectElement>("#sql-db-select");

(self as any).MonacoEnvironment = {
    getWorkerUrl: function (moduleId: string, label: string) {
        if (label === "json") {
            return "./js/vs/language/json/json.worker.js";
        }
        if (label === "css" || label === "scss" || label === "less") {
            return "./js/vs/language/css/css.worker.js";
        }
        if (label === "html" || label === "handlebars" || label === "razor") {
            return "./js/vs/language/html/html.worker.js";
        }
        if (label === "typescript" || label === "javascript") {
            return "./js/vs/language/typescript/ts.worker.js";
        }
        return "./js/vs/editor/editor.worker.js";
    }
}

function changeLanguage(lang: string) {
    monaco.editor.setModelLanguage(editor.getModel(), lang);
}

const container = document.querySelector("#editor");
let editor = monaco.editor.create(container, {
    value: ``,
    language: "typescript",
    theme: "vs-dark",
    automaticLayout: true,
    lineNumbersMinChars: 2,
    minimap: { enabled: false }
});

export default editor;
export { monaco }

export function setDatabases(dbs: string[], graphs: string[]) {
    const dbsType = `
      declare var db: { 
        ${dbs.map(name => `${name}: V_ValtheraRemote<VC_${name}>    `).join(', ')},
        ${graphs.map(name => `${name}: V_GraphRemote<VC_${name}>    `).join(', ')}
      };
    `.replaceAll(",,", ",");

    monaco.languages.typescript.typescriptDefaults.addExtraLib(dbsType, 'ts:valthera-dbs.d.ts');
}

export function changeEditor(type: "ts" | "sql" | "config") {
    if (type === "ts") {
        changeLanguage("typescript");
        editor.setValue(``);
        sqlDbSelect.style.display = "none";
    } else if (type === "sql") {
        changeLanguage("sql");
        editor.setValue(``);
        const databases = Object.keys(getDatabases());
        sqlDbSelect.innerHTML = databases.map(db => `<option value="${db}">${db}</option>`).join("");
        sqlDbSelect.style.display = "";
    } else if (type === "config") {
        changeLanguage("typescript");
        sqlDbSelect.style.display = "none";
        const { config, baseConfig } = getConfig();

        const cfg = convertJsonToJS(JSON.stringify(config, null, 4));
        const text = `
const baseCfg: BaseCfg = {
    url: "${baseConfig.url}",
    auth: "${baseConfig.auth}"
}
const cfg: CfgR = ${cfg};
`.trim();
        editor.setValue(text);
    } else {
        const n: never = type;
        console.log(n);
    }
}