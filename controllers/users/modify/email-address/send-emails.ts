import { RequestHandler } from "express";
import { addMinutes, isBefore } from "date-fns";

const database = require("../../../../utils/db-connect");
const sendEmail = require("../../../../utils/send-email");

const sendChangeEmailAddressEmails: RequestHandler = async (req, res, next) => {
  const { newEmailAddress: reqNewEmailAddress } = req.body;
  const { value: reqOldEmailAddress, timeBeforeNextConfirmationEmail } =
    req.body.userData.emailAddress;

  // if (isBefore(new Date(), timeBeforeNextConfirmationEmail)) {
  //   res.status(400).json({
  //     waitFiveMinutes: true,
  //   });

  //   return;
  // }

  const databaseConnect = await database.getDb().collection("users");

  const existingUserWithNewEmailAddress = await databaseConnect.findOne({
    "emailAddress.value": reqNewEmailAddress,
  });

  if (existingUserWithNewEmailAddress) {
    res.status(400).json({
      used: true,
    });

    return;
  }

  const oldEmailAddressEmailWasSent = sendEmail({
    to: reqNewEmailAddress,
    subject: "Changement d'adresse mail.",
    html: `<div>Une demande a été faite pour changer d'adresse mail. Un mail a également été envoyé sur l'ancienne ${reqOldEmailAddress}. Cliquez <a href=${process.env.FRONT_END_URL}/modifier-email/confirmation/${reqOldEmailAddress}/${reqNewEmailAddress} >ici</a> pour confirmer le changement. </div>`,
  });

  const newEmailAddressEmailWasSent = sendEmail({
    to: reqOldEmailAddress,
    subject: "Changement d'adresse mail.",
    html: `<div>Une demande a été faite pour changer d'adresse mail et remplacer celle-ci par ${reqNewEmailAddress}. Veuillez nous contacter si vous n'êtes pas à l'origine de cette demande.</div>`,
  });

  await databaseConnect.updateOne(
    {
      "emailAddress.value": reqOldEmailAddress,
    },
    {
      $set: {
        "emailAddress.timeBeforeNextConfirmationEmail": addMinutes(
          new Date(),
          5
        ),
      },
    }
  );

  // if (!oldEmailAddressEmailWasSent || !newEmailAddressEmailWasSent) {
  //   res.status(400).json({
  //     message: "Une erreur est survenue lors de l'envoi des mail",
  //   });
  //   return;
  // }

  res.status(200).json({
    message:
      "The emails will arrive shortly if the provided email addresses are correct.",
  });
};

exports.sendChangeEmailAddressEmails = sendChangeEmailAddressEmails;
