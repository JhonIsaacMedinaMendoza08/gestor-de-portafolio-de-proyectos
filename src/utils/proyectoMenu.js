const inquirer = require('inquirer');
const chalk = require('chalk');
const { listarClientes } = require('../services/clienteServices');
const { listarPropuestas } = require('../services/propuestaService');
const {
    crearProyectoManual,
    listarProyectos,
    cambiarEstadoProyecto,
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

    if (accion === '🆕 Crear proyecto manualmente') {
        const clientes = await listarClientes();

        const { clienteId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'clienteId',
                message: 'Selecciona cliente para el proyecto:',
                choices: clientes.map(c => ({ name: `${c.nombre} (${c.correo})`, value: c._id.toString() }))
            }
        ]);

        const datos = await inquirer.prompt([
            {
                name: 'nombre',
                message: 'Nombre del proyecto:',
                validate: val => val.length >= 5 || 'Debe tener al menos 5 caracteres'
            },
            {
                name: 'descripcion',
                message: 'Descripción del proyecto:',
                validate: val => val.trim() !== '' || 'Campo obligatorio'
            },
            {
                name: 'plazoDias',
                message: 'Plazo estimado (días):',
                validate: val => !isNaN(val) && Number(val) >= 1
            },
            {
                type: 'list',
                name: 'estado',
                message: 'Estado inicial:',
                choices: ['activo', 'pausado']
            }
        ]);

        try {
            await crearProyectoManual({
                clienteId,
                nombre: datos.nombre,
                descripcion: datos.descripcion,
                plazoDias: Number(datos.plazoDias),
                estado: datos.estado
            });
            console.log('✅ Proyecto creado manualmente.');
        } catch (err) {
            console.error(err.message);
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
                console.log(`📑 Creado en base a una propuesta`);
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
                console.log(`📑 Creado en base a una propuesta`);
            }
            console.log(`📌 Estado: ${chalk.yellow(p.estado)}`);
            console.log(`🗓️ Fecha: ${new Date(p.createdAt).toLocaleDateString()}`);
            console.log(chalk.gray('────────────────────────────────────────────\n'));
        });

        return menuProyectos();
    }

    else if (accion === '🔄 Cambiar estado de proyecto') {
        const proyectos = await listarProyectos();

        if (proyectos.length === 0) {
            console.log('⚠️ No hay proyectos registrados.');
            return menuProyectos();
        }

        const { proyectoId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'proyectoId',
                message: 'Selecciona el proyecto:',
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
                message: 'Selecciona el nuevo estado:',
                choices: ['activo', 'pausado', 'finalizado', 'cancelado']
            }
        ]);

        try {
            await cambiarEstadoProyecto(proyectoId, nuevoEstado);
            console.log('✅ Estado actualizado correctamente.');
        } catch (err) {
            console.error(err.message);
        }

        return menuProyectos();
    }
    else if (accion === '🗑️ Eliminar proyecto') {
        const proyectos = (await listarProyectos()).filter(p => p.estado === 'cancelado');

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

        if (!confirmar) {
            console.log(chalk.gray('❎ Eliminación cancelada.'));
            return menuProyectos();
        }

        try {
            await eliminarProyecto(new ObjectId(idProyecto));
            console.log(chalk.green('🗑️ Proyecto eliminado correctamente.'));
        } catch (err) {
            console.error(chalk.red(err.message));
        }

        return menuProyectos();
    }


    // Volver
    else {
        return;
    }

}

module.exports = menuProyectos;
