import { RequestHandler } from "express";
import { ObjectId } from "mongodb";

const database = require("../../utils/db-connect");

const getGoals: RequestHandler = async (req, res, next) => {
  const { id: reqIdStr, task: reqTask } = req.params;

  const reqId = new ObjectId(reqIdStr);

  const databaseConnect = await database.getDb().collection("users");

  // CHECKS IF THE USER EXISTS
  const user = await databaseConnect.findOne({ _id: reqId });

  if (!user) {
    return res.status(404).json({ fatal: true });
  }

  res.status(200).json({ success: true, goals: user.goals[reqTask] });
};

exports.getGoals = getGoals;
