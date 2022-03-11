import express from "express";
export const router = express.Router();

/* GET index */
router.get("/", function (req, res, next) {
  const result = { description: "FDC3 App Directory API", version: "2.0" };

  res.send(result);
});