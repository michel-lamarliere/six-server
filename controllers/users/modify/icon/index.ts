import { RequestHandler } from "express";

const { ObjectId } = require("mongodb");

const database = require("../../../../utils/db-connect");

const changeIcon: RequestHandler = async (req, res, next) => {
  const { id: reqIdStr, icon: reqIcon } = req.body;
  const reqId = new ObjectId(reqIdStr);

  const databaseConnect = await database.getDb().collection("users");

  // CHECKS IF THE USER EXISTS
  const user = await databaseConnect.findOne({ _id: reqId });

  if (!user) {
    res.status(404).json({ fatal: true });
    return;
  }

  await databaseConnect.updateOne(
    { _id: reqId },
    {
      $set: {
        icon: parseInt(reqIcon),
      },
    }
  );

  res.status(200).json({ success: true, message: "Icône modifiée." });
};

exports.changeIcon = changeIcon;
