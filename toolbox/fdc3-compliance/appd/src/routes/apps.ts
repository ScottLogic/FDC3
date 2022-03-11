import express from "express";
import { stringify } from "qs";
import { filterApps } from "../query/appQuery";
export const router = express.Router();

/**
 * GET apps by query parameters
 */
router.get("/search", function (req, res, next) {
  const result = filterApps(req.query);

  res.send({ applications: result, message: "OK" });
});

/**
 * GET app by id.
 */
router.get("/:appId", function (req, res, next) {

  let result;
  if (req.params.appId) {
    result = filterApps(req.params);

    res.send(result);
  } else {
    res.sendStatus(400);
  }
});


