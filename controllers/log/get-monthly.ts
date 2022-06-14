import { RequestHandler } from "express";

const { ObjectId } = require("mongodb");
const {
  addDays,
  isAfter,
  getDaysInMonth,
  lastDayOfMonth,
  isSameDay,
} = require("date-fns");

const database = require("../../utils/db-connect");

const getMonthly: RequestHandler = async (req, res, next) => {
  const reqId = new ObjectId(req.params.id);
  const reqFirstDateOfMonth = new Date(req.params.date);
  const reqTask = req.params.task;

  const databaseConnect = await database.getDb().collection("users");

  // CHECKS IF THE USER EXISTS
  const user = await databaseConnect.findOne({ _id: reqId });

  if (!user) {
    res.status(404).json({ fatal: true });
    return;
  }

  const numberOfDaysInMonth: number = getDaysInMonth(reqFirstDateOfMonth);
  const lastDateOfMonth = lastDayOfMonth(reqFirstDateOfMonth);

  let matchedDatesArray: { date: Date; level: number }[] = [];

  await databaseConnect
    .aggregate([
      {
        $match: {
          _id: reqId,
        },
      },
      {
        $unwind: {
          path: "$log",
        },
      },
      { $sort: { "log.date": 1 } },
      {
        $match: {
          $and: [
            {
              "log.date": {
                $gte: reqFirstDateOfMonth,
              },
            },
            {
              "log.date": {
                $lte: lastDateOfMonth,
              },
            },
          ],
        },
      },
      { $project: { _id: 0, date: "$log.date", level: `$log.six.${reqTask}` } },
    ])
    .forEach((doc: { date: Date; level: number }) => {
      matchedDatesArray.push(doc);
    });

  for (let i = 0; i < numberOfDaysInMonth; i++) {
    let loopingDate = addDays(reqFirstDateOfMonth, i);
    let found = false;
    for (let i = 0; i < matchedDatesArray.length; i++) {
      if (isSameDay(loopingDate, matchedDatesArray[i].date)) {
        found = true;
      }
    }

    if (!found) {
      matchedDatesArray.push({
        date: loopingDate,
        level: 0,
      });
    }
  }

  const sortArray = (a: { date: Date }, b: { date: Date }) => {
    return isAfter(a.date, b.date) ? 1 : -1;
  };

  matchedDatesArray.sort(sortArray);

  res.status(200).json(matchedDatesArray);
};

exports.getMonthly = getMonthly;
