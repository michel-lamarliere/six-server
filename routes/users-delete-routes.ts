import { Router } from "express";

const checkAuth = require("../middleware/check-auth");
const deleteAccountController = require("../controllers/users/delete");
const sendDeleteAccountConfirmationEmailController = require("../controllers/users/delete/send-confirmation-email");

const router = Router();

router.delete("/account", deleteAccountController.deleteAccount);

router.use(checkAuth);

router.patch(
  "/account/send-confirmation-email",
  sendDeleteAccountConfirmationEmailController.sendDeleteAccountConfirmationEmail
);

module.exports = router;
