import { Router } from "express";

const checkAuth = require("../middleware/check-auth");
const checkUserExists = require("../middleware/check-user-exists");

const addDataController = require("../controllers/log/add-data");
const getDailyController = require("../controllers/log/get-daily");
const getWeeklyController = require("../controllers/log/get-weekly");
const getMonthlyController = require("../controllers/log/get-monthly");

const router = Router();

router.use(checkAuth);
router.use(checkUserExists);

router.post("/task", addDataController.addData);

router.get("/daily/:id/:date", getDailyController.getDailyData);

router.get("/weekly/:id/:startofweek", getWeeklyController.getWeeklyData);

router.get("/monthly/:id/:date/:task", getMonthlyController.getMonthlyData);

module.exports = router;
