import { Router } from "express";

const checkAuth = require("../middleware/check-auth");
const chartsControllers = require("../controllers/charts/annual");

const router = Router();

router.use(checkAuth);

router.get("/annual/:id/:year/:task", chartsControllers.getAnnual);

module.exports = router;
