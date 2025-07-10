import { monaco } from "./monaco.js";
const typePattern = /(?<=declare\s+)(interface|enum|class|type|const|function|namespace)\s+([A-Za-z_][A-Za-z0-9_]*)/g;
monaco.languages.typescript.typescriptDefaults.addExtraLib(`
declare interface BaseCfg {
    url: string;
    auth: string;
}
declare interface Cfg {
    url?: string;
    name?: string;
    auth?: string;
    type?: "valthera" | "graph";
}
declare type CfgR = Record<string, Cfg>;`, 'ts:valthera-cfg.d.ts');
async function loadTypeDef(file) {
    let content = await fetch(`./ts/${file}`).then((res) => res.text());
    content = content
        .replace(/^\s*import .*?;?\s*$/gm, "")
        .replace(/^\s*export\s+{[^}]*};?\s*$/gm, "")
        .replace(/export\s+default\s+/, "declare ")
        .replace(/export\s+(?=(class|interface|type|const|function|enum|namespace))/g, "declare ")
        .replace(typePattern, "$1 V_$2");
    return { file: `ts:valthera-db-server-${file.replace("/", "-")}`, content };
}
function extractOriginalTypes(content) {
    const matches = content.matchAll(typePattern);
    const types = [];
    for (const match of matches) {
        types.push(match[2]);
    }
    return types;
}
async function loadTypes(files) {
    let typeDefs = await Promise.all(files.map(loadTypeDef));
    let originalTypes = [
        "V_Valthera",
        "V_Graph",
        "V_ValtheraRemote",
        "V_GraphRemote",
    ];
    typeDefs.forEach((typeDef) => {
        const types = extractOriginalTypes(typeDef.content);
        originalTypes = originalTypes.concat(types);
    });
    originalTypes = [...new Set(originalTypes)];
    typeDefs = typeDefs.map((typeDef) => {
        let modifiedContent = typeDef.content;
        originalTypes.forEach((VType) => {
            const type = VType.replace("V_", "");
            const regex = new RegExp(`\\b${type}\\b`, "g");
            modifiedContent = modifiedContent.replace(regex, VType);
        });
        return {
            file: typeDef.file,
            content: modifiedContent,
        };
    });
    typeDefs.forEach(({ file, content }) => {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(content, file);
    });
}
async function loadDbType(file, name) {
    const data = await loadTypeDef(file);
    data.content = data.content
        .replace(`V_${name}`, `V_${name}<A=string, C=A | (string & {})>`)
        .replaceAll("collection: string", "collection: C");
    return data;
}
async function loadDbTypes() {
    const types = await Promise.all([
        loadDbType("db/valthera.d.ts", "Valthera"),
        loadDbType("client/valthera.d.ts", "ValtheraRemote"),
        loadDbType("db/graph.d.ts", "Graph"),
        loadDbType("client/graph.d.ts", "GraphRemote"),
    ]);
    types.forEach(({ file, content }) => {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(content, file);
    });
}
export async function loadMonacoTypes() {
    const typesList = await fetch("./ts/list").then((res) => res.json());
    await loadTypes([
        "helpers/CollectionManager.d.ts",
        ...typesList,
    ]);
    await loadDbTypes();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uYWNvLnR5cGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21vbmFjby50eXBlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQ2xDLE1BQU0sV0FBVyxHQUFHLGlHQUFpRyxDQUFDO0FBRXRILE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7eUNBV2xCLEVBQ3JDLHNCQUFzQixDQUFDLENBQUM7QUFFNUIsS0FBSyxVQUFVLFdBQVcsQ0FBQyxJQUFZO0lBQ25DLElBQUksT0FBTyxHQUFHLE1BQU0sS0FBSyxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBRXBFLE9BQU8sR0FBRyxPQUFPO1NBQ1osT0FBTyxDQUFDLHdCQUF3QixFQUFFLEVBQUUsQ0FBQztTQUNyQyxPQUFPLENBQUMsOEJBQThCLEVBQUUsRUFBRSxDQUFDO1NBQzNDLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxVQUFVLENBQUM7U0FDMUMsT0FBTyxDQUFDLG9FQUFvRSxFQUFFLFVBQVUsQ0FBQztTQUN6RixPQUFPLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBRXJDLE9BQU8sRUFBRSxJQUFJLEVBQUUseUJBQXlCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUM7QUFDaEYsQ0FBQztBQUVELFNBQVMsb0JBQW9CLENBQUMsT0FBZTtJQUN6QyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzlDLE1BQU0sS0FBSyxHQUFhLEVBQUUsQ0FBQztJQUUzQixLQUFLLE1BQU0sS0FBSyxJ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