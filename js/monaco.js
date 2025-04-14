import * as monaco from "monaco-editor/esm/vs/editor/editor.main.js";
import { getConfig, getDatabases } from "./db.js";
import { convertJsonToJS } from "./utils.js";
export const sqlDbSelect = document.querySelector("#sql-db-select");
self.MonacoEnvironment = {
    getWorkerUrl: function (moduleId, label) {
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
};
function changeLanguage(lang) {
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
export { monaco };
export function setDatabases(dbs, graphs) {
    const dbsType = `
      declare var db: { 
        ${dbs.map(name => `${name}: V_DataBaseRemote<VC_${name}>    `).join(', ')},
        ${graphs.map(name => `${name}: V_GraphRemote<VC_${name}>    `).join(', ')}
      };
    `.replaceAll(",,", ",");
    monaco.languages.typescript.typescriptDefaults.addExtraLib(dbsType, 'ts:valthera-dbs.d.ts');
}
export function changeEditor(type) {
    if (type === "ts") {
        changeLanguage("typescript");
        editor.setValue(``);
        sqlDbSelect.style.display = "none";
    }
    else if (type === "sql") {
        changeLanguage("sql");
        editor.setValue(``);
        const databases = Object.keys(getDatabases());
        sqlDbSelect.innerHTML = databases.map(db => `<option value="${db}">${db}</option>`).join("");
        sqlDbSelect.style.display = "";
    }
    else if (type === "config") {
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
    }
    else {
        const n = type;
        console.log(n);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uYWNvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21vbmFjby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxNQUFNLDRDQUE0QyxDQUFDO0FBQ3JFLE9BQU8sRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQy9DLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFFMUMsTUFBTSxDQUFDLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQW9CLGdCQUFnQixDQUFDLENBQUM7QUFFdEYsSUFBWSxDQUFDLGlCQUFpQixHQUFHO0lBQzlCLFlBQVksRUFBRSxVQUFVLFFBQWdCLEVBQUUsS0FBYTtRQUNuRCxJQUFJLEtBQUssS0FBSyxNQUFNLEVBQUUsQ0FBQztZQUNuQixPQUFPLHNDQUFzQyxDQUFDO1FBQ2xELENBQUM7UUFDRCxJQUFJLEtBQUssS0FBSyxLQUFLLElBQUksS0FBSyxLQUFLLE1BQU0sSUFBSSxLQUFLLEtBQUssTUFBTSxFQUFFLENBQUM7WUFDMUQsT0FBTyxvQ0FBb0MsQ0FBQztRQUNoRCxDQUFDO1FBQ0QsSUFBSSxLQUFLLEtBQUssTUFBTSxJQUFJLEtBQUssS0FBSyxZQUFZLElBQUksS0FBSyxLQUFLLE9BQU8sRUFBRSxDQUFDO1lBQ2xFLE9BQU8sc0NBQXNDLENBQUM7UUFDbEQsQ0FBQztRQUNELElBQUksS0FBSyxLQUFLLFlBQVksSUFBSSxLQUFLLEtBQUssWUFBWSxFQUFFLENBQUM7WUFDbkQsT0FBTywwQ0FBMEMsQ0FBQztRQUN0RCxDQUFDO1FBQ0QsT0FBTyxpQ0FBaUMsQ0FBQztJQUM3QyxDQUFDO0NBQ0osQ0FBQTtBQUVELFNBQVMsY0FBYyxDQUFDLElBQVk7SUFDaEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDNUQsQ0FBQztB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