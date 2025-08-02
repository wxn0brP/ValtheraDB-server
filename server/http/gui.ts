import { Router } from "@wxn0brp/falcon-frame";
const router = new Router();
import fs from "fs";

const dbPath = "node_modules/@wxn0brp/db/dist/";
console.log("[GUI] gui enabled");

router.get("/login", (req, res) => {
    res.sendFile("gui/login.html");
});
router.static("/", "gui");
router.static("/ts", dbPath);
router.static("/js", "gui-script/dist");

router.get("/ts/list", (req, res) => {
    const files = fs.readdirSync(dbPath+"/types", { recursive: true, withFileTypes: true })
        .filter(file => file.isFile())
        .filter(file => file.name.endsWith(".d.ts"))
        .map(file => file.parentPath.replace(dbPath, "") + "/" + file.name)
        .map(file => {
            if (file.startsWith("/")) file = file.slice(1);
            return file;
        })
    res.json(files);
});

export default router;