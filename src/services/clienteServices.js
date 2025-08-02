const { getDB } = require('../config/mongo.js');
const { Cliente, clienteSchema } = require('../models/clienteModel.js');
const { ObjectId } = require('mongodb');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');


const ajv = new Ajv();
addFormats(ajv);
const validate = ajv.compile(clienteSchema);


async function crearCliente(data) {
    if (!validate(data)) {
        const errores = validate.errors.map(e => `• ${e.instancePath} ${e.message}`).join('\n');
        throw new Error(`❌ Datos inválidos:\n${errores}`);
    }

    const db = await getDB();
    const coleccion = db.collection('clientes');

    const existe = await coleccion.findOne({
        $or: [
            { correo: data.correo },
            { telefono: data.telefono }
        ]
    });

    if (existe) throw new Error("❌ Ya existe un cliente con este correo o teléfono.");

    const nuevoCliente = new Cliente(data);
    const resultado = await coleccion.insertOne(nuevoCliente);
    return resultado.insertedId;
}

async function listarClientes() {
    const db = await getDB();
    return db.collection('clientes').find({}).toArray();
}

async function editarCliente(id, nuevosDatos) {
    const db = await getDB();

    if (!validate(nuevosDatos)) {
        const errores = validate.errors.map(e => `• ${e.instancePath} ${e.message}`).join('\n');
        throw new Error(`❌ Datos inválidos:\n${errores}`);
    }

    const duplicado = await db.collection('clientes').findOne({
        $and: [
            { _id: { $ne: new ObjectId(id) } },
            {
                $or: [
                    { correo: nuevosDatos.correo },
                    { telefono: nuevosDatos.telefono }
                ]
            }
        ]
    });

    if (duplicado) {
        throw new Error('❌ Ya existe otro cliente con este correo o teléfono.');
    }

    const resultado = await db.collection('clientes').updateOne(
        { _id: new ObjectId(id) },
        { $set: nuevosDatos }
    );

    if (resultado.modifiedCount === 0) {
        throw new Error('⚠️ No se realizó ninguna modificación.');
    }

    return true;
}


async function eliminarCliente(id) {
    const db = await getDB();
    return db.collection('clientes').deleteOne({ _id: id });
}



module.exports = {
    crearCliente,
    listarClientes,
    editarCliente,
    eliminarCliente,
};