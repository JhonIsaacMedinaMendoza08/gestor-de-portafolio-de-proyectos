const { MongoClient } = require('mongodb');
require('dotenv').config();

let db = null

async function getDB() {
    if (db) return db;

    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    db = client.db(process.env.DB_NAME);
    return db
    
}

module.exports = {getDB}