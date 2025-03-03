import express from "express";
import { authMiddleware } from "../auth/auth";
import dbRouter from "../query/db";
import dbQueryRouter from "../query/query";

function checkRequest(req, res, next){
    const dbName = req.body.db;

    if(!global.dataCenter[dbName]){
        return res.status(400).json({ err: true, msg: "Invalid data center." });
    }

    req.dataCenter = global.dataCenter[dbName].db;
    req.dbType = global.dataCenter[dbName].type;

    next();
}

export const apiDbRouter = express.Router();
apiDbRouter.use(authMiddleware);
apiDbRouter.use(checkRequest);
apiDbRouter.use(dbRouter);

export const queryApiRouter = express.Router();
queryApiRouter.use(authMiddleware);
queryApiRouter.use(dbQueryRouter);