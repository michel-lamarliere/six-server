import { RequestHandler } from "express";

const { ObjectId } = require("mongodb");

const database = require("../../../../utils/db-connect");

const changeName: RequestHandler = async (req, res, next) => {
  const { newName: reqNewName } = req.body;
  const reqId = new ObjectId(req.body.userId);

  const databaseConnect = await database.getDb().collection("users");

  // CHECKS IF THE USER EXISTS
  const user = await databaseConnect.findOne({ _id: reqId });

  if (!user) {
    res.status(404).json({ fatal: true });
    return;
  }

  let validateNewName = false;

  if (reqNewName === user.name) {
    res.status(400).json({
      error: true,
      details: { sameName: true },
    });
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
      error: true,
      details: { format: true },
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

  res.status(200).json({ name: reqNewName });
};

exports.changeName = changeName;
