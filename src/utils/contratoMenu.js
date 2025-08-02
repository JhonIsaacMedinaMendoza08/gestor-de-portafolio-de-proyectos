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
        const contratosExistentes = await listarContratos();
        const proyectosConContrato = contratosExistentes.map(c => c.proyectoId);
        const sinContrato = proyectos.filter(p => !proyectosConContrato.includes(p._id.toString()));

        if (sinContrato.length === 0) {
            console.log(chalk.yellow('⚠️ No hay proyectos disponibles para crear contrato.'));
            return menuContratos();
        }

        const { proyectoId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'proyectoId',
                message: 'Selecciona el proyecto:',
                choices: sinContrato.map(p => ({ name: p.nombre, value: p._id.toString() }))
            }
        ]);

        const datos = await inquirer.prompt([
            {
                name: 'condiciones',
                message: 'Condiciones del contrato:',
                validate: val => val.length >= 15 || 'Debe tener al menos 15 caracteres'
            },
            {
                name: 'fechaInicio',
                message: 'Fecha de inicio (YYYY-MM-DD):',
                validate: val => /^\d{4}-\d{2}-\d{2}$/.test(val)
            },
            {
                name: 'fechaFin',
                message: 'Fecha de fin (YYYY-MM-DD):',
                validate: val => /^\d{4}-\d{2}-\d{2}$/.test(val)
            },
            {
                name: 'valorTotal',
                message: 'Valor total del contrato:',
                validate: val => !isNaN(val) && Number(val) > 0
            },
            {
                type: 'list',
                name: 'formaPago',
                message: 'Forma de pago:',
                choices: ['anticipo', 'contraentrega', 'por hitos', 'mensual']
            },
            {
                name: 'moneda',
                message: 'Moneda (ej: COP, USD, EUR):',
                validate: val => /^[A-Z]{3}$/.test(val)
            },
            {
                name: 'penalizacionPorRetraso',
                message: 'Penalización por retraso (opcional):',
                default: ''
            },
            {
                name: 'notasAdicionales',
                message: 'Notas adicionales (opcional):',
                default: '',
                validate: val => val.length <= 500
            }
        ]);

        try {
            await crearContrato({
                proyectoId,
                condiciones: datos.condiciones,
                fechaInicio: datos.fechaInicio,
                fechaFin: datos.fechaFin,
                valorTotal: Number(datos.valorTotal),
                formaPago: datos.formaPago,
                moneda: datos.moneda,
                penalizacionPorRetraso: datos.penalizacionPorRetraso || undefined,
                notasAdicionales: datos.notasAdicionales || undefined
            });
            console.log(chalk.green('✅ Contrato creado exitosamente.'));
        } catch (err) {
            console.error(chalk.red(err.message));
        }

        return menuContratos();
    }

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
        console.log(`💰 Valor total: $${contrato.valorTotal.toLocaleString()} ${contrato.moneda}`);
        console.log(`💳 Forma de pago: ${contrato.formaPago}`);
        if (contrato.penalizacionPorRetraso) console.log(`⚠️ Penalización por retraso: ${contrato.penalizacionPorRetraso}`);
        if (contrato.notasAdicionales) console.log(`📝 Notas adicionales: ${contrato.notasAdicionales}`);
        console.log(chalk.gray('────────────────────────────────────────────\n'));

        return menuContratos();
    }

    else if (accion === '📄 Listar todos los contratos') {
        const contratos = await listarContratos();
        const proyectos = await listarProyectos();
        const clientes = await listarClientes();

        if (contratos.length === 0) {
            console.log(chalk.yellow('⚠️ No hay contratos registrados.'));
        } else {
            contratos.forEach((contrato, i) => {
                const proyecto = proyectos.find(p => p._id.toString() === contrato.proyectoId);
                const cliente = clientes.find(c => c._id.toString() === proyecto?.clienteId);

                console.log(`\n📄 Contrato #${i + 1}`);
                console.log(`📁 Proyecto: ${proyecto?.nombre || 'Desconocido'}`);
                console.log(`👤 Cliente: ${cliente?.nombre || 'Desconocido'}`);
                console.log(`📝 Condiciones: ${contrato.condiciones}`);
                console.log(`📆 Inicio: ${new Date(contrato.fechaInicio).toLocaleDateString()}`);
                console.log(`📆 Fin: ${new Date(contrato.fechaFin).toLocaleDateString()}`);
                console.log(`💰 Valor total: $${contrato.valorTotal.toLocaleString()} ${contrato.moneda}`);
                console.log(`💳 Forma de pago: ${contrato.formaPago}`);
                if (contrato.penalizacionPorRetraso) console.log(`⚠️ Penalización por retraso: ${contrato.penalizacionPorRetraso}`);
                if (contrato.notasAdicionales) console.log(`📝 Notas adicionales: ${contrato.notasAdicionales}`);
                console.log(chalk.gray('────────────────────────────────────────────\n'));
            });
        }

        return menuContratos();
    }

    else {
        return;
    }
}

module.exports = menuContratos;
