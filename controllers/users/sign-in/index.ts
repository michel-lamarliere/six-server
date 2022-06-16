import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { User } from "../../../types/user";

const jwt = require("jsonwebtoken");

const database = require("../../../utils/db-connect");

import { UserResponseData } from "../../../types/user-reponse-data";
import { TokenData } from "../../../types/token-data";

const signIn: RequestHandler = async (req, res, next) => {
  const { emailAddress: reqEmailAddress, password: reqPassword } = req.body;

  const databaseConnect = await database.getDb().collection("users");

  const user: User & { _id: string } = await databaseConnect.findOne({
    "emailAddress.value": reqEmailAddress,
  });

  let validInputs = {
    emailAddress: false,
    password: false,
  };

  if (!user) {
    res.status(400).json({ validInputs });
    return;
  }

  validInputs.emailAddress = true;

  // CHECKS IF THE PASSWORD MATCHES THE USER'S HASHED PASSWORD
  const matchingPasswords = await bcrypt.compare(
    reqPassword,
    user.password.value
  );

  // IF THE PASSWORDS DON'T MATCH
  if (matchingPasswords) {
    validInputs.password = true;
  }

  if (!validInputs.emailAddress || !validInputs.password) {
    res.status(400).json({ validInputs });
    return;
  }

  // CREATES THE TOKEN

  const tokenData: TokenData = {
    userId: user._id,
    emailAddress: user.emailAddress.value,
  };

  const token = await jwt.sign(
    tokenData,
    process.env.JWT_SECRET
    /*{ expiresIn: "1h" }*/
  );

  const userResponseData: UserResponseData = {
    token: token,
    icon: user.icon,
    name: user.name,
    emailAddress: {
      value: user.emailAddress.value,
      confirmed: user.emailAddress.confirmed,
    },
  };

  res.status(200).json(userResponseData);
};

exports.signIn = signIn;
