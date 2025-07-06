import { monaco } from "./monaco";
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
declare type CfgR = Record<string, Cfg>;`,
    'ts:valthera-cfg.d.ts');

async function loadTypeDef(file: string) {
    let content = await fetch(`./ts/${file}`).then((res) => res.text());

    content = content
        .replace(/^\s*import .*?;?\s*$/gm, "")
        .replace(/^\s*export\s+{[^}]*};?\s*$/gm, "")
        .replace(/export\s+default\s+/, "declare ")
        .replace(/export\s+(?=(class|interface|type|const|function|enum|namespace))/g, "declare ")
        .replace(typePattern, "$1 V_$2");

    return { file: `ts:valthera-db-server-${file.replace("/", "-")}`, content };
}

function extractOriginalTypes(content: string): string[] {
    const matches = content.matchAll(typePattern);
    const types: string[] = [];

    for (const match of matches) {
        types.push(match[2]);
    }

    return types;
}

async function loadTypes(files: string[]) {
    let typeDefs = await Promise.all(files.map(loadTypeDef));
    let originalTypes: string[] = [
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

async function loadDbType(file: string, name: string) {
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