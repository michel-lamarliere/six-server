import { Router } from "express";

const sendMessageController = require("../controllers/contact/send-message");

const router = Router();

router.post("/message", sendMessageController.sendMessage);

module.exports = router;
