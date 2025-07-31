const { getDB } = require('../config/mongo.js');
const { Entregable, entregableSchema } = require('../models/entregableModel.js');
const { ObjectId } = require('mongodb');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv();
addFormats(ajv);
const validate = ajv.compile(entregableSchema);


async function crearEntregable(data) {
    if (!validate(data)) {
        const errores = validate.errors.map(e => `• ${e.instancePath} ${e.message}`).join('\n');
        throw new Error(`❌ Datos inválidos:\n${errores}`);
    };

    const db = await getDB();
    const proyecto = await db.collection('proyectos').findOne({ _id: new ObjectId(data.proyectoId) })

    if (!proyecto || proyecto.estado !== 'activo') {
        throw new Error('❌ Solo se pueden agregar entregables a proyectos activos.')
    }

    const nuevo = new Entregable(data);
    const result = await db.collection('entregables').insertOne(nuevo);
    return result.insertedId;
}
async function listarEntregablesPorProyecto(proyectoId) {
    const db = await getDB();
    return db.collection('entregables').find({ proyectoId }).toArray();
}

async function cambiarEstadoEntregable(entregableId, nuevoEstado, razon = ''){
    const db = await getDB();
    const session = db.client.startSession();

    try{
        await session.withTransaction(async () => {
            const entregable = await db.collection('entregables').findOne({_id: new ObjectId(entregableId)}, {session});

            if(!entregable) throw new Error('❌ Entregable no encontrado.');
            if(!['pendiente','entregado','aprobado','rechazado'].includes(nuevoEstado)){
                throw new Error('❌ Estado no válido.');
            }

            const updateFields = {estado: nuevoEstado};
            if(nuevoEstado === 'rechazado'){
                if(!razon || razon.trim().length<5){
                    throw new Error('❌ Debes incluir una razón válida (mínimo 5 caracteres) para el rechazo.');
                }
                updateFields.razonRechazo = razon;
            } else {
                updateFields.razonRechazo = undefined;
            }

            const result = await db.collection('entregables').updateOne(
                { _id: new ObjectId(entregableId) },
                { $set: updateFields },
                { session }
            );

            if(result.modifiedCount === 0){
                throw new Error('⚠️ No se actualizó el estado del entregable.');
            }
        });

        return true;
    } finally {
        await session.endSession();
    }
}
    
async function eliminarEntregable(entregableId) {
    const db = await getDB();
    const session = db.client.startSession();

    try {
        await session.withTransaction(async () => {
            const resultado = await db.collection('entregables').deleteOne(
                { _id: new ObjectId(entregableId) },
                { session }
            );

            if (resultado.deletedCount === 0) {
                throw new Error('⚠️ No se pudo eliminar el entregable.');
            }
        });

        return true;
    } finally {
        await session.endSession();
    }
}

module.exports = {
    crearEntregable,
    listarEntregablesPorProyecto,
    cambiarEstadoEntregable,
    eliminarEntregable
};