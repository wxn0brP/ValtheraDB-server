import { Router } from "@wxn0brp/falcon-frame";
import { authMiddleware } from "../auth/auth";
import dbRouter from "../query/db";
import dbQueryRouter from "../query/query";
import dbRelationRouter from "../query/relation";
import sqlRouter from "../query/sqlFile";

const apiRouter = new Router();
apiRouter.use(authMiddleware);
apiRouter.use("/db", dbRouter);
apiRouter.use("/q", dbQueryRouter);
apiRouter.use("/r", dbRelationRouter);
apiRouter.use("/sql", sqlRouter);

export default apiRouter;