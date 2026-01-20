import { JwtManager, KeyIndex } from "@wxn0brp/wts-jwt";
import getSecret from "../vars/secret";
import { internalDB } from "./initDataBases";

let jwtManager = new JwtManager(KeyIndex, getSecret());

export async function initKeys() {
    await jwtManager.init(internalDB);
}

export default jwtManager;