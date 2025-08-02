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
                '📊 Consultar balance financiero por cliente',
                '📚 Listar todas las operaciones financieras',
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
    else if (accion === '📊 Consultar balance financiero por cliente') {
        const clientes = await require('../services/clienteServices').listarClientes();

        if (clientes.length === 0) {
            console.log(chalk.yellow('⚠️ No hay clientes registrados.'));
            return menuFinanzas();
        }

        const { clienteId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'clienteId',
                message: 'Selecciona el cliente:',
                choices: clientes.map(c => ({ name: `${c.nombre} (${c.correo})`, value: c._id.toString() }))
            }
        ]);

        const resumenes = await require('../services/finanzasService.js').consultarBalancePorCliente(clienteId);


        if (resumenes.length === 0) {
            console.log(chalk.yellow('\n⚠️ Este cliente no tiene proyectos ni movimientos financieros.\n'));
            return menuFinanzas();
        }

        console.log(chalk.cyan.bold('\n📊 Balance financiero por proyecto:\n'));

        resumenes.forEach((r, i) => {
            console.log(chalk.bold(`#${i + 1} ${r.nombreProyecto}`));
            console.log(`💼 Valor del contrato: $${r.valorContrato.toLocaleString()}`);
            console.log(`💰 Total ingresado: $${r.totalIngresado.toLocaleString()}`);
            console.log(`💸 Total egresado: $${r.totalEgresado.toLocaleString()}`);
            console.log(`📈 Balance neto: $${(r.balance).toLocaleString()}`);
            console.log(chalk.gray('────────────────────────────────────────────\n'));
        });

        return menuFinanzas();
    }
    else if (accion === '📚 Listar todas las operaciones financieras') {
        const operaciones = await require('../services/finanzasService').listarTodasLasOperaciones();

        if (operaciones.length === 0) {
            console.log(chalk.yellow('\n⚠️ No hay movimientos financieros registrados.\n'));
            return menuFinanzas();
        }

        console.log(chalk.cyan.bold('\n📚 Historial de operaciones financieras:\n'));

        operaciones.forEach((op, i) => {
            const fecha = new Date(op.fecha).toLocaleString();
            const tipo = op.tipo === 'ingreso' ? '💰 Ingreso' : '📤 Egreso';
            const proyecto = op.nombreProyecto || 'Sin proyecto';

            console.log(`${chalk.bold(`#${i + 1}`)} — ${fecha}`);
            console.log(`${tipo} - ${chalk.green(`$${op.monto.toLocaleString()}`)}`);
            console.log(`📄 Descripción: ${op.descripcion}`);
            console.log(`📁 Proyecto: ${proyecto}`);
            console.log(chalk.gray('────────────────────────────────────────────\n'));
        });

        return menuFinanzas();
    }

    else {
        return;
    }
}

module.exports = menuFinanzas;
