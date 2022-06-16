import { RequestHandler } from "express";

const database = require("../../../../utils/db-connect");
const sendEmail = require("../../../../utils/send-email");

const sendChangeEmailAddressEmails: RequestHandler = async (req, res, next) => {
  const { newEmailAddress: reqNewEmailAddress } = req.body;
  const { emailAddress: reqOldEmailAddress } = req.body.userData;

  const databaseConnect = await database.getDb().collection("users");

  // CHECKS IF THE USER EXISTS
  const user = await databaseConnect.findOne({
    "emailAddress.value": reqOldEmailAddress,
  });

  const existingUserWithNewEmailAddress = await databaseConnect.findOne({
    "emailAddress.value": reqNewEmailAddress,
  });

  if (existingUserWithNewEmailAddress) {
    res.status(400).json({
      used: true,
      message: "Email adresse déjà utilisée.",
    });
  }

  const oldEmailAddressEmailWasSent = await sendEmail({
    to: reqOldEmailAddress,
    subject: "Changement d'adresse mail.",
    html: `<div>Une demande a été faite pour changer d'adresse mail. Un mail a également été envoyé sur l'ancienne ${reqOldEmailAddress}. Cliquez <a href=${process.env.FRONT_END_URL}/modifier-email/confirmation/${reqOldEmailAddress}/${reqNewEmailAddress} >ici</a> pour confirmer le changement. </div>`,
  });

  const newEmailAddressEmailWasSent = await sendEmail({
    to: reqNewEmailAddress,
    subject: "Changement d'adresse mail.",
    html: `<div>Une demande a été faite pour changer d'adresse mail et remplacer celle-ci par ${reqNewEmailAddress}. Veuillez nous contacter si vous n'êtes pas à l'origine de cette demande.</div>`,
  });

  if (!oldEmailAddressEmailWasSent || !newEmailAddressEmailWasSent) {
    res.status(400).json({
      message: "Une erreur est survenue lors de l'envoi des mail",
    });
    return;
  }

  res.status(200).json({
    message:
      "Email envoyé, veuillez vérifier la boite email-address de votre nouvelle adresse mail.",
  });
};

exports.sendChangeEmailAddressEmails = sendChangeEmailAddressEmails;
