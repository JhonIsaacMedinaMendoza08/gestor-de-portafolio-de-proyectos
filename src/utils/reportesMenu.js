const inquirer = require('inquirer');
const { listarClientes } = require('../services/clienteServices.js');
const { listarProyectos } = require('../services/proyectoService.js');
const { generarReportePorCliente, 
    generarReportePorProyecto, 
    generarReportePorRangoFechas, 
    generarReporteUltimaSemana,
    generarReporteUltimoMes,
    generarReportePorClienteJSON } = require('../services/reporteService.js');
const chalk = require('chalk');

async function menuReportes() {
    console.log(chalk.blue('\n📊 Generación de Reportes\n'));

    const { tipoReporte } = await inquirer.prompt([
        {
            type: 'list',
            name: 'tipoReporte',
            message: '🗂 ¿Qué tipo de reporte deseas generar?',
            choices: [
                '📁 Reporte por cliente',
                '📁 Reporte por proyecto',
                '📁 Reporte por rango de fechas',
                '📁 Reporte de la última semana',
                '📁 Reporte del último mes',
                '📁 Reporte JSON CLIENTE',

                '⬅️ Volver'
            ]
        }
    ]);

    // 📁 Reporte por cliente
    if (tipoReporte === '📁 Reporte por cliente') {
        const clientes = await listarClientes();

        if (clientes.length === 0) {
            console.log(chalk.yellow('⚠️ No hay clientes registrados.'));
            return menuReportes();
        }

        const { clienteId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'clienteId',
                message: 'Selecciona un cliente:',
                choices: clientes.map(c => ({
                    name: `${c.nombre} (${c.correo})`,
                    value: c._id.toString()
                }))
            }
        ]);

        try {
            const pathArchivo = await generarReportePorCliente(clienteId);
            console.log(chalk.green(`\n✅ Reporte generado correctamente: ${pathArchivo}\n`));
        } catch (err) {
            console.error(chalk.red(`\n❌ Error: ${err.message}\n`));
        }

        return menuReportes(); // <-- vuelve al menú tras generar reporte
    }

    // 📁 Reporte por proyecto
    if (tipoReporte === '📁 Reporte por proyecto') {
        const proyectos = await listarProyectos();

        if (proyectos.length === 0) {
            console.log(chalk.yellow('⚠️ No hay proyectos disponibles.'));
            return menuReportes();
        }

        const { proyectoId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'proyectoId',
                message: 'Selecciona el proyecto:',
                choices: proyectos.map(p => ({
                    name: p.nombre,
                    value: p._id.toString()
                }))
            }
        ]);

        try {
            const ruta = await generarReportePorProyecto(proyectoId);
            console.log(chalk.green(`✅ Reporte generado correctamente en: ${ruta}`));
        } catch (err) {
            console.error(chalk.red(`\n❌ Error al generar el reporte:\n${err.message}\n`));
        }

        return menuReportes(); // <-- vuelve al menú tras generar reporte
    }
    // 📁 Reporte por rango de fecha
    if (tipoReporte === '📁 Reporte por rango de fechas') {
        const { fechaInicio, fechaFin } = await inquirer.prompt([
            {
                name: 'fechaInicio',
                message: '📅 Fecha de inicio (YYYY-MM-DD):',
                validate: val => /^\d{4}-\d{2}-\d{2}$/.test(val) || 'Formato inválido'
            },
            {
                name: 'fechaFin',
                message: '📅 Fecha de fin (YYYY-MM-DD):',
                validate: val => /^\d{4}-\d{2}-\d{2}$/.test(val) || 'Formato inválido'
            }
        ]);

        try {
            const ruta = await generarReportePorRangoFechas(fechaInicio, fechaFin);
            console.log(chalk.green(`✅ Reporte generado correctamente en: ${ruta}\n`));
        } catch (err) {
            console.error(chalk.red(`\n❌ Error al generar el reporte:\n${err.message}\n`));
        }

        return menuReportes(); // vuelve al menú
    }
    // 📁 Reporte de la última seman
    if (tipoReporte === '📁 Reporte de la última semana') {
        try {
            const path = await generarReporteUltimaSemana();
            console.log(chalk.green(`\n✅ Reporte de la última semana generado en: ${path}\n`));
        } catch (err) {
            console.error(chalk.red(`\n❌ Error al generar el reporte:\n${err.message}\n`));
        }
        return menuReportes();
    }
    if (tipoReporte === '📁 Reporte del último mes') {
        try {
            const path = await generarReporteUltimoMes();
            console.log(chalk.green(`\n✅ Reporte del último mes generado en: ${path}\n`));
        } catch (err) {
            console.error(chalk.red(`\n❌ Error al generar el reporte:\n${err.message}\n`));
        }
        return menuReportes();
    }


    // 📁 Reporte por cliente
    if (tipoReporte === '📁 Reporte JSON CLIENTE') {
        const clientes = await listarClientes();

        if (clientes.length === 0) {
            console.log(chalk.yellow('⚠️ No hay clientes registrados.'));
            return menuReportes();
        }

        const { clienteId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'clienteId',
                message: 'Selecciona un cliente:',
                choices: clientes.map(c => ({
                    name: `${c.nombre} (${c.correo})`,
                    value: c._id.toString()
                }))
            }
        ]);

        try {
            const pathArchivo = await generarReportePorClienteJSON(clienteId);
            console.log(chalk.green(`\n✅ Reporte generado correctamente: ${pathArchivo}\n`));
        } catch (err) {
            console.error(chalk.red(`\n❌ Error: ${err.message}\n`));
        }

        return menuReportes(); // <-- vuelve al menú tras generar reporte
    }


    // ⬅️ Volver
    if (tipoReporte === '⬅️ Volver') {
        return;
    }
}

module.exports = menuReportes;
