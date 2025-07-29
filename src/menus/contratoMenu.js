const inquirer = require('inquirer');
const chalk = require('chalk');
const { listarProyectos } = require('../services/proyectoService.js');
const { listarClientes } = require('../services/clienteServices.js');
const {
    crearContrato,
    listarContratos,
    listarContratoPorProyecto
} = require('../services/contratoService.js');
const { ObjectId } = require('mongodb');

async function menuContratos() {
    const { accion } = await inquirer.prompt([
        {
            type: 'list',
            name: 'accion',
            message: '📜 ¿Qué deseas hacer?',
            choices: [
                '🆕 Crear contrato para un proyecto',
                '🔍 Ver contrato por proyecto',
                '📄 Listar todos los contratos',
                '⬅️ Volver'
            ]
        }
    ]);

    if (accion === '🆕 Crear contrato para un proyecto') {
        const proyectos = await listarProyectos();
        const contratos = await listarContratos();

        // Excluir proyectos que ya tienen contrato
        const usados = contratos.map(c => c.proyectoId);
        const disponibles = proyectos.filter(p => !usados.includes(p._id.toString()));

        if (disponibles.length === 0) {
            console.log(chalk.yellow('⚠️ Todos los proyectos ya tienen contrato.'));
            return menuContratos();
        }

        const { proyectoId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'proyectoId',
                message: 'Selecciona un proyecto:',
                choices: disponibles.map(p => ({
                    name: `${p.nombre} (${p._id.toString()})`,
                    value: p._id.toString()
                }))
            }
        ]);

        const datos = await inquirer.prompt([
            { name: 'condiciones', message: 'Condiciones del contrato:' },
            { name: 'fechaInicio', message: 'Fecha de inicio (YYYY-MM-DD):' },
            { name: 'fechaFin', message: 'Fecha de finalización (YYYY-MM-DD):' },
            {
                name: 'valorTotal',
                message: 'Valor total del contrato:',
                validate: val => !isNaN(val) && Number(val) > 0
            }
        ]);

        try {
            await crearContrato({
                proyectoId,
                condiciones: datos.condiciones,
                fechaInicio: new Date(datos.fechaInicio),
                fechaFin: new Date(datos.fechaFin),
                valorTotal: Number(datos.valorTotal)
            });

            console.log(chalk.green('✅ Contrato creado correctamente.'));
        } catch (err) {
            console.error(chalk.red('❌ Error:'), err.message);
        }

        return menuContratos();
    }

    // Ver contrato por proyecto
    else if (accion === '🔍 Ver contrato por proyecto') {
        const proyectos = await listarProyectos();
        const clientes = await listarClientes();

        const { proyectoId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'proyectoId',
                message: 'Selecciona proyecto:',
                choices: proyectos.map(p => ({
                    name: `${p.nombre} (${p.estado})`,
                    value: p._id.toString()
                }))
            }
        ]);

        const contrato = await listarContratoPorProyecto(proyectoId);
        const proyecto = proyectos.find(p => p._id.toString() === proyectoId);
        const cliente = clientes.find(c => c._id.toString() === proyecto.clienteId);

        if (!contrato) {
            console.log(chalk.yellow('⚠️ Este proyecto aún no tiene contrato.'));
            return menuContratos();
        }

        console.log(chalk.cyan.bold('\n📜 Contrato asociado:\n'));
        console.log(`📁 Proyecto: ${proyecto.nombre}`);
        console.log(`👤 Cliente: ${cliente?.nombre || 'Desconocido'}`);
        console.log(`📝 Condiciones: ${contrato.condiciones}`);
        console.log(`📆 Inicio: ${new Date(contrato.fechaInicio).toLocaleDateString()}`);
        console.log(`📆 Fin: ${new Date(contrato.fechaFin).toLocaleDateString()}`);
        console.log(`💰 Valor total: $${contrato.valorTotal.toLocaleString()}`);
        console.log(chalk.gray('────────────────────────────────────────────\n'));

        return menuContratos();
    }

    // Listar todos los contratos
    else if (accion === '📄 Listar todos los contratos') {
        const contratos = await listarContratos();
        const proyectos = await listarProyectos();
        const clientes = await listarClientes();

        const proyectosPorId = Object.fromEntries(proyectos.map(p => [p._id.toString(), p]));
        const clientesPorId = Object.fromEntries(clientes.map(c => [c._id.toString(), c.nombre]));

        if (contratos.length === 0) {
            console.log(chalk.yellow('⚠️ No hay contratos registrados.'));
            return menuContratos();
        }

        console.log(chalk.cyan.bold('\n📋 Contratos registrados:\n'));

        contratos.forEach((c, i) => {
            const proyecto = proyectosPorId[c.proyectoId];
            const cliente = proyecto ? clientesPorId[proyecto.clienteId] : 'Desconocido';

            console.log(chalk.bold(`#${i + 1}`));
            console.log(`📁 Proyecto: ${proyecto?.nombre || 'No encontrado'}`);
            console.log(`👤 Cliente: ${cliente}`);
            console.log(`📝 Condiciones: ${c.condiciones}`);
            console.log(`📆 Desde: ${new Date(c.fechaInicio).toLocaleDateString()}`);
            console.log(`📆 Hasta: ${new Date(c.fechaFin).toLocaleDateString()}`);
            console.log(`💰 Valor: $${c.valorTotal.toLocaleString()}`);
            console.log(chalk.gray('────────────────────────────────────────────\n'));
        });

        return menuContratos();
    }

    // Volver
    else {
        return;
    }
}

module.exports = menuContratos;