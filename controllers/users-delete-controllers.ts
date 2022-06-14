import { RequestHandler } from 'express';
const { ObjectId } = require('mongodb');
const crypto = require('crypto');

const database = require('../utils/db-connect');
const sendEmail = require('../utils/send-email');

const deleteAccountEmail: RequestHandler = async (req, res, next) => {
	const { id: reqIdStr } = req.body;

	const reqId = new ObjectId(reqIdStr);

	const databaseConnect = await database.getDb().collection('users');

	// CHECKS IF THE USER EXISTS
	const user = await databaseConnect.findOne({ _id: reqId });

	if (!user) {
		res.status(404).json({ fatal: true });
		return;
	}

	const generatedForgotPasswordCode = crypto.randomBytes(20).toString('hex');

	await databaseConnect.updateOne(
		{ _id: reqId },
		{
			$set: {
				deleteCode: generatedForgotPasswordCode,
			},
		}
	);

	const emailWasSent = await sendEmail({
		to: user.email,
		subject: 'Suppression de votre compte',
		html: `<div>Cliquez <a href="${
			process.env.FRONT_END_URL
		}/supprimer-compte/confirmation/${encodeURI(user.email)}/${encodeURI(
			generatedForgotPasswordCode
		)}">ici</a> pour supprimer votre compte.</div>`,
	});

	if (!emailWasSent) {
		res.status(400).json({ error: true, message: "Erreur lors de l'envoi de mail." });
		return;
	}

	res.status(200).json({ success: true, message: 'Email envoyé.' });
};

const deleteAccountConfirm: RequestHandler = async (req, res, next) => {
	const { email: reqEmail, code: reqCode } = req.body;

	// const reqId = new ObjectId(reqIdStr);

	const databaseConnect = await database.getDb().collection('users');

	// CHECKS IF THE USER EXISTS
	const user = await databaseConnect.findOne({ email: reqEmail });

	if (!user) {
		res.status(404).json({ fatal: true });
		return;
	}

	if (reqCode !== user.deleteCode) {
		res.status(400).json({
			error: true,
			message:
				'Erreur lors de la suppression de votre compte. Veuillez nous contacter via mail ou via le formulaire présent sur le site.',
		});
		return;
	}

	await databaseConnect.deleteOne({ email: reqEmail });

	const emailWasSent = await sendEmail({
		to: reqEmail,
		subject: 'Compte supprimé',
		html: `Nous sommes tristes de vous voir partir.`,
	});

	if (!emailWasSent) {
		res.status(400).json({ error: true, message: "Erreur lors de l'envoi de mail." });
		return;
	}

	res.json({ success: true, message: 'Compte supprimé.' });
};

exports.deleteAccountEmail = deleteAccountEmail;
exports.deleteAccountConfirm = deleteAccountConfirm;
