import { RouteHandler, Router } from "@wxn0brp/falcon-frame";
import { authMiddleware } from "../auth/auth";
import dbRouter from "../query/db";
import dbQueryRouter from "../query/query";
import dbRelationRouter from "../query/relation";
import sqlRouter from "../query/sqlFile";


const checkRequest: RouteHandler = (req, res, next) => {
    const dbName = req.body.db;

    if (!global.dataCenter[dbName]) {
        return res.status(400).json({ err: true, msg: "Invalid data center." });
    }

    req.dataCenter = global.dataCenter[dbName].db as any;
    req.dbType = global.dataCenter[dbName].type;
    req.dbDir = global.dataCenter[dbName].dir;

    next();
};

const apiRouter = new Router();
apiRouter.use(authMiddleware);

apiRouter.use("/db/", checkRequest);
apiRouter.use("/db/", dbRouter);

apiRouter.use("/q/", dbQueryRouter);

apiRouter.use("/r/", dbRelationRouter);

apiRouter.use("/sql/", sqlRouter);


export default apiRouter;