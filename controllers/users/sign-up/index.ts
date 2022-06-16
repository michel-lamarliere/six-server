import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { addMinutes } from "date-fns";

const { v5: uuidv5 } = require("uuid");
const jwt = require("jsonwebtoken");

const database = require("../../../utils/db-connect");
const sendEmailAddressConfirmationEmail = require("../../../utils/send-email-address-confirmation-email");
const sendEmail = require("../../../utils/send-email");

import { UserResponseData } from "../../../types/user-reponse-data";
import { User } from "../../../types/user";
import { TokenData } from "../../../types/token-data";

const signUp: RequestHandler = async (req, res, next) => {
  const {
    name: reqName,
    emailAddress: reqEmailAddress,
    password: reqPassword,
    passwordConfirmation: reqPasswordConfirmation,
  } = await req.body;

  const databaseConnect = await database.getDb().collection("users");

  const validInputs = {
    all: false,
    name: false,
    emailAddress: {
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
    reqEmailAddress.match(
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
  ) {
    validInputs.emailAddress.format = true;
  }

  // // CHECKS IF THE USER EXISTS
  const user: User = await databaseConnect.findOne({
    emailAddress: reqEmailAddress,
  });

  if (!user) {
    validInputs.emailAddress.isAvailable = true;
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
    validInputs.emailAddress.format &&
    validInputs.emailAddress.isAvailable &&
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

  const hashedEmailAddressConfirmationUniqueCode = uuidv5(
    reqEmailAddress,
    process.env.UUID_NAMESPACE
  );

  // CREATES THE USER'S OBJECT
  const newUser: User = {
    icon: 0,
    name: reqName,
    emailAddress: {
      value: reqEmailAddress,
      confirmed: false,
      confirmationEmailUniqueCode: hashedEmailAddressConfirmationUniqueCode,
      timeBeforeNextConfirmationEmail: addMinutes(new Date(), 5),
    },
    password: {
      value: hashedPassword,
      forgotPasswordEmailUniqueCode: null,
      timeBeforeNextForgotPasswordEmail: null,
    },
    goals: {
      nutrition: null,
      sleep: null,
      relaxation: null,
      projects: null,
      sports: null,
      social_life: null,
    },
    deleteAccountUniqueCode: null,
    log: [],
  };

  // INSERTS THE NEW USER IS THE DATABASE
  await databaseConnect.insertOne(newUser);

  // GETS THE ID
  let findingNewUser = await databaseConnect.findOne({
    "emailAddress.value": reqEmailAddress,
  });

  if (!findingNewUser) {
    res.status(404).json({
      message: "User not found after insert it in the database.",
    });
    return;
  }

  // CREATES THE TOKEN

  const tokenData: TokenData = {
    userId: findingNewUser._id,
    emailAddress: findingNewUser.emailAddress.value,
  };

  const token = await jwt.sign(
    tokenData,
    process.env.JWT_SECRET
    /*{ expiresIn: "1h" }*/
  );

  // SEND AN EMAIL CONFIRMATION EMAIL
  sendEmailAddressConfirmationEmail({
    to: reqEmailAddress,
    uniqueCode: hashedEmailAddressConfirmationUniqueCode,
  });

  sendEmail({
    to: "info@six-app.com",
    subject: "Nouveau utilisateur !",
    text: "",
    html: `${reqEmailAddress} | ${reqName} vient de créer un compte.`,
  });

  const userResponseData: UserResponseData = {
    token: token,
    icon: findingNewUser.icon,
    name: findingNewUser.name,
    emailAddress: {
      value: findingNewUser.emailAddress.value,
      confirmed: findingNewUser.emailAddress.confirmed,
    },
  };

  res.status(201).json(userResponseData);
};

exports.signUp = signUp;
