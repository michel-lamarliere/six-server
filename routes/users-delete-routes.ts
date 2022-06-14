import { Router } from "express";

const checkAuth = require("../middleware/check-auth");
const usersDeleteControllers = require("../controllers/users-delete-controllers");

const router = Router();

router.delete(
  "/account/confirmation",
  usersDeleteControllers.deleteAccountConfirm
);

router.use(checkAuth);

router.patch("/account/send-email", usersDeleteControllers.deleteAccountEmail);

module.exports = router;
