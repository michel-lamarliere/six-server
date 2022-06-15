import { RequestHandler } from "express";

const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");

const database = require("../../../../utils/db-connect");

const changePassword: RequestHandler = async (req, res, next) => {
  const {
    id: reqIdStr,
    oldPassword: reqOldPassword,
    newPassword: reqNewPassword,
    newPasswordConfirmation: reqNewPasswordConfirmation,
  } = req.body;

  const reqId = new ObjectId(reqIdStr);

  const databaseConnect = await database.getDb().collection("users");

  // CHECKS IF THE USER EXISTS
  const user = await databaseConnect.findOne({ _id: reqId });

  let validInputs = {
    oldPassword: false,
    newPassword: {
      differentThanOld: false,
      format: false,
    },
    newPasswordConfirmation: false,
  };

  // CHECKS IF THE PASSWORD MATCHES THE USER'S HASHED PASSWORD
  validInputs.oldPassword = await bcrypt.compare(reqOldPassword, user.password);

  if (!validInputs.oldPassword) {
    res.status(400).json({
      error: true,
      message: "Veuillez corriger les erreurs.",
      validInputs: {
        oldPassword: false,
        newPassword: {
          differentThanOld: true,
          format: true,
        },
        newPasswordConfirmation: true,
      },
    });

    return;
  }

  // COMPARES THE NEW PASSWORD TO THE OLD ONE
  const newPasswordIsSameAsOld = await bcrypt.compare(
    reqNewPassword,
    user.password
  );
  validInputs.newPassword.differentThanOld = !newPasswordIsSameAsOld;

  // CHECKS IF THE PASSWORD IS IN THE CORRECT FORMAT
  validInputs.newPassword.format = reqNewPassword.match(
    /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/
  );

  // CHECKS IF THE NEW PASSWORDS ARE IDENTICAL
  validInputs.newPasswordConfirmation =
    reqNewPassword === reqNewPasswordConfirmation;

  if (
    !validInputs.oldPassword ||
    !validInputs.newPassword.differentThanOld ||
    !validInputs.newPassword.format ||
    !validInputs.newPasswordConfirmation
  ) {
    res.status(400).json({
      error: true,
      message: "Veuillez corriger les erreurs.",
      validInputs,
    });
    return;
  }

  // CREATES A NEW HASHED PASSWORD
  const hashedNewPassword = await bcrypt.hash(reqNewPassword, 10);

  // UPDATES THE USER'S PASSWORD
  await databaseConnect.updateOne(
    { _id: reqId },
    {
      $set: {
        password: hashedNewPassword,
        "forgotPassword.code": null,
      },
    }
  );

  res.status(200).json({ success: true, message: "Mot de passe modifié." });
};

exports.changePassword = changePassword;
