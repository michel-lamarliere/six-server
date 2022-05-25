import { RequestHandler } from 'express';
import { ObjectId } from 'mongodb';

const database = require('../utils/db-connect');

const getGoals: RequestHandler = async (req, res, next) => {
	const { id: reqIdStr, task: reqTask } = req.params;

	const reqId = new ObjectId(reqIdStr);

	const databaseConnect = await database.getDb().collection('users');

	// CHECKS IF THE USER EXISTS
	const user = await databaseConnect.findOne({ _id: reqId });

	if (!user) {
		return res.status(404).json({ fatal: true });
	}

	res.status(200).json({ success: true, goals: user.goals[reqTask] });
};

const editGoals: RequestHandler = async (req, res, next) => {
	const { id: reqIdStr, task: reqTask, goals: reqGoalsStr } = req.body;

	const reqId = new ObjectId(reqIdStr);

	const databaseConnect = await database.getDb().collection('users');

	// CHECKS IF THE USER EXISTS
	const user = await databaseConnect.findOne({ _id: reqId });

	if (!user) {
		return res.status(404).json({ fatal: true });
	}

	const validInputs = {
		task: false,
		goal: false,
	};

	const tasks = [
		'nutrition',
		'sleep',
		'sports',
		'relaxation',
		'projects',
		'social_life',
	];

	if (tasks.includes(reqTask)) {
		validInputs.task = true;
	}

	if (reqGoalsStr.trim().length < 100) {
		validInputs.goal = true;
	}

	if (!validInputs.task || !validInputs.goal) {
		return res.status(400).json({ error: true, validInputs });
	}

	const edittedUser = await databaseConnect.updateOne(
		{ _id: reqId },
		{ $set: { [`goals.${reqTask}`]: reqGoalsStr } }
	);

	if (!edittedUser) {
		return res.status(400).json({
			error: true,
			message: "Erreur lors de l'enregistrement des données.",
		});
	}

	res.status(200).json({ success: true });
};

exports.getGoals = getGoals;
exports.editGoals = editGoals;
