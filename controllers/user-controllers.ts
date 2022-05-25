import { RequestHandler } from 'express';
const { ObjectId } = require('mongodb');
const { addMinutes, isBefore } = require('date-fns');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v5: uuidv5 } = require('uuid');

const database = require('../utils/db-connect');
const sendEmailConfirmationEmail = require('../utils/send-email-confirmation-email');
const sendEmail = require('../utils/send-email');

const signUp: RequestHandler = async (req, res, next) => {
	const {
		name: reqName,
		email: reqEmail,
		password: reqPassword,
		passwordConfirmation: reqPasswordConfirmation,
	} = await req.body;

	const databaseConnect = await database.getDb().collection('users');

	const validInputs = {
		all: false,
		name: false,
		email: {
			format: false,
			isAvailable: false,
		},
		password: false,
		passwordConfirmation: false,
	};

	// VALIDATION
	if (
		reqName.trim().length >= 2 &&
		reqName.trim().match(/^['’\p{L}\p{M}]*-?['’\p{L}\p{M}]*$/giu)
	) {
		validInputs.name = true;
	}

	if (
		reqEmail.match(
			/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
		)
	) {
		validInputs.email.format = true;
	}

	// // CHECKS IF THE USER EXISTS
	const user = await databaseConnect.findOne({ email: reqEmail });

	if (!user) {
		validInputs.email.isAvailable = true;
	}

	if (
		reqPassword.match(
			/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/
		)
	) {
		validInputs.password = true;
	}

	if (reqPassword === reqPasswordConfirmation) {
		validInputs.passwordConfirmation = true;
	}

	if (
		validInputs.name &&
		validInputs.email.format &&
		validInputs.email.isAvailable &&
		validInputs.password &&
		validInputs.passwordConfirmation
	) {
		validInputs.all = true;
	}

	if (!validInputs.all) {
		res.status(400).json({
			error: true,
			validInputs,
		});
		return;
	}

	// HASHES THE PASSWORD
	const hashedPassword = await bcrypt.hash(reqPassword, 10);
	const hashedConfirmationCode = uuidv5(reqEmail, process.env.UUID_NAMESPACE);

	// CREATES THE USER'S OBJECT
	const newUser = {
		icon: 0,
		name: reqName,
		email: reqEmail,
		password: hashedPassword,
		forgotPassword: {
			code: null,
			nextEmail: null,
		},
		confirmation: {
			confirmed: false,
			code: hashedConfirmationCode,
			nextEmail: addMinutes(new Date(), 5),
		},
		goals: {
			nutrition: null,
			sleep: null,
			relaxation: null,
			projects: null,
			sports: null,
			social_life: null,
		},
		deleteCode: null,
		log: [],

	};

	// INSERTS THE NEW USER IS THE DATABASE
	await databaseConnect.insertOne(newUser);

	// GETS THE ID
	let findingNewUser = await databaseConnect.findOne({ email: reqEmail });

	if (!findingNewUser) {
		res.status(404).json({
			error: true,
			message: 'Erreur, veuillez réessayer plus tard.',
		});
		return;
	}

	// CREATES THE TOKEN
	let token = await jwt.sign(
		{ id: findingNewUser._id, email: findingNewUser.email },
		process.env.JWT_SECRET,
		{ expiresIn: '1h' }
	);

	// SEND AN EMAIL CONFIRMATION EMAIL
	sendEmailConfirmationEmail({ to: reqEmail, uniqueCode: hashedConfirmationCode });

	sendEmail({
		to: 'info@six-app.com',
		subject: 'Nouveau utilisateur !',
		text: '',
		html: `${reqEmail} | ${reqName} vient de créer un compte.`,
	})

	res.status(201).json({
		success: true,
		message: 'Compte créé.',
		token: token,
		id: findingNewUser._id,
		icon: findingNewUser.icon,
		name: findingNewUser.name,
		email: findingNewUser.email,
		confirmedEmail: findingNewUser.confirmation.confirmed,
	});
};

const signIn: RequestHandler = async (req, res, next) => {
	const { email: reqEmail, password: reqPassword } = req.body;

	const databaseConnect = await database.getDb().collection('users');

	const user = await databaseConnect.findOne({ email: reqEmail });

	let validInputs = {
		email: false,
		password: false,
	};

	if (!user) {
		res.status(400).json({ error: true, validInputs });
		return;
	} else {
		validInputs.email = true;
	}

	// CHECKS IF THE PASSWORD MATCHES THE USER'S HASHED PASSWORD
	const matchingPasswords = await bcrypt.compare(reqPassword, user.password);

	// IF THE PASSWORDS DON'T MATCH
	if (matchingPasswords) {
		validInputs.password = true;
	}

	if (!validInputs.email || !validInputs.password) {
		res.status(400).json({ error: true, validInputs });
		return;
	}

	// CREATES A TOKEN
	const token = await jwt.sign(
		{ userId: user._id, email: user.email },
		process.env.JWT_SECRET,
		{ expiresIn: '1h' }
	);

	res.status(200).json({
		token,
		id: user._id,
		icon: user.icon,
		name: user.name,
		email: user.email,
		confirmedEmail: user.confirmation.confirmed,
	});
};

const refreshData: RequestHandler = async (req, res, next) => {
	const id = new ObjectId(req.params.userId);

	const databaseConnect = await database.getDb().collection('users');

	// CHECKS IF THE USER EXISTS
	const user = await databaseConnect.findOne({ _id: id });

	if (!user) {
		res.status(404).json({ fatal: true });
		return;
	}

	res.status(200).json({ success: true, message: 'Données rafraichies.', user });
};

exports.signUp = signUp;
exports.signIn = signIn;
exports.refreshData = refreshData;
