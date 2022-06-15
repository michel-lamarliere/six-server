import { Router } from "express";

const checkAuth = require("../middleware/check-auth");
const signUpController = require("../controllers/users/sign-up");
const signInController = require("../controllers/users/sign-in");
const refreshDataController = require("../controllers/users/refresh-data");

const router = Router();

router.post("/sign-up", signUpController.signUp);

router.post("/sign-in", signInController.signIn);

router.use(checkAuth);

router.get("/refresh-data/:userId", refreshDataController.refreshUserData);

module.exports = router;
