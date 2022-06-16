import { RequestHandler } from "express";
import { ObjectId } from "mongodb";

import { User } from "../types/user";

const database = require("../utils/db-connect");

const checkUserExists: RequestHandler = async (req: any, res, next) => {
  const userIdStr = req.body.userId;

  const databaseConnect = await database.getDb().collection("users");

  const reqUserId = new ObjectId(userIdStr);

  // CHECKS IF THE USER EXISTS
  const user: User = await databaseConnect.findOne({ _id: reqUserId });

  if (!user) {
    res.status(401).json({ inexistantUser: true });
    return;
  }

  req.body.userData = user;
  next();
};

module.exports = checkUserExists;
