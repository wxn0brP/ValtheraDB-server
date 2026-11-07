import { watch } from "fs";
import { cache as authCache } from "../auth/auth.js";
import logger from "../utils/logger.js";
import { cache as permCache } from "../utils/perm.js";
import { internal_db_dir } from "./vars.js";
import { loadDataBases } from "./initDataBases.js";
const DEBOUNCE_MS = 300;
const pending = new Map();
function debounce(category, fn) {
    const existing = pending.get(category);
    if (existing)
        clearTimeout(existing);
    pending.set(category, setTimeout(() => {
        pending.delete(category);
        fn();
    }, DEBOUNCE_MS));
}
watch(internal_db_dir, {
    recursive: true,
}, (evt, file) => {
    const [dir] = file.split("/");
    if (!dir)
        return;
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
});
