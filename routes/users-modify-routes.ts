import { Router } from "express";

const checkAuth = require("../middleware/check-auth");
const confirmEmailAddressController = require("../controllers/users/confirm-email-address");
const resendEmailAddressConfirmationController = require("../controllers/users/confirm-email-address/resend-email");
const sendEmailForgotPasswordController = require("../controllers/users/modify/password/forgot-password/send-email");
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
  sendEmailForgotPasswordController.sendEmailForgotPassword
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

router.use(checkAuth);

router.post(
  "/email-confirmation/send-email",
  resendEmailAddressConfirmationController.resendEmailConfirmationEmail
);

router.patch("/name", changeNameController.changeName);

router.patch("/image", changeIconController.changeIcon);

router.patch(
  "/email/send-emails",
  sendChangeEmailEmailsController.sendChangeEmailEmails
);

module.exports = router;
