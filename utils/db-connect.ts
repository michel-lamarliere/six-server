const { MongoClient } = require('mongodb');

const client = new MongoClient(
	`mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_USER_PWD}@six-cluster.vl7dd.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
);

const connectToServer = async () => {
	await client.connect();

	await client.db(`${process.env.DB_NAME}`);
	console.log(`Connected to the ${process.env.DB_NAME} database!`);
};

const getDb = () => {
	return client.db(`${process.env.DB_NAME}`);
};

module.exports = { connectToServer, getDb };
