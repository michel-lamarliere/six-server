import { RequestHandler } from "express";
import { ObjectId } from "mongodb";

const database = require("../utils/db-connect");

const checkUserExists: RequestHandler = async (req: any, res, next) => {
  const userIdStr = req.body.userId;

  console.log(userIdStr);

  const databaseConnect = await database.getDb().collection("users");

  const reqUserId = new ObjectId(userIdStr);

  // CHECKS IF THE USER EXISTS
  const user = await databaseConnect.findOne({ _id: reqUserId });

  if (!user) {
    res.status(401).json({ inexistantUser: true });
    return;
  }

  req.body.userData = user;
  next();
};

module.exports = checkUserExists;
