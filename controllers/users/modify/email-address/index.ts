import { RequestHandler } from "express";

const database = require("../../../../utils/db-connect");

const changeEmailAddressConfirmation: RequestHandler = async (
  req,
  res,
  next
) => {
  const { oldEmail: reqOldEmail, newEmail: reqNewEmail } = req.body;

  const databaseConnect = await database.getDb().collection("users");

  // CHECKS IF THE USER EXISTS
  const user = await databaseConnect.findOne({ email: reqOldEmail });

  const newEmailExists = await databaseConnect.findOne({ email: reqNewEmail });

  if (newEmailExists) {
    res.status(400).json({
      error: true,
      message: "Un compte avec votre nouvelle adresse email existe déjà.",
    });
    return;
  }

  await databaseConnect.updateOne(
    { email: reqOldEmail },
    { $set: { email: reqNewEmail } }
  );

  res.status(200).json({
    success: true,
    message:
      "Adresse mail modifiée, veuillez vous connecter avec votre nouvelle adresse email.",
  });
};

exports.changeEmailAddressConfirmation = changeEmailAddressConfirmation;
