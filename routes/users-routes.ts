import { Router } from "express";

const checkAuth = require("../middleware/check-auth");
const checkUserExists = require("../middleware/check-user-exists");

const signUpController = require("../controllers/users/sign-up");
const signInController = require("../controllers/users/sign-in");
const refreshDataController = require("../controllers/users/refresh-data");

const router = Router();

router.post("/sign-up", signUpController.signUp);

router.post("/sign-in", signInController.signIn);

// router.get(
//   "/refresh-data/:userId",
//   checkAuth,
//   checkUserExists,
//   refreshDataController.refreshUserData
// );

module.exports = router;
