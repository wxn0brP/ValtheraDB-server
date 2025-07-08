import { UserManager } from "@wxn0brp/gate-warden";
import { generateHash } from "../server/auth/helpers";

export async function addUserAccess(login: string, password: string) {
    if (!/^[a-zA-Z0-9]+$/.test(login)) return { err: true, msg: "Login can only contain letters and numbers." };
    if (login.length < 3 || login.length > 10) return { err: true, msg: "Login must be between 3 and 10 characters." };
    if (password.length < 8 || password.length > 300) return { err: true, msg: "Password must be between 8 and 300 characters." };

    const userExists = await global.internalDB.findOne("user", { login });
    if (userExists) return { err: true, msg: "Login already exists." };

    password = generateHash(password);

    const user = await global.internalDB.add("user", {
        login,
        password
    });
    const userMgmt = new UserManager(global.internalDB);
    await userMgmt.createUser({ _id: user._id });
    return { err: false, user };
}

export async function removeUser(idOrLogin: string) {
    const userId = await global.internalDB.findOne("user", { $or: [{ _id: idOrLogin }, { login: idOrLogin }] });
    if (!userId) return false;
    await global.internalDB.removeOne("user", { _id: userId._id });
    const userMgmt = new UserManager(global.internalDB);
    await userMgmt.deleteUser(userId._id);
    return true;
}