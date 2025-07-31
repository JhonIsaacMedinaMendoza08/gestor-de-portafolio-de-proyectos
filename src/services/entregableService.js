const { getDB } = require('../config/mongo.js');
const { Entregable, entregableSchema } = require('../models/entregableModel.js');
const { ObjectId } = require('mongodb');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv();
addFormats(ajv);
const validate = ajv.compile(entregableSchema);


async function crearEntregable(data) {
    if(!validate(data)){
        const errores = validate.errors.map(e => `• ${e.instancePath} ${e.message}`).join('\n');
        throw new Error(`❌ Datos inválidos:\n${errores}`);
    };

    const db = await getDB();
    const proyecto = await db.collection('proyectos').findOne({_id: new ObjectId(data.proyectoId)})
    
    if(!proyecto || proyecto.estado !== 'activo'){
        throw new Error ('❌ Solo se pueden agregar entregables a proyectos activos.')
    }

    const nuevo = new Entregable(data);
    const result = await db.collection('entregables').insertOne(nuevo);
    return result.insertedId;
}

module.exports = {
    crearEntregable,
    listarEntregablesPorProyecto
};