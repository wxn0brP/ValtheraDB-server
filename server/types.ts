import { Graph, Valthera } from "@wxn0brp/db";
import { GateWarden } from "@wxn0brp/gate-warden";

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
    var warden: GateWarden;
}

declare module "@wxn0brp/falcon-frame" {
    interface FFRequest {
        dataCenter: Valthera | Graph;
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