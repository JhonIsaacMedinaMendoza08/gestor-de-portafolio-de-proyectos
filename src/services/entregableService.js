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

async function cambiarEstadoEntregable(id, nuevoEstado) {
    const estadosValidos = ['pendiente', 'entregado', 'aprobado', 'rechazado'];
    if (!estadosValidos.includes(nuevoEstado)) {
        throw new Error('❌ Estado no válido.');
    }

    const db = await getDB();
    const session = db.client.startSession();

    let resultado = null;
    await session.withTransaction(async () => {
        const entregable = await db.collection('entregables').findOne({ _id: new ObjectId(id) }, { session });
        if (!entregable) throw new Error('❌ Entregable no encontrado.');

        resultado = await db.collection('entregables').updateOne(
            { _id: new ObjectId(id) },
            { $set: { estado: nuevoEstado } },
            { session }
        );
    });

    await session.endSession();
    return resultado.modifiedCount > 0;
}

async function eliminarEntregable(id) {
    const db = await getDB();
    const session = db.client.startSession();

    let eliminado = false;
    await session.withTransaction(async () => {
        const entregable = await db.collection('entregables').findOne({ _id: new ObjectId(id) }, { session });
        if (!entregable) throw new Error('❌ Entregable no encontrado.');

        const result = await db.collection('entregables').deleteOne({ _id: new ObjectId(id) }, { session });
        eliminado = result.deletedCount > 0;
    });

    await session.endSession();
    return eliminado;
}

module.exports = {
    crearEntregable,
    listarEntregablesPorProyecto,
    cambiarEstadoEntregable,
    eliminarEntregable
};