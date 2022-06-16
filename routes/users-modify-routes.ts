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

// router.patch(
//   "/email-address-confirmation/confirm",
//   confirmEmailAddressController.confirmEmailAddress
// );

// router.get(
//   "/password/forgot/send-email/:email",
//   sendForgotPasswordEmailController.sendForgotPasswordEmail
// );

// router.get(
//   "/password/forgot/confirmation/:email/:uniqueId",
//   checkForgotPasswordAuthController.checkForgotPasswordAuth
// );

// router.patch(
//   "/password/forgot",
//   changeForgottenPasswordController.changeForgottenPassword
// );

// router.patch(
//   "/emailAddress",
//   changeEmailController.changeEmailAddressConfirmation
// );

// router.post(
//   "/email-address-confirmation/send-email",
//   resendEmailAddressConfirmationController.resendEmailAddressConfirmationEmail
// );

router.use(checkAuth);
router.use(checkUserExists);

router.patch("/name", changeNameController.changeName);

router.patch("/icon", changeIconController.changeIcon);

router.patch(
  "/email-address/send-emails",
  sendChangeEmailEmailsController.sendChangeEmailAddressEmails
);

router.patch("/password", changePasswordController.changePassword);

module.exports = router;
