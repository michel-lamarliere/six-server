import { createNodemailerTransporter } from './create-nodemailer-transporter';

const sendEmail = async (args: {
	to: string;
	subject: string;
	text: string;
	html: string;
}) => {
	const { to, subject, text, html } = args;

	const transporter = createNodemailerTransporter();

	// REMOVE WHEN DEPLOYING
	let toTemp = 'lamarliere.michel@icloud.com';

	let emailWasSent = false;

	emailWasSent = await transporter.sendMail({
		from: `info@six-app.com <${process.env.NODEMAILER_EMAIL}>`,
		to: to,
		// to: toTemp,
		subject: subject,
		text: text,
		html:
			html +
			`<br /><br /><div><a href='https://six-app.com'>six-app.com</a> vous remercie.</div>`,
	});

	return emailWasSent;
};

module.exports = sendEmail;
