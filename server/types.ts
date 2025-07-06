import { Graph, Valthera } from "@wxn0brp/db";

declare global {
    var baseDir: string;
    var internalDB: Valthera;
    var dataCenter: {
        [key: string]:
        (
            { type: "database", db: Valthera } |
            { type: "graph", db: Graph }
        ) & { dir: string }
    };
}

declare module "@wxn0brp/falcon-frame" {
    interface FFRequest {
        dataCenter: Valthera | Graph;
        dbType: "database" | "graph";
        dbDir: string;
        user: { _id: string };
    }
}

export interface DataBaseBuilder {
    type: "database" | "graph";
    name: string;
    folder: string;
    opts: any;
    parser: string;
}

export { }