import { Router } from "express";

const checkAuth = require("../middleware/check-auth");
const checkUserExists = require("../middleware/check-user-exists");

const chartsControllers = require("../controllers/charts/annual");

const router = Router();

router.use(checkAuth);
router.use(checkUserExists);

// router.get("/annual/:id/:year/:task", chartsControllers.getAnnualData);

module.exports = router;
