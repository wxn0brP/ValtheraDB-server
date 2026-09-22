import { loadEnvFile } from "process";
import { initKeys } from "./init/keys";
import { runtime_dir } from "./init/vars";
import logger from "./utils/logger";

try {
	loadEnvFile();
} catch {}
await import("./init/dbWatch");
await initKeys();

logger.info("Runtime dir:", runtime_dir);
await import("./http");
