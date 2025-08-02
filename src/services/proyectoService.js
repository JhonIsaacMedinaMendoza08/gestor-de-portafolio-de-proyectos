const { getDB } = require('../config/mongo');
const { Proyecto, proyectoSchema } = require('../models/proyectoModel.js');
const { ObjectId } = require('mongodb');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv();
addFormats(ajv);
const validate = ajv.compile(proyectoSchema);


async function crearProyectoManual(data) {
    if (!validate(data)) {
        const errores = validate.errors.map(e => `• ${e.instancePath} ${e.message}`).join('\n');
        throw new Error(`❌ Datos inválidos:\n${errores}`);
    }

    const db = await getDB();
    const nuevo = new Proyecto(data);
    const resultado = await db.collection('proyectos').insertOne(nuevo);
    return resultado.insertedId;
}

async function listarProyectos() {
    const db = await getDB();
    return db.collection('proyectos').find().toArray();
}

async function cambiarEstadoProyecto(id, nuevoEstado) {
    const db = await getDB();
    const proyecto = await db.collection('proyectos').findOne({ _id: new ObjectId(id) });

    if (!proyecto) {
        throw new Error('❌ Proyecto no encontrado.');
    }

    const estadosPermitidos = ['activo', 'pausado', 'finalizado', 'cancelado'];
    if (!estadosPermitidos.includes(nuevoEstado)) {
        throw new Error('❌ Estado no válido.');
    }

    // if (['finalizado', 'cancelado'].includes(proyecto.estado)) {
    //     throw new Error(`❌ No se puede modificar un proyecto con estado "${proyecto.estado}".`);
    // }

    const result = await db.collection('proyectos').updateOne(
        { _id: new ObjectId(id) },
        { $set: { estado: nuevoEstado } }
    );

    if (result.modifiedCount === 0) {
        throw new Error('⚠️ No se pudo actualizar el estado del proyecto.');
    }

    return true;
}

async function eliminarProyecto(id) {
    const db = await getDB();
    const proyectoId = new ObjectId(id);

    const tieneContrato = await db.collection('contratos').findOne({ proyectoId });

    if (tieneContrato) {
        throw new Error('❌ No se puede eliminar: este proyecto tiene un contrato asociado.');
    }

    const resultado = await db.collection('proyectos').deleteOne({ _id: proyectoId });

    if (resultado.deletedCount === 0) {
        throw new Error('⚠️ No se encontró el proyecto para eliminar.');
    }

    return true;
}

module.exports = {
    crearProyectoManual,
    listarProyectos,
    cambiarEstadoProyecto,
    eliminarProyecto,
};