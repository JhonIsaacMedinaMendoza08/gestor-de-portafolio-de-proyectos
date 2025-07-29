const { getDB } = require('../config/mongo.js');
const Propuesta = require('../models/propuesta.js')
const { ObjectId } = require('mongodb');
const { crearProyecto } = require('./proyectoService.js');



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
    return db.collection('propuestas').find({ clienteId }).toArray();
}

async function actualizarEstado(id, nuevoEstado) {
    const db = await getDB();
    const propuesta = await db.collection('propuestas').findOne({ _id: new ObjectId(id) });

    await db.collection('propuestas').updateOne(
        { _id: new ObjectId(id) },
        { $set: { estado: nuevoEstado } }
    );

    if (nuevoEstado === 'aceptada') {
        await crearProyecto({
            clienteId: propuesta.clienteId,
            propuestaId: id.toString(),
            nombre: `Proyecto generado de propuesta`,
            descripcion: propuesta.descripcion,
            estado: 'activo'
        });
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
