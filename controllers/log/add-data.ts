import { RequestHandler } from "express";

const { ObjectId } = require("mongodb");
const { isAfter, isSameDay } = require("date-fns");

const database = require("../../utils/db-connect");

const addData: RequestHandler = async (req, res, next) => {
  const {
    _id: reqIdStr,
    date: reqDateStr,
    task: reqTask,
    levelOfCompletion: reqLevelOfCompletion,
  } = req.body;

  const reqDate = new Date(reqDateStr);

  const databaseConnect = await database.getDb().collection("users");

  const reqId = ObjectId(reqIdStr);

  // CHECKS IF THE USER EXISTS
  const user = await databaseConnect.findOne({ _id: reqId });

  if (!user) {
    res.status(404).json({ fatal: true });
    return;
  }

  // VALIDATION
  let inputsAreValid = {
    all: false,
    _id: true,
    date: {
      valid: false,
      format: false,
      pastOrPresent: false,
    },
    task: false,
    levelOfCompletion: false,
  };

  // CHECKS IF THE DATE IS A DATE
  if (!reqDate) {
    inputsAreValid.date.format = false;
  }

  inputsAreValid.date.format = true;

  // CHECKS IF DATE IS IN THE FUTURE
  if (isAfter(reqDate, new Date()) && !isSameDay(reqDate, new Date())) {
    return res.status(400).json({
      error: true,
      message:
        "Impossible d'enregistrer des données dont la date est dans le futur.",
    });
  } else inputsAreValid.date.pastOrPresent = true;

  // VALIDATES IF THE DATE IS IN THE CORRECT FORMAT AND NOT IN THE FUTURE
  if (inputsAreValid.date.format && inputsAreValid.date.pastOrPresent) {
    inputsAreValid.date.valid = true;
  }

  // VALIDATES THE TASK
  const taskNames = [
    "nutrition",
    "sleep",
    "sports",
    "relaxation",
    "projects",
    "social_life",
  ];

  if (taskNames.includes(reqTask)) inputsAreValid.task = true;

  // VALIDATES THE LEVEL OF COMPLETION
  const taskLevels = [0, 1, 2];

  if (taskLevels.includes(reqLevelOfCompletion))
    inputsAreValid.levelOfCompletion = true;

  // VALIDATES THE WHOLE DATA
  if (
    inputsAreValid._id &&
    inputsAreValid.date.valid &&
    inputsAreValid.task &&
    inputsAreValid.levelOfCompletion
  ) {
    inputsAreValid.all = true;
  }

  if (!inputsAreValid.all) {
    return res.status(400).json({
      error: true,
      message:
        "Erreur lors de l'enregistrement de données, certaines données sont invalides.",
    });
  }

  await databaseConnect
    .findOne({ _id: reqId, "log.date": reqDate })
    .then((result: {}) => {
      if (result) {
        databaseConnect.updateOne(
          { _id: reqId, "log.date": reqDate },
          {
            $set: {
              [`log.$.six.${reqTask}`]: reqLevelOfCompletion,
            },
          }
        );
      } else {
        databaseConnect.updateOne(
          { _id: reqId },
          {
            $push: {
              log: {
                date: reqDate,
                six: {
                  nutrition: 0,
                  sleep: 0,
                  sports: 0,
                  relaxation: 0,
                  projects: 0,
                  social_life: 0,
                  [reqTask]: reqLevelOfCompletion,
                },
              },
            },
          }
        );
      }
      res.status(201).json({ success: true });
    })
    .catch((err: {}) => {
      res.status(400).json({
        message: "Erreur lors de l'enregistrement des données.",
      });
    });
};

exports.addData = addData;
