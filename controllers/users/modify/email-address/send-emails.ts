import { RequestHandler } from "express";

const database = require("../../../../utils/db-connect");
const sendEmail = require("../../../../utils/send-email");

const sendChangeEmailEmails: RequestHandler = async (req, res, next) => {
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
      "Email envoyé, veuillez vérifier la boite email-address de votre nouvelle adresse mail.",
  });
};

exports.sendChangeEmailEmails = sendChangeEmailEmails;
