const { getDB } = require('../config/mongo.js');
const Propuesta = require('../models/propuesta.js')
const {ObjectId} = require('mongodb');


async function crearPropuesta(data) {
    const errores = Propuesta.validar(data);
    if (errores.length) throw new Error(errores.join(', '));

    const db = await getDB();
    const nueva = new Propuesta(data)
    const result = await db.collection('propuestas').insertOne(nueva);
    return result.insertedId;
}

async function listarPropuestas() {
    const db = await getDB();
    return db.collection('propuestas').find().toArray();
}

async function listarPropuestasPorCliente(clienteId) {
    const db = await getDB();
    return db.collection('propuestas').find({clienteId}).toArray();
}

async function actualizarEstado(id, nuevoEstado) {
    const db = await getDb();
    return db.collection('propuestas').updateOne({ _id: id }, { $set: { estado: nuevoEstado } });
}


module.exports = {
    crearPropuesta,
    listarPropuestas,
    listarPropuestasPorCliente,
    actualizarEstado,
};
