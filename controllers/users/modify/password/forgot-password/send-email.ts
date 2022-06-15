import { RequestHandler } from "express";

const { addMinutes, isBefore } = require("date-fns");
const crypto = require("crypto");

const database = require("../../../../../utils/db-connect");
const sendEmail = require("../../../../../utils/send-email");

const sendForgotPasswordEmail: RequestHandler = async (req, res, next) => {
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

exports.sendForgotPasswordEmail = sendForgotPasswordEmail;
