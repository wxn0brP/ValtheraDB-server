import { JwtManager, KeyIndex } from "@wxn0brp/wts-jwt";
import getSecret from "../vars/secret";

let jwtManager = new JwtManager(KeyIndex, getSecret());
export async function initKeys() {
    await jwtManager.init(global.internalDB as any);
}

export default jwtManager;