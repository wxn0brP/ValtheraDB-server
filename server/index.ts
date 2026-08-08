import { configDotenv } from "dotenv";
import { initKeys } from "./init/keys";
import { runtime_dir } from "./init/vars";
import logger from "./utils/logger";

configDotenv({
	quiet: true,
});
await import("./init/initDataBases");
await initKeys();

logger.info("Runtime dir:", runtime_dir);
await import("./http");
