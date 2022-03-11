import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";

import { router as appsRouter } from "./routes/apps";
import { router } from "./routes/index";

export const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/apps", appsRouter);
app.use("/", router);
app.use("/v1/apps", appsRouter);
app.use("/v1", router);
