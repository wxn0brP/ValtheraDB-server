import express from "express";
const router = express.Router();
import fs from "fs";

const dbPath = "node_modules/@wxn0brp/db/dist/";

router.use("/", express.static("gui"));
router.use("/js", express.static("gui-script/dist"));
router.use("/ts", express.static(dbPath));

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