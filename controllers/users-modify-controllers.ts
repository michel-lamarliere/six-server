import { RequestHandler } from "express";
const { ObjectId } = require("mongodb");
const { addMinutes, isBefore } = require("date-fns");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const database = require("../utils/db-connect");
const sendEmail = require("../utils/send-email");
const sendEmailConfirmationEmail = require("../utils/send-email-confirmation-email");

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

const resendEmailConfirmation: RequestHandler = async (req, res, next) => {
  const id = new ObjectId(req.body.id);

  const databaseConnect = await database.getDb().collection("users");

  // CHECKS IF THE USER EXISTS
  const user = await databaseConnect.findOne({ _id: id });

  if (!user) {
    res.status(404).json({ fatal: true });
    return;
  }

  // IF THE ACCOUNT IS ALREADY CONFIRMED
  if (user.confirmation.confirmed) {
    res.status(400).json({
      error: true,
      message: "Compte déjà confirmé, veuillez rafraichir vos données.",
    });
    return;
  }

  // CHECKS IF THE USER SENT AN EMAIL DURING THE LAST 5 MINUTES
  if (user.confirmation.nextEmail) {
    const fiveMinutesBetweenSends = !isBefore(
      user.confirmation.nextEmail,
      new Date()
    );

    // IF HE DID
    if (fiveMinutesBetweenSends) {
      res.status(405).json({
        error: true,
        message:
          "Veuillez attendre 5 minutes entre chaque demande d'envoi de mail de confirmation.",
      });
      return;
    }
  }

  const emailWasSent = await sendEmailConfirmationEmail({
    to: user.email,
    uniqueCode: user.confirmation.code,
  });

  if (!emailWasSent) {
    return res.status(500).json({
      error: true,
      message: "Une erreur est survenue lors de l'envoi du mail.",
    });
  }

  // ADDS THE NEW TIME INTERVAL IN THE DB
  const nextEmail = addMinutes(new Date(), 5);

  await databaseConnect.updateOne(
    { _id: id },
    {
      $set: {
        "confirmation.nextEmail": nextEmail,
      },
    }
  );

  res.status(200).json({
    success: true,
    message:
      "Email envoyé. Veuillez vérifier votre boîte de réception ou votre dossier spam.",
  });
};

const changeImage: RequestHandler = async (req, res, next) => {
  const { id: reqIdStr, icon: reqIcon } = req.body;
  const reqId = new ObjectId(reqIdStr);

  const databaseConnect = await database.getDb().collection("users");

  // CHECKS IF THE USER EXISTS
  const user = await databaseConnect.findOne({ _id: reqId });

  if (!user) {
    res.status(404).json({ fatal: true });
    return;
  }

  await databaseConnect.updateOne(
    { _id: reqId },
    {
      $set: {
        icon: parseInt(reqIcon),
      },
    }
  );

  res.status(200).json({ success: true, message: "Icône modifiée." });
};

const changeEmail: RequestHandler = async (req, res, next) => {
  const { oldEmail: reqOldEmail, newEmail: reqNewEmail } = req.body;

  const databaseConnect = await database.getDb().collection("users");

  // CHECKS IF THE USER EXISTS
  const user = await databaseConnect.findOne({ email: reqOldEmail });

  if (!user) {
    res.status(404).json({ fatal: true });
    return;
  }

  const existingUserWithNewEmail = await databaseConnect.findOne({
    email: reqNewEmail,
  });

  if (existingUserWithNewEmail) {
    res.json({
      used: true,
      error: true,
      message: "Email adresse déjà utilisée.",
    });
  }

  const oldEmailWasSent = await sendEmail({
    to: reqOldEmail,
    subject: "Changement d'adresse mail.",
    html: `<div>Une demande a été faite pour changer d'adresse mail. Un mail a également été envoyé sur l'ancienne ${reqOldEmail}. Cliquez <a href=${process.env.FRONT_END_URL}/modifier-email/confirmation/${reqOldEmail}/${reqNewEmail} >ici</a> pour confirmer le changement. </div>`,
  });

  const newEmailWasSent = await sendEmail({
    to: reqNewEmail,
    subject: "Changement d'adresse mail.",
    html: `<div>Une demande a été faite pour changer d'adresse mail et remplacer celle-ci par ${reqNewEmail}. Veuillez nous contacter si vous n'êtes pas à l'origine de cette demande.</div>`,
  });

  if (!oldEmailWasSent || !newEmailWasSent) {
    res.status(400).json({
      error: true,
      message: "Une erreur est survenue lors de l'envoi des mail",
    });
    return;
  }

  res.status(200).json({
    success: true,
    message:
      "Email envoyé, veuillez vérifier la boite email de votre nouvelle adresse mail.",
  });
};

const changeEmailConfirmation: RequestHandler = async (req, res, next) => {
  const { oldEmail: reqOldEmail, newEmail: reqNewEmail } = req.body;

  const databaseConnect = await database.getDb().collection("users");

  // CHECKS IF THE USER EXISTS
  const user = await databaseConnect.findOne({ email: reqOldEmail });

  if (!user) {
    res.status(404).json({ fatal: true });
    return;
  }

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

  res
    .status(200)
    .json({ name: reqNewName });
};

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

  if (!user) {
    res.status(404).json({ fatal: true });
    return;
  }

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

const sendEmailForgotPassword: RequestHandler = async (req, res, next) => {
  const reqEmail = req.params.email;

  const databaseConnect = await database.getDb().collection("users");

  // CHECKS IF THE USER EXISTS
  const user = await databaseConnect.findOne({ email: reqEmail });

  if (!user) {
    res.status(404).json({
      error: true,
      message: "Cette adresse mail introuvable, veuillez créer un compte.",
    });
    return;
  }

  // CHECKS IF THE USER CONFIRMED HIS ACCOUNT
  // if (!user.confirmation.confirmed) {
  // 	res.status(403).json({
  // 		error: "Cette adresse mail n'est pas confirmée. Envoi de mail impossible.",
  // 	});
  // 	return;
  // }

  // CHECKS IF THE LAST EMAIL WAS SENT IN THE LAST 5 MINUTES
  if (
    user.forgotPassword.nextEmail &&
    !isBefore(user.forgotPassword.nextEmail, new Date())
  ) {
    res.status(403).json({
      error: true,
      message: "Veuillez attendre 5 minutes entre chaque envoi de mail.",
    });
    return;
  }

  // GENERATES AN UNIQUE CODE
  const generatedForgotPasswordCode = crypto.randomBytes(20).toString("hex");

  const nextEmail = addMinutes(new Date(), 5);

  // ADDS THE NEW TIME INTERVAL IN THE DB
  await databaseConnect.updateOne(
    { email: reqEmail },
    {
      $set: {
        forgotPassword: {
          code: generatedForgotPasswordCode,
          nextEmail: nextEmail,
        },
      },
    }
  );

  const emailWasSent = await sendEmail({
    to: reqEmail,
    subject: "Modification de votre mot de passe",
    html: `<div><b>Mot de passe oublié?</b><a href="${
      process.env.FRONT_END_URL
    }/modifier/mot-de-passe/${encodeURI(reqEmail)}/${encodeURI(
      generatedForgotPasswordCode
    )}">Cliquez ici !</a></div>`,
  });

  if (!emailWasSent) {
    res.status(403).json({
      error: true,
      message: "Erreur lors de l'envoi de mail. Veuillez réessayer plus tard.",
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Email envoyé, veuillez consulter votre boite de réception.",
  });
};

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

exports.confirmEmailAddress = confirmEmailAddress;
exports.resendEmailConfirmation = resendEmailConfirmation;
exports.changeImage = changeImage;
exports.changeName = changeName;
exports.changeEmail = changeEmail;
exports.changeEmailConfirmation = changeEmailConfirmation;
exports.changePassword = changePassword;
exports.sendEmailForgotPassword = sendEmailForgotPassword;
exports.checkForgotPasswordAuth = checkForgotPasswordAuth;
exports.changeForgottenPassword = changeForgottenPassword;
