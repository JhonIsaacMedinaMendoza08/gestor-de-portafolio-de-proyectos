const inquirer = require('inquirer');
const chalk = require('chalk');
const { listarProyectos } = require('../services/proyectoService.js');
const { listarClientes } = require('../services/clienteServices.js');
const {
    crearEntregable,
    listarEntregablesPorProyecto,
    // cambiarEstadoEntregable,
    // eliminarEntregable
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
                // '🔄 Cambiar estado de entregable',
                // '🗑️ Eliminar entregable',
                // '⬅️ Volver'
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



}

module.exports = menuEntregables;
