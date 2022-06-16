import { Router } from "express";

const checkAuth = require("../middleware/check-auth");
const checkUserExists = require("../middleware/check-user-exists");

const sendMessageLoggedInController = require("../controllers/contact/send-message-logged-in");
const sendMessageLoggedOutController = require("../controllers/contact/send-message-logged-out");

const router = Router();

// router.post(
//   "/logged-in/message",
//   checkAuth,
//   checkUserExists,
//   sendMessageLoggedInController.sendMessageLoggedIn
// );

// router.post(
//   "/logged-out/message",
//   sendMessageLoggedOutController.sendMessageLoggedOut
// );

module.exports = router;
