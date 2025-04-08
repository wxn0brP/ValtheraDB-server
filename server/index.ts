import { configDotenv } from "dotenv";
import { initKeys } from "./init/keys";

configDotenv();
await import("./init/initDataBases");
global.baseDir = process.env.BASE_DIR || process.cwd();
await initKeys();

console.log("baseDir", global.baseDir);
await import("./express");