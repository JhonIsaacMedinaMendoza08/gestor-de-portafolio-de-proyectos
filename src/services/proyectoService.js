const { getDB } = require('../config/mongo');
const Proyecto = require('../models/proyecto.js');
const { ObjectId } = require('mongodb');

async function crearProyecto(data) {
    const errores = Proyecto.validar(data);
    if (errores.length) throw new Error(errores.join(', '));

    const db = await getDB();
    const proyecto = new Proyecto(data);
    const result = await db.collection('proyectos').insertOne(proyecto);
    return result.insertedId;
}

async function listarProyectos() {
    const db = await getDB();
    return db.collection('proyectos').find().toArray();
}

async function actualizarEstadoProyecto(id, nuevoEstado) {
    const db = await getDB();
    return db.collection('proyectos').updateOne({ _id: id }, { $set: { estado: nuevoEstado } });
}

async function eliminarProyecto(id) {
    const db = await getDB();
    return db.collection('proyectos').deleteOne({ _id: id });
}

module.exports = {
    crearProyecto,
    listarProyectos,
    actualizarEstadoProyecto,
    eliminarProyecto,
};