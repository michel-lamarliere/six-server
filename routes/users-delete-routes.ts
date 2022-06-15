import { Router } from "express";

const checkAuth = require("../middleware/check-auth");
const checkUserExists = require("../middleware/check-user-exists");
const deleteAccountController = require("../controllers/users/delete");
const sendDeleteAccountConfirmationEmailController = require("../controllers/users/delete/send-confirmation-email");

const router = Router();

router.delete("/account", deleteAccountController.deleteUserAccount);

/*router.use(checkAuth);*/

router.patch(
  "/account/send-confirmation-email",
  checkAuth,
  checkUserExists,
  sendDeleteAccountConfirmationEmailController.sendDeleteAccountConfirmationEmail
);

module.exports = router;
