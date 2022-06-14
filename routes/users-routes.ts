import { Router } from "express";

const checkAuth = require("../middleware/check-auth");
const usersControllers = require("../controllers/users-controllers");

const router = Router();

router.post("/sign-up", usersControllers.signUp);

router.post("/sign-in", usersControllers.signIn);

router.use(checkAuth);

router.get("/refresh-data/:userId", usersControllers.refreshData);

module.exports = router;
