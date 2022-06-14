import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { addMinutes } from "date-fns";

const { v5: uuidv5 } = require("uuid");
const jwt = require("jsonwebtoken");

const database = require("../../../utils/db-connect");
const {
  sendEmailConfirmationEmail,
} = require("../../../utils/send-email-address-confirmation-email");
const { sendEmail } = require("../../../utils/send-email");

const signUp: RequestHandler = async (req, res, next) => {
  const {
    name: reqName,
    email: reqEmail,
    password: reqPassword,
    passwordConfirmation: reqPasswordConfirmation,
  } = await req.body;

  const databaseConnect = await database.getDb().collection("users");

  const validInputs = {
    all: false,
    name: false,
    email: {
      format: false,
      isAvailable: false,
    },
    password: false,
    passwordConfirmation: false,
  };

  // VALIDATION
  if (
    reqName.trim().length >= 2 &&
    reqName.trim().length <= 20 &&
    reqName.trim().match(/^['’\p{L}\p{M}]*-?['’\p{L}\p{M}]*$/giu)
  ) {
    validInputs.name = true;
  }

  if (
    reqEmail.match(
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
  ) {
    validInputs.email.format = true;
  }

  // // CHECKS IF THE USER EXISTS
  const user = await databaseConnect.findOne({ email: reqEmail });

  if (!user) {
    validInputs.email.isAvailable = true;
  }

  if (
    reqPassword.match(
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/
    )
  ) {
    validInputs.password = true;
  }

  if (reqPassword === reqPasswordConfirmation) {
    validInputs.passwordConfirmation = true;
  }

  if (
    validInputs.name &&
    validInputs.email.format &&
    validInputs.email.isAvailable &&
    validInputs.password &&
    validInputs.passwordConfirmation
  ) {
    validInputs.all = true;
  }

  if (!validInputs.all) {
    res.status(400).json({
      validInputs,
    });
    return;
  }

  // HASHES THE PASSWORD
  const hashedPassword = await bcrypt.hash(reqPassword, 10);
  const hashedConfirmationCode = uuidv5(reqEmail, process.env.UUID_NAMESPACE);

  // CREATES THE USER'S OBJECT
  const newUser = {
    icon: 0,
    name: reqName,
    email: reqEmail,
    password: hashedPassword,
    forgotPassword: {
      code: null,
      nextEmail: null,
    },
    confirmation: {
      confirmed: false,
      code: hashedConfirmationCode,
      nextEmail: addMinutes(new Date(), 5),
    },
    goals: {
      nutrition: null,
      sleep: null,
      relaxation: null,
      projects: null,
      sports: null,
      social_life: null,
    },
    deleteCode: null,
    log: [],
  };

  // INSERTS THE NEW USER IS THE DATABASE
  await databaseConnect.insertOne(newUser);

  // GETS THE ID
  let findingNewUser = await databaseConnect.findOne({ email: reqEmail });

  if (!findingNewUser) {
    res.status(404).json({
      message: "Erreur, veuillez réessayer plus tard.",
    });
    return;
  }

  // CREATES THE TOKEN
  let token = await jwt.sign(
    { id: findingNewUser._id, email: findingNewUser.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  // SEND AN EMAIL CONFIRMATION EMAIL
  sendEmailConfirmationEmail({
    to: reqEmail,
    uniqueCode: hashedConfirmationCode,
  });

  sendEmail({
    to: "info@six-app.com",
    subject: "Nouveau utilisateur !",
    text: "",
    html: `${reqEmail} | ${reqName} vient de créer un compte.`,
  });

  res.status(201).json({
    // success: true,
    // message: "Compte créé.",
    token: token,
    // id: findingNewUser._id,
    icon: findingNewUser.icon,
    name: findingNewUser.name,
    email: findingNewUser.email,
    confirmedEmail: findingNewUser.confirmation.confirmed,
  });
};

exports.signUp = signUp;
