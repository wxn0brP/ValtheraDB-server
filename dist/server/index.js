import { configDotenv } from "dotenv";
import { initKeys } from "./init/keys.js";
import { runtime_dir } from "./init/vars.js";
configDotenv({ quiet: true });
await import("./init/initDataBases.js");
await initKeys();
console.log("Runtime dir:", runtime_dir);
await import("./http/index.js");
