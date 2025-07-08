import { configDotenv } from "dotenv";
import { initKeys } from "./init/keys";

configDotenv({ quiet: true });
await import("./init/initDataBases");
global.baseDir = process.env.BASE_DIR || process.cwd();
await initKeys();

console.log("baseDir", global.baseDir);
await import("./http");