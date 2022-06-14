import { Router } from "express";

const checkAuth = require("../middleware/check-auth");
const usersModifyControllers = require("../controllers/users-modify-controllers");

const router = Router();

router.patch(
  "/email-confirmation/confirm",
  usersModifyControllers.confirmEmailAddress
);

router.get(
  "/password/forgot/send-email/:email",
  usersModifyControllers.sendEmailForgotPassword
);

router.get(
  "/password/forgot/confirmation/:email/:uniqueId",
  usersModifyControllers.checkForgotPasswordAuth
);

router.patch(
  "/password/forgot",
  usersModifyControllers.changeForgottenPassword
);

router.patch(
  "/email/confirmation",
  usersModifyControllers.changeEmailConfirmation
);

router.patch("/password", usersModifyControllers.changePassword);

router.use(checkAuth);

router.post(
  "/email-confirmation/send-email",
  usersModifyControllers.resendEmailConfirmation
);

router.patch("/name", usersModifyControllers.changeName);

router.patch("/image", usersModifyControllers.changeImage);

router.patch("/email", usersModifyControllers.changeEmail);

module.exports = router;
