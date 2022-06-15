import { RequestHandler } from "express";

const database = require("../../utils/db-connect");
const sendEmail = require("../../utils/send-email");

const sendMessageLoggedIn: RequestHandler = async (req, res, next) => {
  const { message: reqMessage } = req.body;
  const { email: reqEmail, name: reqName } = req.body.userData;

  if (reqMessage.trim().length < 10) {
    res.status(404).json({ error: true, message: "10 caractères minimum." });
    return;
  }

  const confirmationEmail = await sendEmail({
    to: reqEmail,
    subject: "Prise de contact",
    text: `Merci ${reqName} pour votre message envoyé, nous ferons notre maximum afin de répondre à votre message rapidement.`,
  });

  const emailToUs = await sendEmail({
    to: process.env.NODEMAILER_EMAIL,
    subject: `Message via le site de ${reqName}: ${reqEmail}`,
    text: `${reqMessage}`,
  });

  if (!confirmationEmail || !emailToUs) {
    res.status(400).json({
      error: true,
      message: `Erreur lors de l'envoi des mails`,
    });
    return;
  }

  res.status(200).json({ success: true, message: "Email envoyés." });
};

exports.sendMessageLoggedIn = sendMessageLoggedIn;
