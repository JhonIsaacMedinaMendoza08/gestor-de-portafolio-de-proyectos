const inquirer = require('inquirer');
const chalk = require('chalk');
const { listarProyectos } = require('../services/proyectoService');
const { registrarIngreso } = require('../services/finanzasService');
const { registrarEgreso } = require('../services/finanzasService');
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
                '📤 Registrar egreso asociado a un proyecto',
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
    }
    else if (accion === '📤 Registrar egreso asociado a un proyecto') {
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
        const contrato = await db.collection('contratos').findOne({ proyectoId });
        let contratoId = contrato?._id || null;

        let saldo = Infinity;

        if (contrato) {
            const ingresos = await db.collection('finanzas').aggregate([
                { $match: { contratoId, tipo: 'ingreso' } },
                { $group: { _id: null, total: { $sum: '$monto' } } }
            ]).toArray();

            const egresos = await db.collection('finanzas').aggregate([
                { $match: { contratoId, tipo: 'egreso' } },
                { $group: { _id: null, total: { $sum: '$monto' } } }
            ]).toArray();

            const totalIngresado = ingresos[0]?.total || 0;
            const totalEgresado = egresos[0]?.total || 0;
            saldo = totalIngresado - totalEgresado;

            console.log(chalk.cyan.bold('\n📄 Estado financiero del proyecto:'));
            console.log(`💰 Total ingresado: $${totalIngresado.toLocaleString()}`);
            console.log(`💸 Total egresado: $${totalEgresado.toLocaleString()}`);
            console.log(`💵 Saldo disponible: $${saldo.toLocaleString()}\n`);
        } else {
            console.log(chalk.yellow('⚠️ Este proyecto no tiene contrato registrado.'));
            console.log(chalk.gray('🔔 Aún puedes registrar egresos, pero no se validará el saldo.\n'));
        }

        const { monto, descripcion } = await inquirer.prompt([
            {
                name: 'monto',
                message: 'Monto del egreso:',
                validate: val => !isNaN(val) && Number(val) > 0 || 'Debe ser un número positivo'
            },
            {
                name: 'descripcion',
                message: 'Descripción del egreso:',
                validate: val => val.trim().length >= 5 || 'Debe tener al menos 5 caracteres'
            }
        ]);

        try {
            await registrarEgreso({
                proyectoId,
                monto: Number(monto),
                descripcion
            });

            console.log(chalk.green('\n✅ Egreso registrado correctamente.\n'));

            // 🕒 Esperar a que Mongo termine de aplicar el cambio (opcional pero recomendable en CLI)
            await new Promise(resolve => setTimeout(resolve, 300)); // 300ms

            // 🔁 Recargar info actualizada desde la DB
            if (contratoId) {
                const ingresos = await db.collection('finanzas').aggregate([
                    { $match: { contratoId, tipo: 'ingreso' } },
                    { $group: { _id: null, total: { $sum: '$monto' } } }
                ]).toArray();

                const egresos = await db.collection('finanzas').aggregate([
                    { $match: { contratoId, tipo: 'egreso' } },
                    { $group: { _id: null, total: { $sum: '$monto' } } }
                ]).toArray();

                const totalIngresado = ingresos[0]?.total || 0;
                const totalEgresado = egresos[0]?.total || 0;
                const saldoFinal = totalIngresado - totalEgresado;

                console.log(chalk.blueBright('📊 Estado actualizado del proyecto:'));
                console.log(`💰 Total ingresado: $${totalIngresado.toLocaleString()}`);
                console.log(`💸 Total egresado: $${totalEgresado.toLocaleString()}`);
                console.log(`💵 Saldo disponible: $${saldoFinal.toLocaleString()}\n`);
            } else {
                console.log(chalk.gray('ℹ️ Estado actualizado omitido porque no hay contrato asociado.\n'));
            }

        } catch (err) {
            console.error(chalk.red(`\n${err.message}\n`));
        }

        return menuFinanzas();
    }



    else {
        return;
    }
}

module.exports = menuFinanzas;
