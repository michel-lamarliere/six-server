import { RequestHandler } from "express";

const { ObjectId } = require("mongodb");
const { addDays, isAfter, isSameDay } = require("date-fns");

const database = require("../../utils/db-connect");

const getWeeklyData: RequestHandler = async (req, res, next) => {
  const reqId = new ObjectId(req.params.id);
  const reqStartDate = new Date(req.params.startofweek);

  const databaseConnect = await database.getDb().collection("users");

  // CHECKS IF THE USER EXISTS
  const user = await databaseConnect.findOne({ _id: reqId });

  if (!user) {
    res.status(404).json({ fatal: true });
    return;
  }

  // GET ALL DATES OF THE REQUESTED WEEK
  const getDatesArray = (startingDate: Date) => {
    const array = [];
    for (let i = 0; i < 7; i++) {
      array.push(addDays(startingDate, i));
    }

    return array;
  };

  const datesArray = getDatesArray(reqStartDate);

  const resultsArray: {
    date: Date;
    six: {
      nutrition: number;
      sleep: number;
      sports: number;
      relaxation: number;
      projects: number;
      social_life: number;
    };
  }[] = [];

  await databaseConnect
    .aggregate([
      {
        $match: {
          _id: reqId,
        },
      },
      {
        $project: {
          _id: 0,
          data: "$log",
        },
      },
      {
        $unwind: {
          path: "$data",
        },
      },
      { $sort: { "data.date": 1 } },
      {
        $match: {
          $and: [
            {
              "data.date": {
                $gte: datesArray[0],
              },
            },
            {
              "data.date": {
                $lte: datesArray[6],
              },
            },
          ],
        },
      },
    ])
    .forEach(
      (doc: {
        data: {
          date: Date;
          six: {
            nutrition: number;
            sleep: number;
            sports: number;
            relaxation: number;
            projects: number;
            social_life: number;
          };
        };
      }) => {
        resultsArray.push(doc.data);
      }
    );

  for (let date of datesArray) {
    let found = false;
    for (let i = 0; i < resultsArray.length; i++) {
      if (isSameDay(date, resultsArray[i].date)) {
        found = true;
      }
    }

    if (!found) {
      resultsArray.push({
        date: date,
        six: {
          nutrition: 0,
          sleep: 0,
          sports: 0,
          relaxation: 0,
          projects: 0,
          social_life: 0,
        },
      });
    }
  }

  const sortArray = (a: { date: Date }, b: { date: Date }) => {
    return isAfter(a.date, b.date) ? 1 : -1;
  };

  resultsArray.sort(sortArray);

  const responseArray: {
    nutrition: {}[];
    sleep: {}[];
    sports: {}[];
    relaxation: {}[];
    projects: {}[];
    social_life: {}[];
  } = {
    nutrition: [],
    sleep: [],
    sports: [],
    relaxation: [],
    projects: [],
    social_life: [],
  };

  let task:
    | "nutrition"
    | "sleep"
    | "sports"
    | "relaxation"
    | "projects"
    | "social_life";

  for (task in responseArray) {
    for (let i = 0; i < resultsArray.length; i++) {
      for (let sixTask in resultsArray[i].six) {
        if (task === sixTask) {
          responseArray[task].push(resultsArray[i].six[task]);
        }
      }
    }
  }

  res
    .status(200)
    .json({ datesArray: datesArray, responseArray: responseArray });
};

exports.getWeeklyData = getWeeklyData;
