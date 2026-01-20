import { join } from "node:path";

export const db_base_dir = process.env.VALTHERA_DB_DATA_DIR || "./volumes";
export const internal_db_dir = process.env.VALTHERA_DB_SERVER_DB || join(db_base_dir, "serverDB");
export const runtime_dir = process.env.VALTHERA_RUNTIME_DIR || process.cwd();