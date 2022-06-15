import { RequestHandler } from "express";
import { ObjectId } from "mongodb";

const database = require("../../../utils/db-connect");

const refreshUserData: RequestHandler = async (req, res, next) => {
  const id = new ObjectId(req.params.userId);
  const user = req.body.userData;

  res
    .status(200)
    .json({ success: true, message: "Données rafraichies.", user });
};

exports.refreshUserData = refreshUserData;
