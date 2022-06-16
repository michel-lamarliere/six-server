import { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import {
  addDays,
  getDaysInMonth,
  getMonth,
  isBefore,
  isSameDay,
} from "date-fns";

const database = require("../../utils/db-connect");

const getAnnualData: RequestHandler = async (req, res, next) => {
  const reqUserId = new ObjectId(req.body.userId);
  const reqYear: number = +req.params.year;
  const reqTask = req.params.task;

  const databaseConnect = await database.getDb().collection("users");

  const resultsArray: {
    empty: number;
    half: number;
    full: number;
    future: number;
  }[] = [];

  for (let i = 1; i <= 12; i++) {
    resultsArray.push({
      empty: 0,
      half: 0,
      full: 0,
      future: 0,
    });
  }

  await databaseConnect
    .aggregate([
      {
        $match: {
          _id: reqUserId,
        },
      },
      {
        $project: {
          _id: 0,
          log: 1,
        },
      },
      {
        $unwind: "$log",
      },
      {
        $match: {
          $and: [
            {
              "log.date": {
                $gte: new Date(reqYear, 0, 1),
              },
            },
            { "log.date": { $lte: new Date(reqYear, 11, 31) } },
          ],
        },
      },
      {
        $project: {
          date: "$log.date",
          levelNumber: `$log.six.${reqTask}`,
        },
      },
      {
        $sort: {
          "log.date": 1,
        },
      },
      {
        $addFields: {
          month: {
            $month: "$date",
          },
          level: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$levelNumber", 0] },
                  then: "empty",
                },
                {
                  case: { $eq: ["$levelNumber", 1] },
                  then: "half",
                },
                {
                  case: { $eq: ["$levelNumber", 2] },
                  then: "full",
                },
              ],
            },
          },
        },
      },
      {
        $project: {
          month: 1,
          level: 1,
        },
      },
    ])
    .forEach((doc: { month: number; level: "empty" | "half" | "full" }) => {
      resultsArray[doc.month - 1][`${doc.level}`]++;
    });

  for (let i = 0; i < resultsArray.length; i++) {
    const daysInLoopingMonth = getDaysInMonth(new Date(reqYear, i, 1));
    const loopingDate = new Date(reqYear, i, daysInLoopingMonth);

    if (isBefore(loopingDate, new Date())) {
      resultsArray[i].empty =
        daysInLoopingMonth - (resultsArray[i].half + resultsArray[i].full);
    } else {
      const loopingMonth = getMonth(loopingDate);

      let index = 0;
      // GETTING THE INDEX OF WHEN THE FUTURE STARTS
      for (let y = 0; y < daysInLoopingMonth; y++) {
        if (
          isSameDay(addDays(new Date(reqYear, loopingMonth, 1), y), new Date())
        ) {
          index = y + 1;
        }
      }

      resultsArray[i].future = daysInLoopingMonth - index;

      resultsArray[i].empty =
        daysInLoopingMonth -
        (resultsArray[i].full + resultsArray[i].half + resultsArray[i].future);
    }
  }
  res.status(200).json({ success: true, array: resultsArray });
};

exports.getAnnualData = getAnnualData;
