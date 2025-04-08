import { Valthera } from "@wxn0brp/db";

declare global {
    var baseDir: string;
    var db: Valthera;
}

export interface DataBaseBuilder {
    type: "database" | "graph";
    name: string;
    folder: string;
    opts: any;
    parser: string;
}

export {}