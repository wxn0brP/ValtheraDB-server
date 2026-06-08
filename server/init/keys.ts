import { JwtManager, KeyIndex } from "@wxn0brp/wts-jwt";
import getSecret from "../vars/secret";
import { internalDB } from "./initDataBases";

let manager: JwtManager | null = null;

function getJwtManager() {
    if (!manager) manager = new JwtManager(KeyIndex, getSecret());
    return manager;
}

export async function initKeys() {
    await getJwtManager().init(internalDB);
}

const jwtManager = {
    create(...args: Parameters<JwtManager["create"]>) {
        return getJwtManager().create(...args);
    },
    decode(...args: Parameters<JwtManager["decode"]>) {
        return getJwtManager().decode(...args);
    }
};

export default jwtManager;
