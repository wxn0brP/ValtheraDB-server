import { JwtManager, KeyIndex } from "@wxn0brp/wts-jwt";
import getSecret from "../vars/secret.js";
import { internalDB } from "./initDataBases.js";
let manager = null;
function getJwtManager() {
    manager ??= (async () => {
        const jwt = new JwtManager(KeyIndex, await getSecret());
        await jwt.init(internalDB);
        return jwt;
    })();
    return manager;
}
export async function initKeys() {
    await getJwtManager();
}
const jwtManager = {
    async create(...args) {
        return (await getJwtManager()).create(...args);
    },
    async decode(...args) {
        return (await getJwtManager()).decode(...args);
    },
};
export default jwtManager;
