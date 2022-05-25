import express from 'express';

const database = require('./db-connect');
const app = require('../app');

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
	database.connectToServer((error: {}) => {
		if (error) console.error(error);
	});
	console.log('listening on port 8080');
});
