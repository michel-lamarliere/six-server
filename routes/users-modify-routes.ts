import { Router } from "express";

const checkAuth = require("../middleware/check-auth");
const checkUserExists = require("../middleware/check-user-exists");
const confirmEmailAddressController = require("../controllers/users/confirm-email-address");
const resendEmailAddressConfirmationController = require("../controllers/users/confirm-email-address/resend-email");
const sendForgotPasswordEmailController = require("../controllers/users/modify/password/forgot-password/send-email");
const checkForgotPasswordAuthController = require("../controllers/users/modify/password/forgot-password/check-auth");
const changeForgottenPasswordController = require("../controllers/users/modify/password/forgot-password");
const changeEmailController = require("../controllers/users/modify/email-address");
const sendChangeEmailEmailsController = require("../controllers/users/modify/email-address/send-emails");
const changePasswordController = require("../controllers/users/modify/password");
const changeNameController = require("../controllers/users/modify/name");
const changeIconController = require("../controllers/users/modify/icon");

const router = Router();

router.patch(
  "/email-confirmation/confirm",
  confirmEmailAddressController.confirmEmailAddress
);

router.get(
  "/password/forgot/send-email/:email",
  sendForgotPasswordEmailController.sendForgotPasswordEmail
);

router.get(
  "/password/forgot/confirmation/:email/:uniqueId",
  checkForgotPasswordAuthController.checkForgotPasswordAuth
);

router.patch(
  "/password/forgot",
  changeForgottenPasswordController.changeForgottenPassword
);

router.patch("/email", changeEmailController.changeEmailAddressConfirmation);

router.patch("/password", changePasswordController.changePassword);

router.post(
  "/email-confirmation/send-email",
  resendEmailAddressConfirmationController.resendEmailAddressConfirmationEmail
);

router.patch(
  "/name",
  checkAuth,
  checkUserExists,
  changeNameController.changeName
);

router.patch(
  "/icon",
  checkAuth,
  checkUserExists,
  changeIconController.changeIcon
);

router.patch(
  "/email/send-emails",
  checkAuth,
  checkUserExists,
  sendChangeEmailEmailsController.sendChangeEmailAddressEmails
);

module.exports = router;
