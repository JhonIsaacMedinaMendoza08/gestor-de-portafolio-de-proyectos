const { getDB } = require('../config/mongo.js');
const { Propuesta, propuestaSchema } = require('../models/propuestaModel.js');
const { ObjectId } = require('mongodb');
const { crearProyecto } = require('./proyectoService.js');
const inquirer = require('inquirer');

const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv();
addFormats(ajv);
const validate = ajv.compile(propuestaSchema);


async function crearPropuesta(data) {
    if (!validate(data)) {
        const errores = validate.errors.map(e => `• ${e.instancePath} ${e.message}`).join('\n');
        throw new Error(`❌ Datos inválidos:\n${errores}`);
    }

    const db = await getDB();
    const nueva = new Propuesta(data);
    const result = await db.collection('propuestas').insertOne(nueva);
    return result.insertedId;
}

async function listarPropuestas() {
    const db = await getDB();
    return db.collection('propuestas').find().sort({ createdAt: -1 }).toArray();

}

async function listarPropuestasPorCliente(clienteId) {
    const db = await getDB();
    return db.collection('propuestas').find({ clienteId }).toArray();
}

async function actualizarEstado(id, nuevoEstado) {
    const db = await getDB();
    const propuesta = await db.collection('propuestas').findOne({ _id: new ObjectId(id) });

    if (!propuesta) {
        throw new Error("❌ Propuesta no encontrada.");
    }

    const estadosValidos = ['pendiente', 'aceptada', 'rechazada'];
    if (!estadosValidos.includes(nuevoEstado)) {
        throw new Error("❌ Estado inválido.");
    }

    if (propuesta.estado === nuevoEstado) {
        throw new Error(`⚠️ La propuesta ya tiene el estado "${nuevoEstado}".`);
    }

    await db.collection('propuestas').updateOne(
        { _id: new ObjectId(id) },
        { $set: { estado: nuevoEstado } }
    );

    if (nuevoEstado === 'aceptada') {
        const { nombreProyecto } = await inquirer.prompt([
            {
                name: 'nombreProyecto',
                message: '📝 Ingresa el nombre del proyecto que se generará:',
                validate: input => input.trim().length >= 5 || 'Debe tener al menos 5 caracteres.'
            }
        ]);

        await crearProyecto({
            clienteId: propuesta.clienteId,
            propuestaId: id.toString(),
            nombre: nombreProyecto,
            descripcion: propuesta.descripcion,
            estado: 'activo'
        });

        console.log(`🚀 Proyecto "${nombreProyecto}" creado exitosamente.`);
    }
}

async function eliminarPropuesta(id) {
    const db = await getDB();
    return db.collection('propuestas').deleteOne({ _id: id });
}

module.exports = {
    crearPropuesta,
    listarPropuestas,
    listarPropuestasPorCliente,
    actualizarEstado,
    eliminarPropuesta
};
