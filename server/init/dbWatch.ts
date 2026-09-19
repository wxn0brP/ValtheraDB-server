import { watch } from "fs";
import { cache as authCache } from "../auth/auth";
import logger from "../utils/logger";
import { cache as permCache } from "../utils/perm";
import { internal_db_dir } from "./vars";
import { loadDataBases } from "./initDataBases";

const DEBOUNCE_MS = 300;
const pending = new Map<string, ReturnType<typeof setTimeout>>();

function debounce(category: string, fn: () => void) {
	const existing = pending.get(category);
	if (existing) clearTimeout(existing);
	pending.set(
		category,
		setTimeout(() => {
			pending.delete(category);
			fn();
		}, DEBOUNCE_MS),
	);
}

watch(
	internal_db_dir,
	{
		recursive: true,
	},
	(evt, file) => {
		const [dir] = file.split("/");
		if (!dir) return;

		switch (dir) {
			case "dbs":
				debounce("dbs", () => {
					loadDataBases();
					permCache.clear();
					logger.info("DBs reloaded");
				});
				break;
			case "token":
				debounce("token", () => {
					authCache.clear();
					logger.info("Token cache reloaded");
				});
				break;
			case "acl":
			case "abac":
			case "role":
			case "roles":
			case "user":
			case "users":
			case "wolf":
			case "encryptionKeys":
				debounce("permissions", () => {
					permCache.clear();
					authCache.clear();
					logger.info("Permissions & Auth cache reloaded");
				});
				break;
		}
	},
);
