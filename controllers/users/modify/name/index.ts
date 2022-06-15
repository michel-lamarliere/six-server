import { RequestHandler } from "express";

const { ObjectId } = require("mongodb");

const database = require("../../../../utils/db-connect");

const changeName: RequestHandler = async (req, res, next) => {
  const { newName: reqNewName } = req.body;
  const reqId = new ObjectId(req.body.userId);
  const user = req.body.userData;

  const databaseConnect = await database.getDb().collection("users");

  let validateNewName = false;

  if (reqNewName === user.name) {
    res.status(400).json({
      sameNames: true,
    });
    return;
  }

  // CHECKS IF THE NAME IS VALID
  if (
    reqNewName.trim().length >= 2 &&
    reqNewName.trim().match(/^['’\p{L}\p{M}]*-?['’\p{L}\p{M}]*$/giu)
  ) {
    validateNewName = true;
  }

  if (!validateNewName) {
    res.status(400).json({
      incorrectFormat: true,
    });
    return;
  }

  // UPDATES THE NAME
  await databaseConnect.updateOne(
    { _id: reqId },
    {
      $set: {
        name: reqNewName,
      },
    }
  );

  res.status(200).json({ newName: reqNewName });
};

exports.changeName = changeName;
