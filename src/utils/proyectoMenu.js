const inquirer = require('inquirer');
const chalk = require('chalk');
const { listarClientes } = require('../services/clienteServices');
const { listarPropuestas } = require('../services/propuestaService');
const {
    crearProyecto,
    listarProyectos,
    actualizarEstadoProyecto,
    eliminarProyecto
} = require('../services/proyectoService');
const { ObjectId } = require('mongodb');

async function menuProyectos() {
    const { accion } = await inquirer.prompt([
        {
            type: 'list',
            name: 'accion',
            message: '📁 ¿Qué deseas hacer?',
            choices: [
                '🆕 Crear proyecto manualmente',
                '📋 Listar todos los proyectos',
                '📂 Listar proyectos por cliente',
                '🔄 Cambiar estado de proyecto',
                '🗑️ Eliminar proyecto',
                '⬅️ Volver'
            ]
        }
    ]);

    // Crear proyecto manualmente
    if (accion === '🆕 Crear proyecto manualmente') {
        const clientes = await listarClientes();

        const { clienteId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'clienteId',
                message: 'Selecciona cliente:',
                choices: clientes.map(c => ({
                    name: `${c.nombre} (${c.correo})`,
                    value: c._id.toString()
                }))
            }
        ]);

        const respuestas = await inquirer.prompt([
            { name: 'nombre', message: 'Nombre del proyecto:' },
            { name: 'descripcion', message: 'Descripción del proyecto:' },
            {
                type: 'list',
                name: 'estado',
                message: 'Estado inicial:',
                choices: ['activo', 'pausado', 'finalizado', 'cancelado']
            }
        ]);
        try {
            await crearProyecto({
                clienteId,
                propuestaId: null,
                nombre: respuestas.nombre,
                descripcion: respuestas.descripcion,
                estado: respuestas.estado
            });
            console.log(chalk.green('✅ Proyecto creado manualmente.'));
        } catch (err) {
            console.error(chalk.red('❌ Error:'), err.message);
        }

        return menuProyectos();
    }


    else if (accion === '📋 Listar todos los proyectos') {
        const proyectos = await listarProyectos();
        const clientes = await listarClientes();
        const propuestas = await listarPropuestas();

        const clientesPorId = Object.fromEntries(clientes.map(c => [c._id.toString(), c.nombre]));
        const propuestasPorId = Object.fromEntries(propuestas.map(p => [p._id.toString(), p.descripcion]));

        if (proyectos.length === 0) {
            console.log(chalk.yellow('⚠️ No hay proyectos registrados.'));
            return menuProyectos();
        }

        console.log(chalk.cyan.bold('\n📁 Lista de proyectos:\n'));

        proyectos.forEach((p, i) => {
            console.log(chalk.bold(`#${i + 1}`), chalk.greenBright(p.nombre));
            console.log(`👤 Cliente: ${clientesPorId[p.clienteId] || '🔴 Desconocido'}`);
            console.log(`📝 Descripción: ${p.descripcion}`);
            if (p.propuestaId) {
                console.log(`📑 Propuesta asociada: ${propuestasPorId[p.propuestaId] || '🔴 No encontrada'}`);
            }
            console.log(`📌 Estado: ${chalk.yellow(p.estado)}`);
            console.log(`🗓️ Creado: ${new Date(p.createdAt).toLocaleDateString()}`);
            console.log(chalk.gray('────────────────────────────────────────────\n'));
        });

        return menuProyectos();
    }
    else if (accion === '📂 Listar proyectos por cliente') {
        const clientes = await listarClientes();
        const proyectos = await listarProyectos();

        const { clienteId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'clienteId',
                message: 'Selecciona cliente:',
                choices: clientes.map(c => ({
                    name: `${c.nombre} (${c.correo})`,
                    value: c._id.toString()
                }))
            }
        ]);

        const proyectosDelCliente = proyectos.filter(p => p.clienteId === clienteId);

        if (proyectosDelCliente.length === 0) {
            console.log(chalk.yellow('⚠️ Este cliente no tiene proyectos registrados.'));
            return menuProyectos();
        }

        console.log(chalk.cyan.bold(`\n📁 Proyectos del cliente: ${clientes.find(c => c._id.toString() === clienteId).nombre}\n`));

        proyectosDelCliente.forEach((p, i) => {
            console.log(chalk.bold(`#${i + 1}`), chalk.greenBright(p.nombre));
            console.log(`📝 Descripción: ${p.descripcion}`);
            if (p.propuestaId) {
                console.log(`📑 Desde propuesta: ${p.propuestaId}`);
            }
            console.log(`📌 Estado: ${chalk.yellow(p.estado)}`);
            console.log(`🗓️ Fecha: ${new Date(p.createdAt).toLocaleDateString()}`);
            console.log(chalk.gray('────────────────────────────────────────────\n'));
        });

        return menuProyectos();
    }

    // Cambiar estado del proyecto
    else if (accion === '🔄 Cambiar estado de proyecto') {
        const proyectos = await listarProyectos();

        if (proyectos.length === 0) {
            console.log(chalk.yellow('⚠️ No hay proyectos para actualizar.'));
            return menuProyectos();
        }

        const { idProyecto } = await inquirer.prompt([
            {
                type: 'list',
                name: 'idProyecto',
                message: 'Selecciona proyecto:',
                choices: proyectos.map(p => ({
                    name: `${p.nombre} (${p.estado})`,
                    value: p._id.toString()
                }))
            }
        ]);

        const { nuevoEstado } = await inquirer.prompt([
            {
                type: 'list',
                name: 'nuevoEstado',
                message: 'Selecciona nuevo estado:',
                choices: ['activo', 'pausado', 'finalizado', 'cancelado']
            }
        ]);

        await actualizarEstadoProyecto(new ObjectId(idProyecto), nuevoEstado);
        console.log(chalk.green('✅ Estado del proyecto actualizado.'));

        return menuProyectos();
    }
    else if (accion === '🗑️ Eliminar proyecto') {
        const proyectos = await listarProyectos();

        if (proyectos.length === 0) {
            console.log(chalk.yellow('⚠️ No hay proyectos para eliminar.'));
            return menuProyectos();
        }

        const { idProyecto } = await inquirer.prompt([
            {
                type: 'list',
                name: 'idProyecto',
                message: 'Selecciona proyecto a eliminar:',
                choices: proyectos.map(p => ({
                    name: `${p.nombre} (${p.estado})`,
                    value: p._id.toString()
                }))
            }
        ]);

        const { confirmar } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmar',
                message: '¿Estás seguro de eliminar este proyecto?',
                default: false
            }
        ]);

        if (confirmar) {
            await eliminarProyecto(new ObjectId(idProyecto));
            console.log(chalk.green('🗑️ Proyecto eliminado correctamente.'));
        } else {
            console.log(chalk.gray('❎ Eliminación cancelada.'));
        }

        return menuProyectos();
    }

    // Volver
    else {
        return;
    }

}

module.exports = menuProyectos;
