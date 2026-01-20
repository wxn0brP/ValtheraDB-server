import { configDotenv } from "dotenv";
import { initKeys } from "./init/keys";
import { runtime_dir } from "./init/vars";

configDotenv({ quiet: true });
await import("./init/initDataBases");
await initKeys();

console.log("Runtime dir:", runtime_dir);
await import("./http");