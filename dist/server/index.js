import { configDotenv } from "dotenv";
import { initKeys } from "./init/keys.js";
import { runtime_dir } from "./init/vars.js";
import logger from "./utils/logger.js";
configDotenv({
    quiet: true,
});
await import("./init/initDataBases.js");
await initKeys();
logger.info("Runtime dir:", runtime_dir);
await import("./http/index.js");
