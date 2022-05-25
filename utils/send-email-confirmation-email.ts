const sendEmail = require('./send-email');

const sendEmailConfirmationEmail = (data: { to: string; uniqueCode: string }) => {
	const { to, uniqueCode } = data;

	const emailWasSent = sendEmail({
		to: to,
		subject: "Confirmation de l'adresse mail. ",
		html: `<div>Cliquez <a href="${
			process.env.FRONT_END_URL
		}/profil/confirmation/${encodeURI(to)}/${encodeURI(
			uniqueCode
		)}">ici</a> pour confirmer votre adresse mail.</div>`,
	});

	return emailWasSent;
};

module.exports = sendEmailConfirmationEmail;
