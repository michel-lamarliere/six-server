import { RequestHandler } from "express";

const { ObjectId } = require("mongodb");
const { addMinutes, isBefore } = require("date-fns");

const database = require("../../../utils/db-connect");
const sendEmailConfirmationEmail = require("../../../utils/send-email-address-confirmation-email");

const resendEmailConfirmationEmail: RequestHandler = async (req, res, next) => {
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

exports.resendEmailConfirmationEmail = resendEmailConfirmationEmail;
