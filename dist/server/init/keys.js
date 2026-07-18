import { JwtManager, KeyIndex } from "@wxn0brp/wts-jwt";
import getSecret from "../vars/secret.js";
import { internalDB } from "./initDataBases.js";
let manager = null;
function getJwtManager() {
    if (!manager)
        manager = new JwtManager(KeyIndex, getSecret());
    return manager;
}
export async function initKeys() {
    await getJwtManager().init(internalDB);
}
const jwtManager = {
    create(...args) {
        return getJwtManager().create(...args);
    },
    decode(...args) {
        return getJwtManager().decode(...args);
    }
};
export default jwtManager;
