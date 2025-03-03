import { generateHash } from "../server/auth/helpers";

export async function addUserAccess(login: string, password: string) {
    if (!/^[a-zA-Z0-9]+$/.test(login)) return { err: true, msg: "Login can only contain letters and numbers." };
    if (login.length < 3 || login.length > 10) return { err: true, msg: "Login must be between 3 and 10 characters." };
    if (password.length < 8 || password.length > 300) return { err: true, msg: "Password must be between 8 and 300 characters." };

    const userExists = await global.db.findOne("user", { login });
    if (userExists) return { err: true, msg: "Login already exists." };

    password = generateHash(password);

    const user = await global.db.add("user", {
        login,
        password
    });
    return { err: false, user };
}

export async function removeUser(idOrLogin: string) {
    return await global.db.removeOne("user", { $or: [{ _id: idOrLogin }, { login: idOrLogin }] });
}