import { RequestHandler } from "express";

const { ObjectId } = require("mongodb");

const database = require("../../utils/db-connect");

const getDaily: RequestHandler = async (req, res, next) => {
  const reqId = new ObjectId(req.params.id);
  const reqDate: Date = new Date(req.params.date);

  const databaseConnect = await database.getDb().collection("users");

  // CHECKS IF THE USER EXISTS
  const user = await databaseConnect.findOne({ _id: reqId });

  if (!user) {
    return res.status(404).json({ fatal: true });
  }

  const result = await databaseConnect
    .aggregate([
      {
        $match: {
          _id: reqId,
        },
      },
      {
        $project: { _id: 0, data: "$log" },
      },
      {
        $unwind: {
          path: "$data",
        },
      },
      {
        $match: {
          "data.date": reqDate,
        },
      },
    ])
    .toArray();

  if (result.length === 0) {
    return res.status(200).json({
      nutrition: 0,
      sleep: 0,
      sports: 0,
      relaxation: 0,
      projects: 0,
      social_life: 0,
    });
  }

  return res.status(200).json(result[0].data.six);
};

exports.getDaily = getDaily;
