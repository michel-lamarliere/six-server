import { Router } from "express";

const checkAuth = require("../middleware/check-auth");
const addDataController = require("../controllers/log/add-data");
const getDailyController = require("../controllers/log/get-daily");
const getWeeklyController = require("../controllers/log/get-weekly");
const getMonthlyController = require("../controllers/log/get-monthly");

const router = Router();

router.use(checkAuth);

router.post("/task", addDataController.addData);

router.get("/daily/:id/:date", getDailyController.getDaily);

router.get("/weekly/:id/:startofweek", getWeeklyController.getWeekly);

router.get("/monthly/:id/:date/:task", getMonthlyController.getMonthly);

module.exports = router;
