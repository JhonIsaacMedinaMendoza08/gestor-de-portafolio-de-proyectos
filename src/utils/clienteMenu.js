const inquirer = require('inquirer');
const { crearCliente, listarClientes, editarCliente, eliminarCliente } = require('../services/clienteServices.js');
const { ObjectId } = require('mongodb');


async function menuCliente() {
    const opcion = await inquirer.prompt([
        {
            type: 'list',
            name: 'accion',
            message: '¿Qué deseas hacer?',
            choices: ['Crear cliente', 'Listar clientes', 'Editar Cliente', 'Eliminar Cliente', 'Volver']
        }
    ]);

    if (opcion.accion === 'Crear cliente') {
        const respuestas = await inquirer.prompt([
            { name: 'nombre', message: 'Nombre:' },
            { name: 'correo', message: 'Correo:' },
            { name: 'telefono', message: 'Teléfono:' },
            {
                name: 'tipo',
                message: 'Tipo de cliente',
                type: 'list',
                choices: ['empresa', 'independiente']
            }
        ]);

        try {
            await crearCliente(respuestas);
            console.log('✅ Cliente creado exitosamente');
        } catch (err) {
            console.error('❌ Error:', err.message);
        }

        return menuCliente();

    } else if (opcion.accion === 'Editar Cliente') {
        const clientes = await listarClientes();

        const { idCliente } = await inquirer.prompt([
            {
                type: 'list',
                name: 'idCliente',
                message: 'Selecciona el cliente a editar:',
                choices: clientes.map(c => ({ name: `${c.nombre} (${c.correo})`, value: c._id.toString() }))
            }
        ]);

        const nuevosDatos = await inquirer.prompt([
            { name: 'nombre', message: 'Nuevo nombre:' },
            { name: 'correo', message: 'Nuevo correo:' },
            { name: 'telefono', message: 'Nuevo teléfono:' },
            {
                name: 'tipo',
                message: 'Nuevo tipo de cliente',
                type: 'list',
                choices: ['empresa', 'independiente']
            }
        ]);

        try {
            await editarCliente(new ObjectId(idCliente), nuevosDatos);
            console.log('✅ Cliente actualizado correctamente.');
        } catch (err) {
            console.error('❌ Error:', err.message);
        }

        return menuCliente();

    } else if (opcion.accion === 'Eliminar Cliente') {
        const clientes = await listarClientes();

        const { idCliente } = await inquirer.prompt([
            {
                type: 'list',
                name: 'idCliente',
                message: 'Selecciona el cliente a eliminar:',
                choices: clientes.map(c => ({ name: `${c.nombre} (${c.correo})`, value: c._id.toString() }))
            }
        ]);

        const { confirmar } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmar',
                message: '¿Estás seguro que deseas eliminar este cliente?',
                default: false
            }
        ]);

        if (confirmar) {
            try {
                await eliminarCliente(new ObjectId(idCliente));
                console.log('🗑️ Cliente eliminado correctamente.');
            } catch (err) {
                console.error('❌ Error:', err.message);
            }
        } else {
            console.log('❎ Eliminación cancelada.');
        }

        return menuCliente();

    } else if (opcion.accion === 'Listar clientes') {
        const clientes = await listarClientes();
        if (clientes.length === 0) {
        console.log('⚠️ No hay clientes registrados.');
    } else {
        const clientesFormateados = clientes.map(c => ({
            Nombre: c.nombre,
            Correo: c.correo,
            Teléfono: c.telefono,
            Tipo: c.tipo,
            'Fecha de registro': new Date(c.createAt).toLocaleString()
        }));
        console.table(clientesFormateados);
    }

    await menuCliente();

    } else if (opcion.accion === 'Volver') {
        return; 
    }
}

module.exports = menuCliente;
