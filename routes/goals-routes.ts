import { Router } from "express";

const checkAuth = require("../middleware/check-auth");
const checkUserExists = require("../middleware/check-user-exists");

const getGoalsController = require("../controllers/goals/get");
const editGoalsController = require("../controllers/goals/edit");

const router = Router();

router.use(checkAuth);
router.use(checkUserExists);

// router.get("/goal/:id/:task", getGoalsController.getGoals);

// router.post("/edit-goal", editGoalsController.editGoals);

module.exports = router;
