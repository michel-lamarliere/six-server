const nodemailer = require('nodemailer');

export const createNodemailerTransporter = () => {
	const transporter = nodemailer.createTransport({
		host: 'mail.privateemail.com',
		port: 465,
		secure: true,
		auth: {
			user: process.env.NODEMAILER_EMAIL,
			pass: process.env.NODEMAILER_PASSWORD,
		},
	});

	return transporter;
};
