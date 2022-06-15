import { RequestHandler } from "express";

const { ObjectId } = require("mongodb");

const database = require("../../../../utils/db-connect");

const changeIcon: RequestHandler = async (req, res, next) => {
  const { newIcon: reqNewIcon } = req.body;
  const reqUserId = new ObjectId(req.body.userId);

  if (reqNewIcon < 0 || reqNewIcon > 11) {
    res
      .status(400)
      .json({ message: "Icon number lower than 0 or bigger than 11." });

    return;
  }

  const databaseConnect = await database.getDb().collection("users");

  await databaseConnect.updateOne(
    { _id: reqUserId },
    {
      $set: {
        icon: parseInt(reqNewIcon),
      },
    }
  );

  res.status(200).json({
    message: "Icon was changed.",
  });
};

exports.changeIcon = changeIcon;
