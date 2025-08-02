const { getDB } = require('../config/mongo');
const { ObjectId } = require('mongodb');
const { Contrato, contratoSchema } = require('../models/contratoModel');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv();
addFormats(ajv);
const validate = ajv.compile(contratoSchema);

async function crearContrato(data) {
    if (!validate(data)) {
        const errores = validate.errors.map(e => `• ${e.instancePath} ${e.message}`).join('\n');
        throw new Error(`❌ Datos inválidos:\n${errores}`);
    }

    const db = await getDB();

    const contrato = {
        proyectoId: data.proyectoId,
        condiciones: data.condiciones,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        valorTotal: data.valorTotal,
        formaPago: data.formaPago,
        moneda: data.moneda,
        penalizacionPorRetraso: data.penalizacionPorRetraso || '',
        notasAdicionales: data.notasAdicionales || '',
        createdAt: new Date()
    };

    const result = await db.collection('contratos').insertOne(contrato);
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
    listarContratoPorProyecto
};
