const { getDB } = require('../config/mongo.js');
const Cliente = require('../models/cliente.js');

async function crearCliente(data) {
    const errores = Cliente.validar(data);
    if(errores.length) throw new Error (errores.join(', '));

    const db = await getDB();
    const coleccion = db.coleccion('clientes');

    const existe = await coleccion.findOne({correo: data.correo});
    if (existe) throw new Error("❌ Cliente con este correo ya existe");

    const nuevoCliente = new Cliente(data);
    const resultado = await coleccion.insertOne(nuevoCliente);
    return resultado.insertedId;
}

async function listarClientes(){
    const db = await getDB();
    return db.coleccion('clientes').find({}).toArray();
}

async function editarCliente(id, nuevosDatos) {
    const db = await getDb();
    return db.collection('clientes').updateOne({ _id: id }, { $set: nuevosDatos });
}

async function eliminarCliente(id) {
    const db = await getDb();
    return db.collection('clientes').deleteOne({ _id: id });
}


module.exports = {
    crearCliente,
    listarClientes,
    editarCliente,
    eliminarCliente,
};