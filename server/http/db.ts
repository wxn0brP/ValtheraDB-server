import { Router } from "@wxn0brp/falcon-frame";
import { authMiddleware } from "../auth/auth";
import dbRelationRouter from "../query/relation";
import dbRouter from "../query/db";
import queryRouter from "../query/query";
import sqlRouter from "../query/sqlFile";
import csvRouter from "../query/csvFile";

const apiRouter = new Router();
apiRouter.use(authMiddleware);
apiRouter.use("/db", dbRouter);
apiRouter.use("/q", queryRouter);
apiRouter.use("/r", dbRelationRouter);
apiRouter.use("/sql", sqlRouter);
apiRouter.use("/csv", csvRouter);

export default apiRouter;