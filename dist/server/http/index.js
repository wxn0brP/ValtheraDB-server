import FalconFrame from "@wxn0brp/falcon-frame";
import { existsSync, readFileSync } from "fs";
import http from "http";
import https from "https";
import { apiRouter } from "./db.js";
import { onceRouter } from "./once.js";
const app = new FalconFrame();
app.setOrigin("*");
app.get("/", () => "Server is running.");
app.use(onceRouter);
app.static("/gui", "./gui");
app.get("/gui", (req, res) => res.redirect("/gui/"));
app.use(apiRouter);
const port = +process.env.PORT || 14785;
const handler = app.getApp();
const httpEnabled = process.env.HTTP_ENABLED !== "false";
const certPath = process.env.SSL_CERT;
const keyPath = process.env.SSL_KEY;
const keepAliveTimeout = +process.env.KEEPALIVE_TIMEOUT || 60000;
if (httpEnabled) {
    const httpServer = http.createServer(handler);
    httpServer.keepAliveTimeout = keepAliveTimeout;
    httpServer.headersTimeout = keepAliveTimeout + 5000;
    httpServer.listen(port, () => {
        console.log(`HTTP server started on port ${port}`);
    });
}
if (certPath && keyPath) {
    if (!existsSync(certPath) || !existsSync(keyPath)) {
        console.warn(`SSL_CERT or SSL_KEY file not found, HTTPS server not started`);
    }
    else {
        const sslPort = +process.env.SSL_PORT || port + 1;
        const sslOpts = {
            key: readFileSync(keyPath, "utf8"),
            cert: readFileSync(certPath, "utf8"),
        };
        const caPath = process.env.SSL_CA;
        if (caPath && existsSync(caPath)) {
            sslOpts.ca = readFileSync(caPath, "utf8");
        }
        const httpsServer = https.createServer(sslOpts, handler);
        httpsServer.keepAliveTimeout = keepAliveTimeout;
        httpsServer.headersTimeout = keepAliveTimeout + 5000;
        httpsServer.listen(sslPort, () => {
            const proto = caPath ? " (CA)" : "";
            console.log(`HTTPS${proto} server started on port ${sslPort}`);
        });
    }
}
if (!httpEnabled && !(certPath && keyPath)) {
    console.warn("No server started - HTTP is disabled and no SSL cert/key configured");
}
