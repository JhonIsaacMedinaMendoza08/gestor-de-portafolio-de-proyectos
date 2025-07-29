const inquirer = require('inquirer');
const { listarClientes } = require('../services/clienteServices.js');
const { crearPropuesta, listarPropuestasPorCliente, actualizarEstado, listarPropuestas, eliminarPropuesta } = require('../services/propuestaService.js');
const { ObjectId } = require('mongodb');
const chalk = require('chalk');


async function menuPropuestas() {
    const { accion } = await inquirer.prompt([
        {
            type: 'list',
            name: 'accion',
            message: '📑 ¿Qué deseas hacer?',
            choices: [
                'Crear propuesta',
                'Listar TODAS las propuestas',
                'Listar propuestas por cliente',
                'Cambiar estado de propuesta',
                'Eliminar propuesta',
                'Volver'
            ]
        }
    ]);
    if (accion === 'Crear propuesta') {
        const clientes = await listarClientes();
        const { clienteId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'clienteId',
                message: 'Selecciona cliente:',
                choices: clientes.map(c => ({ name: `${c.nombre} (${c.correo})`, value: c._id.toString() }))
            }
        ]);

        const datos = await inquirer.prompt([
            { name: 'descripcion', message: 'Descripción de la propuesta:' },
            {
                name: 'precio',
                message: 'Precio (en COP):',
                validate: val => !isNaN(val) && Number(val) > 0
            },
            {
                name: 'plazoDias',
                message: 'Plazo de entrega (días):',
                validate: val => !isNaN(val) && Number(val) > 0
            },
            {
                type: 'checkbox',
                name: 'tecnologias',
                message: 'Selecciona las tecnologías a usar:',
                choices: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB', 'Express', 'Vue', 'Angular']
            },
            {
                type: 'list',
                name: 'tipoTrabajo',
                message: '¿Qué tipo de trabajo es?',
                choices: ['frontend', 'backend', 'fullstack']
            }
        ]);
        try {
            await crearPropuesta({
                clienteId,
                descripcion: datos.descripcion,
                precio: Number(datos.precio),
                plazoDias: Number(datos.plazoDias),
                tecnologias: datos.tecnologias,
                tipoTrabajo: datos.tipoTrabajo
            });
            console.log('✅ Propuesta creada exitosamente');
        } catch (err) {
            console.error('❌ Error:', err.message);
        }

        return menuPropuestas();

    }
    else if (accion === 'Listar propuestas por cliente') {
        const clientes = await listarClientes();
        const { clienteId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'clienteId',
                message: 'Selecciona cliente:',
                choices: clientes.map(c => ({ name: `${c.nombre} (${c.correo})`, value: c._id.toString() }))
            }
        ]);

        const propuestas = await listarPropuestasPorCliente(clienteId);
        console.table(propuestas);
        return menuPropuestas();
    }
    else if (accion === 'Listar TODAS las propuestas') {
        const propuestas = await listarPropuestas();
        const clientes = await listarClientes();

        const clientesPorId = {};
        clientes.forEach(c => {
            clientesPorId[c._id.toString()] = c.nombre;
        });

        if (propuestas.length === 0) {
            console.log(chalk.yellow('⚠️ No hay propuestas registradas.'));
            return menuPropuestas();
        }

        console.log(chalk.cyan.bold('\n📑 Lista de propuestas registradas:\n'));

        propuestas.forEach((p, index) => {
            console.log(
                chalk.bold(`#${index + 1}`),
                chalk.greenBright('[' + (clientesPorId[p.clienteId] || 'Cliente desconocido') + ']')
            );
            console.log(chalk.white(`📝 Descripción:`), p.descripcion);
            console.log(chalk.white(`💰 Precio:`), chalk.yellow(`$${p.precio.toLocaleString()}`));
            console.log(chalk.white(`📅 Plazo:`), `${p.plazoDias} días`);
            console.log(chalk.white(`🛠️ Tipo de trabajo:`), p.tipoTrabajo);
            console.log(chalk.white(`🔧 Tecnologías:`), (p.tecnologias || []).join(', '));
            console.log(chalk.white(`📌 Estado:`), p.estado === 'aceptada' ? chalk.green(p.estado) : chalk.red(p.estado));
            console.log(chalk.white(`🗓️ Fecha:`), new Date(p.createdAt).toLocaleDateString());
            console.log(chalk.gray('────────────────────────────────────────────\n'));
        });

        return menuPropuestas();
    }
    else if (accion === 'Eliminar propuesta') {
        const propuestas = await listarPropuestas();

        if (propuestas.length === 0) {
            console.log('⚠️ No hay propuestas registradas.');
            return menuPropuestas();
        }

        const { propuestaId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'propuestaId',
                message: 'Selecciona la propuesta a eliminar:',
                choices: propuestas.map(p => ({
                    name: `${p.descripcion} (clienteId: ${p.clienteId}) - estado: ${p.estado}`,
                    value: p._id.toString()
                }))
            }
        ]);

        const { confirmar } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmar',
                message: '¿Seguro que deseas eliminar esta propuesta?',
                default: false
            }
        ]);

        if (confirmar) {
            await eliminarPropuesta(new ObjectId(propuestaId));
            console.log('🗑️ Propuesta eliminada correctamente.');
        } else {
            console.log('❎ Eliminación cancelada.');
        }

        return menuPropuestas();
    }
    else if (accion === 'Cambiar estado de propuesta') {
        const clientes = await listarClientes();
        const { clienteId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'clienteId',
                message: 'Selecciona cliente:',
                choices: clientes.map(c => ({ name: `${c.nombre} (${c.correo})`, value: c._id.toString() }))
            }
        ]);

        const propuestas = await listarPropuestasPorCliente(clienteId);
        const { propuestaId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'propuestaId',
                message: 'Selecciona propuesta:',
                choices: propuestas.map(p => ({ name: `${p.descripcion} - ${p.estado}`, value: p._id.toString() }))
            }
        ]);

        const { nuevoEstado } = await inquirer.prompt([
            {
                type: 'list',
                name: 'nuevoEstado',
                message: 'Nuevo estado:',
                choices: ['aceptada', 'rechazada']
            }
        ]);

        await actualizarEstado(new ObjectId(propuestaId), nuevoEstado);
        console.log('✅ Estado actualizado');

        return menuPropuestas();
    }

    else {
        return;
    }

}

module.exports = menuPropuestas;
