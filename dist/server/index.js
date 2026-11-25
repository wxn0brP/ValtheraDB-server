import { loadEnvFile } from "process";
import { initKeys } from "./init/keys.js";
import { runtime_dir } from "./init/vars.js";
import logger from "./utils/logger.js";
try {
    loadEnvFile();
}
catch { }
await import("./init/dbWatch.js");
await initKeys();
logger.info("Runtime dir:", runtime_dir);
await import("./http/index.js");
