import { RequestHandler } from "express";
import { ObjectId } from "mongodb";

const database = require("../../utils/db-connect");

const editGoals: RequestHandler = async (req, res, next) => {
  const { id: reqUserIdStr, task: reqTask, goals: reqGoalsStr } = req.body;

  const reqUserId = new ObjectId(reqUserIdStr);

  const databaseConnect = await database.getDb().collection("users");

  // CHECKS IF THE USER EXISTS
  const user = await databaseConnect.findOne({ _id: reqUserId });

  if (!user) {
    return res.status(404).json({ fatal: true });
  }

  const validInputs = {
    task: false,
    goal: false,
  };

  const tasks = [
    "nutrition",
    "sleep",
    "sports",
    "relaxation",
    "projects",
    "social_life",
  ];

  if (tasks.includes(reqTask)) {
    validInputs.task = true;
  }

  if (reqGoalsStr.trim().length < 100) {
    validInputs.goal = true;
  }

  if (!validInputs.task || !validInputs.goal) {
    return res.status(400).json({ error: true, validInputs });
  }

  const editedUser = await databaseConnect.updateOne(
    { _id: reqUserId },
    { $set: { [`goals.${reqTask}`]: reqGoalsStr } }
  );

  if (!editedUser) {
    return res.status(400).json({
      message: "Erreur lors de l'enregistrement des données.",
    });
  }

  res.status(200).json({ message: "Goal edited." });
};

exports.editGoals = editGoals;
