import { RequestHandler } from 'express';
const { ObjectId } = require('mongodb');
const {
	addDays,
	isAfter,
	getDaysInMonth,
	lastDayOfMonth,
	isSameDay,
} = require('date-fns');

const database = require('../utils/db-connect');

const addData: RequestHandler = async (req, res, next) => {
	const {
		_id: reqIdStr,
		date: reqDateStr,
		task: reqTask,
		levelOfCompletion: reqLevelOfCompletion,
	} = req.body;

	const reqDate = new Date(reqDateStr);

	const databaseConnect = await database.getDb().collection('users');

	const reqId = ObjectId(reqIdStr);

	// CHECKS IF THE USER EXISTS
	const user = await databaseConnect.findOne({ _id: reqId });

	if (!user) {
		res.status(404).json({ fatal: true });
		return;
	}

	// VALIDATION
	let inputsAreValid = {
		all: false,
		_id: true,
		date: {
			valid: false,
			format: false,
			pastOrPresent: false,
		},
		task: false,
		levelOfCompletion: false,
	};

	// CHECKS IF THE DATE IS A DATE
	if (!reqDate) {
		inputsAreValid.date.format = false;
	}

	inputsAreValid.date.format = true;

	// CHECKS IF DATE IS IN THE FUTURE
	if (isAfter(reqDate, new Date()) && !isSameDay(reqDate, new Date())) {
		return res.status(400).json({
			error: true,
			message:
				"Impossible d'enregistrer des données dont la date est dans le futur.",
		});
	} else inputsAreValid.date.pastOrPresent = true;

	// VALIDATES IF THE DATE IS IN THE CORRECT FORMAT AND NOT IN THE FUTURE
	if (inputsAreValid.date.format && inputsAreValid.date.pastOrPresent) {
		inputsAreValid.date.valid = true;
	}

	// VALIDATES THE TASK
	const taskNames = [
		'nutrition',
		'sleep',
		'sports',
		'relaxation',
		'projects',
		'social_life',
	];

	if (taskNames.includes(reqTask)) inputsAreValid.task = true;

	// VALIDATES THE LEVEL OF COMPLETION
	const taskLevels = [0, 1, 2];

	if (taskLevels.includes(reqLevelOfCompletion))
		inputsAreValid.levelOfCompletion = true;

	// VALIDATES THE WHOLE DATA
	if (
		inputsAreValid._id &&
		inputsAreValid.date.valid &&
		inputsAreValid.task &&
		inputsAreValid.levelOfCompletion
	) {
		inputsAreValid.all = true;
	}

	if (!inputsAreValid.all) {
		return res.status(400).json({
			error: true,
			message:
				"Erreur lors de l'enregistrement de données, certaines données sont invalides.",
		});
	}

	await databaseConnect
		.findOne({ _id: reqId, 'log.date': reqDate })
		.then((result: {}) => {
			if (result) {
				databaseConnect.updateOne(
					{ _id: reqId, 'log.date': reqDate },
					{
						$set: {
							[`log.$.six.${reqTask}`]: reqLevelOfCompletion,
						},
					}
				);
			} else {
				databaseConnect.updateOne(
					{ _id: reqId },
					{
						$push: {
							log: {
								date: reqDate,
								six: {
									nutrition: 0,
									sleep: 0,
									sports: 0,
									relaxation: 0,
									projects: 0,
									social_life: 0,
									[reqTask]: reqLevelOfCompletion,
								},
							},
						},
					}
				);
			}
			res.status(201).json({ success: true });
		})
		.catch((err: {}) => {
			res.status(400).json({
				message: "Erreur lors de l'enregistrement des données.",
			});
		});
};

const getDaily: RequestHandler = async (req, res, next) => {
	const reqId = new ObjectId(req.params.id);
	const reqDate: Date = new Date(req.params.date);

	const databaseConnect = await database.getDb().collection('users');

	// CHECKS IF THE USER EXISTS
	const user = await databaseConnect.findOne({ _id: reqId });

	if (!user) {
		return res.status(404).json({ fatal: true });
	}

	const result = await databaseConnect
		.aggregate([
			{
				$match: {
					_id: reqId,
				},
			},
			{
				$project: { _id: 0, data: '$log' },
			},
			{
				$unwind: {
					path: '$data',
				},
			},
			{
				$match: {
					'data.date': reqDate,
				},
			},
		])
		.toArray();

	if (result.length === 0) {
		return res.status(200).json({
			nutrition: 0,
			sleep: 0,
			sports: 0,
			relaxation: 0,
			projects: 0,
			social_life: 0,
		});
	}

	return res.status(200).json(result[0].data.six);
};

const getWeekly: RequestHandler = async (req, res, next) => {
	const reqId = new ObjectId(req.params.id);
	const reqStartDate = new Date(req.params.startofweek);

	const databaseConnect = await database.getDb().collection('users');

	// CHECKS IF THE USER EXISTS
	const user = await databaseConnect.findOne({ _id: reqId });

	if (!user) {
		res.status(404).json({ fatal: true });
		return;
	}

	// GET ALL DATES OF THE REQUESTED WEEK
	const getDatesArray = (startingDate: Date) => {
		const array = [];
		for (let i = 0; i < 7; i++) {
			array.push(addDays(startingDate, i));
		}

		return array;
	};

	const datesArray = getDatesArray(reqStartDate);

	const resultsArray: {
		date: Date;
		six: {
			nutrition: number;
			sleep: number;
			sports: number;
			relaxation: number;
			projects: number;
			social_life: number;
		};
	}[] = [];

	await databaseConnect
		.aggregate([
			{
				$match: {
					_id: reqId,
				},
			},
			{
				$project: {
					_id: 0,
					data: '$log',
				},
			},
			{
				$unwind: {
					path: '$data',
				},
			},
			{ $sort: { 'data.date': 1 } },
			{
				$match: {
					$and: [
						{
							'data.date': {
								$gte: datesArray[0],
							},
						},
						{
							'data.date': {
								$lte: datesArray[6],
							},
						},
					],
				},
			},
		])
		.forEach(
			(doc: {
				data: {
					date: Date;
					six: {
						nutrition: number;
						sleep: number;
						sports: number;
						relaxation: number;
						projects: number;
						social_life: number;
					};
				};
			}) => {
				resultsArray.push(doc.data);
			}
		);

	for (let date of datesArray) {
		let found = false;
		for (let i = 0; i < resultsArray.length; i++) {
			if (isSameDay(date, resultsArray[i].date)) {
				found = true;
			}
		}

		if (!found) {
			resultsArray.push({
				date: date,
				six: {
					nutrition: 0,
					sleep: 0,
					sports: 0,
					relaxation: 0,
					projects: 0,
					social_life: 0,
				},
			});
		}
	}

	const sortArray = (a: { date: Date }, b: { date: Date }) => {
		return isAfter(a.date, b.date) ? 1 : -1;
	};

	resultsArray.sort(sortArray);

	const responseArray: {
		nutrition: {}[];
		sleep: {}[];
		sports: {}[];
		relaxation: {}[];
		projects: {}[];
		social_life: {}[];
	} = {
		nutrition: [],
		sleep: [],
		sports: [],
		relaxation: [],
		projects: [],
		social_life: [],
	};

	let task:
		| 'nutrition'
		| 'sleep'
		| 'sports'
		| 'relaxation'
		| 'projects'
		| 'social_life';

	for (task in responseArray) {
		for (let i = 0; i < resultsArray.length; i++) {
			for (let sixTask in resultsArray[i].six) {
				if (task === sixTask) {
					responseArray[task].push(resultsArray[i].six[task]);
				}
			}
		}
	}

	res.status(200).json({ datesArray: datesArray, responseArray: responseArray });
};

const getMonthly: RequestHandler = async (req, res, next) => {
	const reqId = new ObjectId(req.params.id);
	const reqFirstDateOfMonth = new Date(req.params.date);
	const reqTask = req.params.task;

	const databaseConnect = await database.getDb().collection('users');

	// CHECKS IF THE USER EXISTS
	const user = await databaseConnect.findOne({ _id: reqId });

	if (!user) {
		res.status(404).json({ fatal: true });
		return;
	}

	const numberOfDaysInMonth: number = getDaysInMonth(reqFirstDateOfMonth);
	const lastDateOfMonth = lastDayOfMonth(reqFirstDateOfMonth);

	let matchedDatesArray: { date: Date; level: number }[] = [];

	await databaseConnect
		.aggregate([
			{
				$match: {
					_id: reqId,
				},
			},
			{
				$unwind: {
					path: '$log',
				},
			},
			{ $sort: { 'log.date': 1 } },
			{
				$match: {
					$and: [
						{
							'log.date': {
								$gte: reqFirstDateOfMonth,
							},
						},
						{
							'log.date': {
								$lte: lastDateOfMonth,
							},
						},
					],
				},
			},
			{ $project: { _id: 0, date: '$log.date', level: `$log.six.${reqTask}` } },
		])
		.forEach((doc: { date: Date; level: number }) => {
			matchedDatesArray.push(doc);
		});

	for (let i = 0; i < numberOfDaysInMonth; i++) {
		let loopingDate = addDays(reqFirstDateOfMonth, i);
		let found = false;
		for (let i = 0; i < matchedDatesArray.length; i++) {
			if (isSameDay(loopingDate, matchedDatesArray[i].date)) {
				found = true;
			}
		}

		if (!found) {
			matchedDatesArray.push({
				date: loopingDate,
				level: 0,
			});
		}
	}

	const sortArray = (a: { date: Date }, b: { date: Date }) => {
		return isAfter(a.date, b.date) ? 1 : -1;
	};

	matchedDatesArray.sort(sortArray);

	res.status(200).json(matchedDatesArray);
};

exports.addData = addData;
exports.getDaily = getDaily;
exports.getWeekly = getWeekly;
exports.getMonthly = getMonthly;
