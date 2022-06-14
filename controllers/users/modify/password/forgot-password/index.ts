import { RequestHandler } from "express";

const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");

const database = require("../../../../../utils/db-connect");

const changeForgottenPassword: RequestHandler = async (req, res, next) => {
  const {
    id: reqIdStr,
    newPassword: reqNewPassword,
    newPasswordConfirmation: reqNewPasswordConfirmation,
  } = req.body;

  const reqId = new ObjectId(reqIdStr);

  const databaseConnect = await database.getDb().collection("users");

  // CHECKS IF THE USER EXISTS
  const user = await databaseConnect.findOne({ _id: reqId });

  if (!user) {
    res.status(404).json({ fatal: true });
    return;
  }

  let validInputs = {
    newPassword: false,
    newPasswordConfirmation: false,
  };

  const newPasswordIsValid = reqNewPassword.match(
    /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/
  );

  if (newPasswordIsValid) {
    validInputs.newPassword = true;
  }

  validInputs.newPasswordConfirmation =
    reqNewPassword === reqNewPasswordConfirmation;

  if (!validInputs.newPassword || !validInputs.newPasswordConfirmation) {
    res
      .status(400)
      .json({ error: true, message: "Champs invalides.", validInputs });
    return;
  }

  const hashedNewPassword = await bcrypt.hash(reqNewPassword, 10);

  await databaseConnect.updateOne(
    { _id: reqId },
    { $set: { password: hashedNewPassword, "forgotPassword.code": null } }
  );

  res.status(200).json({ success: true, message: "Mot de passe modifié." });
};

exports.changeForgottenPassword = changeForgottenPassword;
