import { configDotenv } from "dotenv";
import { initKeys } from "./init/keys.js";
configDotenv({ quiet: true });
await import("./init/initDataBases.js");
global.baseDir = process.env.BASE_DIR || process.cwd();
await initKeys();
console.log("baseDir", global.baseDir);
await import("./http/index.js");
