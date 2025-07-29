const { getDB } = require('../config/mongo');
const Contrato = require('../models/contratoModel.js');
const { ObjectId } = require('mongodb');

async function crearContrato(data) {
    const errores = Contrato.validar(data);
    if (errores.length) throw new Error(errores.join(', '));

    const db = await getDB();
    const nuevo = new Contrato(data);
    const result = await db.collection('contratos').insertOne(nuevo);
    return result.insertedId;
}

async function listarContratos() {
    const db = await getDB();
    return db.collection('contratos').find().toArray();
}

async function listarContratoPorProyecto(proyectoId) {
    const db = await getDB();
    return db.collection('contratos').findOne({ proyectoId });
}

module.exports = {
    crearContrato,
    listarContratos,
    listarContratoPorProyecto,
};
