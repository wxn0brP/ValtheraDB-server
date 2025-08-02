import FalconFrame from "@wxn0brp/falcon-frame";
import apiRouter  from "./db";
import onceRouter from "./once";
import { createCORSPlugin } from "@wxn0brp/falcon-frame/plugins/cors";

const app = new FalconFrame();
app.use(createCORSPlugin(["*"]).process);
app.get("/", () => "Server is running.");
app.use(onceRouter);

if (process.env.gui) {
    const gui = await import("./gui");
    app.use("/gui", gui.default);
}

app.use(apiRouter);

const port = +process.env.PORT || 14785;
app.listen(port, () => console.log(`Server started on port ${port}`));