import { Valthera } from "@wxn0brp/db/valthera";

declare module "@wxn0brp/falcon-frame" {
    interface FFRequest {
        dataCenter: Valthera;
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
