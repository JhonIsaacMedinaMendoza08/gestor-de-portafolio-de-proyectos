const inquirer = require('inquirer');
const chalk = require('chalk');
const { listarProyectos } = require('../services/proyectoService');
const { registrarIngreso } = require('../services/finanzasService');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongo');

async function menuFinanzas() {
    const { accion } = await inquirer.prompt([
        {
            type: 'list',
            name: 'accion',
            message: '💰 Finanzas - Selecciona una acción:',
            choices: [
                '💸 Registrar ingreso asociado a un proyecto',
                '⬅️ Volver'
            ]
        }
    ]);

    if (accion === '💸 Registrar ingreso asociado a un proyecto') {
        const proyectos = await listarProyectos();

        if (proyectos.length === 0) {
            console.log(chalk.yellow('⚠️ No hay proyectos disponibles.'));
            return menuFinanzas();
        }

        const { proyectoId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'proyectoId',
                message: 'Selecciona el proyecto:',
                choices: proyectos.map((p, i) => ({
                    name: `${i + 1}. ${p.nombre}`,
                    value: p._id.toString()
                }))
            }
        ]);

        const db = await getDB();

        // Buscar contrato usando el proyectoId como STRING
        const contrato = await db.collection('contratos').findOne({ proyectoId });

        if (contrato) {
            const ingresos = await db.collection('finanzas').aggregate([
                { $match: { contratoId: contrato._id } },
                { $group: { _id: null, total: { $sum: '$monto' } } }
            ]).toArray();

            const totalIngresado = ingresos[0]?.total || 0;
            const restante = contrato.valorTotal - totalIngresado;

            console.log(chalk.cyan.bold('\n📄 Detalles del contrato:'));
            console.log(`💰 Valor total del contrato: $${contrato.valorTotal.toLocaleString()}`);
            console.log(`💵 Saldo restante: $${restante.toLocaleString()}\n`);
        } else {
            console.log(chalk.yellow('⚠️ Este proyecto no tiene contrato registrado.'));
            console.log(chalk.gray('🔔 Aún puedes registrar ingresos, pero no se podrá calcular el saldo restante.\n'));
        }

        const { monto, descripcion } = await inquirer.prompt([
            {
                name: 'monto',
                message: 'Monto del ingreso:',
                validate: val => !isNaN(val) && Number(val) > 0 || 'Debe ser un número positivo'
            },
            {
                name: 'descripcion',
                message: 'Descripción del ingreso:',
                validate: val => val.trim().length >= 5 || 'Debe tener al menos 5 caracteres'
            }
        ]);

        try {
            await registrarIngreso({
                proyectoId,
                monto: Number(monto),
                descripcion
            });
            console.log(chalk.green('\n✅ Ingreso registrado correctamente.\n'));
        } catch (err) {
            console.error(chalk.red(`\n${err.message}\n`));
        }

        return menuFinanzas();
    } else {
        return;
    }
}

module.exports = menuFinanzas;
