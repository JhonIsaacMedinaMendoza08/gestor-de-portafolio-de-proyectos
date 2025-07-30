const { MongoClient } = require('mongodb');
require('dotenv').config();

let db = null

async function getDB() {
    if (db) return db;

    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    db = client.db(process.env.DB_NAME);
    try {
        await db.collection('clientes').createIndex({ correo: 1 }, { unique: true });
        await db.collection('clientes').createIndex({ telefono: 1 }, { unique: true });
    } catch (err) {
        console.warn('⚠️ Advertencia al crear índices únicos:', err.message);
    }
    return db
    
}

module.exports = {getDB}