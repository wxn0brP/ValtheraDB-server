import { JwtManager, KeyIndex } from "@wxn0brp/wts-jwt";
import getSecret from "../vars/secret.js";
import { internalDB } from "./initDataBases.js";
let jwtManager = new JwtManager(KeyIndex, getSecret());
export async function initKeys() {
    await jwtManager.init(internalDB);
}
export default jwtManager;
