import { RequestHandler } from "express";
import bcrypt from "bcrypt";

const jwt = require("jsonwebtoken");

const database = require("../../../utils/db-connect");

const signIn: RequestHandler = async (req, res, next) => {
  const { emailAddress: reqEmailAddress, password: reqPassword } = req.body;

  const databaseConnect = await database.getDb().collection("users");

  const user = await databaseConnect.findOne({ email: reqEmailAddress });

  let validInputs = {
    emailAddress: false,
    password: false,
  };

  if (!user) {
    res.status(400).json({ validInputs });
    return;
  } else {
    validInputs.emailAddress = true;
  }

  // CHECKS IF THE PASSWORD MATCHES THE USER'S HASHED PASSWORD
  const matchingPasswords = await bcrypt.compare(reqPassword, user.password);

  // IF THE PASSWORDS DON'T MATCH
  if (matchingPasswords) {
    validInputs.password = true;
  }

  if (!validInputs.emailAddress || !validInputs.password) {
    res.status(400).json({ validInputs });
    return;
  }

  // CREATES A TOKEN
  const token = await jwt.sign(
    { userId: user._id, email: user.emailAddress },
    process.env.JWT_SECRET
    /*{ expiresIn: "1h" }*/
  );

  res.status(200).json({
    token,
    // id: user._id,
    icon: user.icon,
    name: user.name,
    emailAddress: user.emailAddress,
    confirmedEmail: user.confirmation.confirmed,
  });
};

exports.signIn = signIn;
