import FalconFrame from "@wxn0brp/falcon-frame";
import apiRouter  from "./db";
import onceRouter from "./once";

const app = new FalconFrame();
app.get("/", (req, res) => res.send("Server is running."));
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use("/", onceRouter);

if (process.env.gui) {
    const gui = await import("./gui");
    app.use("/gui", gui.default);
}

app.use("/", apiRouter);

const port = +process.env.PORT || 14785;
app.listen(port, () => console.log(`Server started on port ${port}`));