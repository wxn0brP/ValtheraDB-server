import { Router } from "@wxn0brp/falcon-frame";
import { authMiddleware } from "../auth/auth";
import csvRouter from "../query/csvFile";
import dbRouter from "../query/db";
import queryRouter from "../query/query";
import { relationRouter } from "../query/relation";
import sqlRouter from "../query/sqlFile";

export const apiRouter = new Router();
apiRouter.use(authMiddleware);
apiRouter.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    next();
});
apiRouter.use("/db", dbRouter);
apiRouter.use("/q", queryRouter);
apiRouter.use("/r", relationRouter);
apiRouter.use("/sql", sqlRouter);
apiRouter.use("/csv", csvRouter);
