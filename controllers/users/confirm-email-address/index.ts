import { RequestHandler } from "express";

const database = require("../../../utils/db-connect");

const confirmEmailAddress: RequestHandler = async (req, res, next) => {
  const email = req.body.email;
  const code = req.body.code;

  const databaseConnect = await database.getDb().collection("users");

  // CHECKS IF THE USER EXISTS AND IF THE CODE MATCHES THE DB'S CODE
  const user = await databaseConnect.findOne({
    email: email,
    "confirmation.code": code,
  });

  // IF IT DOESN'T MATCH
  if (!user) {
    res.status(400).json({ error: true, message: "Code invalide" });
    return;
  }

  // CONFIRMS THE ACCOUNT
  await databaseConnect.updateOne(
    { email: email },
    {
      $set: {
        "confirmation.confirmed": true,
      },
    }
  );

  res.status(200).json({ success: true, message: "Compte confirmé." });
};

exports.confirmEmailAddress = confirmEmailAddress;
