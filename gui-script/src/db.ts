import { monaco, setDatabases } from "./monaco";
import { GraphRemote, ValtheraRemote } from "@wxn0brp/db-client";

interface AddDatabaseOpts {
    url?: string;
    name?: string;
    auth?: string;
    type?: "valthera" | "graph";
}

export let baseConfig = {
    url: "",
    auth: ""
}

export let config: { [key: string]: AddDatabaseOpts } = {}
let databases: Record<string, ValtheraRemote | GraphRemote> = {};

async function loadCollections(name: string) {
    const collections = await databases[name].getCollections() as string[];
    const type = `
        declare type VC_${name} = ${collections.map(v => `"${v}"`).join(" | ")}
    `
    monaco.languages.typescript.typescriptDefaults.addExtraLib(type, `ts:valthera-db-types-collections-${name}.d.ts`);
}

export function initDatabases() {
    databases = {};
    const dbs: string[] = [];
    const graphs: string[] = [];
    const configKeys = Object.keys(config);
    for (const key of configKeys) {
        let instance: ValtheraRemote | GraphRemote;
        const cfg = getDbConfig(key);
        switch (cfg.type) {
            case "valthera":
                instance = new ValtheraRemote(cfg);
                dbs.push(key);
                break;
            case "graph":
                instance = new GraphRemote(cfg);
                graphs.push(key);
                break;
            default:
                console.log("Unknown database type");
                continue;
        }
        databases[key] = instance;
        loadCollections(key);
    }

    setDatabases(dbs, graphs);
}

export function getConfig() {
    return { config, baseConfig };
}

export function getDatabases() {
    return databases;
}

export function getDbConfig(name: string) {
    const opts = config[name];
    const cfg = {
        type: opts.type || "valthera",
        ...baseConfig,
        name: opts.name || name
    }
    if (opts.url) cfg.url = opts.url;
    if (opts.auth) cfg.auth = opts.auth;
    if (!cfg.url || cfg.url.trim() === "") cfg.url = window.location.origin;

    return cfg;
}


export function setConfig(cfg: typeof config, baseCfg: typeof baseConfig) {
    config = cfg;
    baseConfig = baseCfg;
    localStorage.setItem("cfg", JSON.stringify({ cfg, baseCfg }));
    initDatabases();
}

setTimeout(() => {
    if (localStorage.getItem("cfg")) {
        const { cfg, baseCfg } = JSON.parse(localStorage.getItem("cfg"));
        setConfig(cfg, baseCfg);
    }
}, 100);