const inquirer = require('inquirer');
const chalk = require('chalk');
const { listarProyectos } = require('../services/proyectoService.js');
const { listarClientes } = require('../services/clienteServices.js');
const {
    crearEntregable,
    listarEntregablesPorProyecto,
    cambiarEstadoEntregable,
    eliminarEntregable
} = require('../services/entregableService.js');
const { ObjectId } = require('mongodb');

async function menuEntregables() {
    const { accion } = await inquirer.prompt([
        {
            type: 'list',
            name: 'accion',
            message: '📦 ¿Qué deseas hacer?',
            choices: [
                '🆕 Crear entregable',
                '📋 Ver entregables por proyecto',
                '🔄 Cambiar estado de entregable',
                '🗑️ Eliminar entregable',
                '⬅️ Volver'
            ]
        }
    ]);

    if (accion === '🆕 Crear entregable') {
        const proyectos = await listarProyectos();
        const activos = proyectos.filter(p => p.estado === 'activo');

        if (activos.length === 0) {
            console.log(chalk.yellow('⚠️ No hay proyectos activos para registrar entregables.'));
            return menuEntregables();
        }

        const { proyectoId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'proyectoId',
                message: 'Selecciona Proyecto',
                choices: activos.map(p => ({ name: p.nombre, value: p._id.toString() }))
            }

        ])
        const datos = await inquirer.prompt([
            {
                name: 'nombre',
                message: 'Nombre del entregable:',
                validate: val => val.length >= 5 || 'Debe tener al menos 5 caracteres'
            },
            {
                name: 'descripcion',
                message: 'Descripción del entregable:',
                validate: val => val.length >= 10 || 'Debe tener al menos 10 caracteres'
            },
            {
                name: 'fechaLimite',
                message: 'Fecha límite (YYYY-MM-DD):',
                validate: val => {
                    const fecha = new Date(val);
                    return fecha > new Date() || 'La fecha debe ser futura y válida (YYYY-MM-DD)';
                }
            }
        ]);

        try {
            await crearEntregable({
                proyectoId,
                nombre: datos.nombre,
                descripcion: datos.descripcion,
                fechaLimite: datos.fechaLimite
            });
            console.log(chalk.green('✅ Entregable creado correctamente.'));
        } catch (err) {
            console.error(chalk.red(err.message));
        }

        return menuEntregables();
    } 
    else if (accion === '📋 Ver entregables por proyecto') {
        const proyectos = await listarProyectos();
        const clientes = await listarClientes();

        const { proyectoId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'proyectoId',
                message: 'Selecciona proyecto:',
                choices: proyectos.map(p => ({ name: p.nombre, value: p._id.toString() }))
            }
        ]);

        const entregables = await listarEntregablesPorProyecto(proyectoId);
        const proyecto = proyectos.find(p => p._id.toString() === proyectoId);
        const cliente = clientes.find(c => c._id.toString() === proyecto.clienteId);

        if (entregables.length === 0) {
            console.log(chalk.yellow('⚠️ Este proyecto no tiene entregables registrados.'));
            return menuEntregables();
        }

        console.log(chalk.cyan.bold(`\n📦 Entregables para proyecto: ${proyecto.nombre} (Cliente: ${cliente?.nombre || 'Desconocido'})\n`));

        entregables.forEach((e, i) => {
            console.log(chalk.bold(`#${i + 1}`), chalk.green(e.nombre));
            console.log(`📝 Descripción: ${e.descripcion}`);
            console.log(`📅 Fecha límite: ${new Date(e.fechaLimite).toLocaleDateString()}`);
            console.log(`📌 Estado: ${chalk.yellow(e.estado)}`);
            console.log(`🕓 Registrado: ${new Date(e.createdAt).toLocaleDateString()}`);
            console.log(chalk.gray('────────────────────────────────────────────\n'));
        });

        return menuEntregables();
    }
    else if (accion === '🔄 Cambiar estado de entregable') {
        const proyectos = await listarProyectos();
        const { proyectoId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'proyectoId',
                message: 'Selecciona proyecto:',
                choices: proyectos.map(p => ({ name: p.nombre, value: p._id.toString() }))
            }
        ]);

        const entregables = await listarEntregablesPorProyecto(proyectoId);

        if (entregables.length === 0) {
            console.log(chalk.yellow('⚠️ Este proyecto no tiene entregables.'));
            return menuEntregables();
        }

        const { entregableId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'entregableId',
                message: 'Selecciona entregable:',
                choices: entregables.map(e => ({ name: `${e.nombre} (${e.estado})`, value: e._id.toString() }))
            }
        ]);

        const { nuevoEstado } = await inquirer.prompt([
            {
                type: 'list',
                name: 'nuevoEstado',
                message: 'Nuevo estado del entregable:',
                choices: ['pendiente', 'entregado', 'aprobado', 'rechazado']
            }
        ]);

        let razon = '';
        if (nuevoEstado === 'rechazado') {
            const res = await inquirer.prompt([
                {
                    name: 'razon',
                    message: 'Motivo del rechazo:',
                    validate: val => val.length >= 5 || 'Debe tener al menos 5 caracteres'
                }
            ]);
            razon = res.razon;
        }

        try {
            await cambiarEstadoEntregable(entregableId, nuevoEstado, razon);
            console.log(chalk.green('✅ Estado actualizado.'));
        } catch (err) {
            console.error(chalk.red(err.message));
        }

        return menuEntregables();
    }

    else if (accion === '🗑️ Eliminar entregable') {
        const proyectos = await listarProyectos();
        const { proyectoId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'proyectoId',
                message: 'Selecciona proyecto:',
                choices: proyectos.map(p => ({ name: p.nombre, value: p._id.toString() }))
            }
        ]);

        const entregables = await listarEntregablesPorProyecto(proyectoId);
        if (entregables.length === 0) {
            console.log(chalk.yellow('⚠️ Este proyecto no tiene entregables.'));
            return menuEntregables();
        }

        const { entregableId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'entregableId',
                message: 'Selecciona entregable a eliminar:',
                choices: entregables.map(e => ({ name: `${e.nombre} (${e.estado})`, value: e._id.toString() }))
            }
        ]);

        const { confirmar } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmar',
                message: '¿Confirmas la eliminación del entregable?',
                default: false
            }
        ]);

        if (confirmar) {
            try {
                await eliminarEntregable(entregableId);
                console.log(chalk.green('🗑️ Entregable eliminado correctamente.'));
            } catch (err) {
                console.error(chalk.red(err.message));
            }
        } else {
            console.log(chalk.gray('❎ Eliminación cancelada.'));
        }

        return menuEntregables();
    }
    else {
        return;
    }
}

module.exports = menuEntregables;
