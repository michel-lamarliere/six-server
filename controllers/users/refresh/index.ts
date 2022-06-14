import { RequestHandler } from "express";
import { ObjectId } from "mongodb";

const database = require("../../../utils/db-connect");

const refreshData: RequestHandler = async (req, res, next) => {
  const id = new ObjectId(req.params.userId);

  const databaseConnect = await database.getDb().collection("users");

  // CHECKS IF THE USER EXISTS
  const user = await databaseConnect.findOne({ _id: id });

  if (!user) {
    res.status(404).json({ fatal: true });
    return;
  }

  res
    .status(200)
    .json({ success: true, message: "Données rafraichies.", user });
};

exports.refreshData = refreshData;
