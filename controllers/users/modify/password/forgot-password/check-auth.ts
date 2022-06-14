import { RequestHandler } from "express";

const database = require("../../../../../utils/db-connect");

const checkForgotPasswordAuth: RequestHandler = async (req, res, next) => {
  const reqEmail = req.params.email;
  const reqUniqueId = req.params.uniqueId;

  const databaseConnect = await database.getDb().collection("users");

  // CHECKS IF THE USER EXISTS AND
  // IF THE UNIQUE ID MATCHES THE USER'S ONE FROM THE DB
  const user = await databaseConnect.findOne({
    email: reqEmail,
    "forgotPassword.code": reqUniqueId,
  });

  if (!user) {
    res.status(403).json({ error: true, message: "Non autorisé." });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Autorisé.",
    id: user._id,
    name: user.name,
  });
};

exports.checkForgotPasswordAuth = checkForgotPasswordAuth;
