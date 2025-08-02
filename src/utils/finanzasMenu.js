const inquirer = require('inquirer');
const chalk = require('chalk');
const { listarProyectos } = require('../services/proyectoService');
const { registrarIngreso } = require('../services/finanzasService');
const { getDB } = require('../config/mongo');
const { ObjectId } = require('mongodb');



async function menuFinanzas() {
    const { accion } = await inquirer.prompt([
        {
            type: 'list',
            name: 'accion',
            message: '💰 Gestión financiera',
            choices: [
                'Registrar ingreso asociado a proyecto',
                '⬅️ Volver'
            ]
        }
    ]);

    if (accion === 'Registrar ingreso asociado a proyecto') {
        const proyectos = await listarProyectos();
        const { proyectoId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'proyectoId',
                message: 'Selecciona el proyecto:',
                choices: proyectos.map(p => ({ name: p.nombre, value: p._id.toString() }))
            }
        ]);

        const db = await getDB();
        const contrato = await db.collection('contratos').findOne({ proyectoId: new ObjectId(proyectoId) });

        if (!contrato) {
            console.log(chalk.red('❌ Este proyecto no tiene contrato registrado.'));
            return menuFinanzas();
        }

        const ingresosPrevios = await db.collection('finanzas').aggregate([
            {
                $match: {
                    proyectoId,
                    tipo: 'ingreso'
                }
            },
            {
                $group: {
                    _id: null,
                    totalIngresos: { $sum: '$monto' }
                }
            }
        ]).toArray();

        const totalIngresado = ingresosPrevios[0]?.totalIngresos || 0;
        const restante = contrato.valorTotal - totalIngresado;

        console.log(chalk.blue(`💰 Valor total del contrato: $${contrato.valorTotal.toLocaleString()}`));
        console.log(chalk.yellow(`💵 Saldo restante: $${restante.toLocaleString()}`));

        const datos = await inquirer.prompt([
            {
                name: 'monto',
                message: 'Monto del ingreso:',
                validate: val => !isNaN(val) && Number(val) > 0 || 'Debe ser un número positivo'
            },
            {
                name: 'descripcion',
                message: 'Descripción del ingreso:',
                validate: val => val.length >= 5 || 'Debe tener al menos 5 caracteres'
            }
        ]);
        try {
            await registrarIngreso({
                proyectoId,
                monto: Number(datos.monto),
                descripcion: datos.descripcion
            });
            console.log(chalk.green('✅ Ingreso registrado exitosamente.'));
        } catch (err) {
            console.error(chalk.red(err.message));
        }

        return menuFinanzas();
    }
}
module.exports = menuFinanzas;
