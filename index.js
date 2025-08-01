const inquirer = require('inquirer');
const menuCliente = require('./src/utils/clienteMenu');
const menuPropuestas = require('./src/utils/propuestaMenu.js');
const menuProyectos = require('./src/utils/proyectoMenu.js');
const menuContratos = require('./src/utils/contratoMenu.js');
const menuEntregables = require('./src/utils/entregableMenu.js');
const menuFinanzas = require('./src/utils/finanzasMenu.js');


async function mostrarMenuPrincipal() {
    console.clear();
    console.log('\n===========================================');
    console.log('  BIENVENIDO GESTIÓN DE PORTAFOLIO - SISTEMA');
    console.log('===========================================\n');

    const { opcion } = await inquirer.prompt([
        {
            type: 'list',
            name: 'opcion',
            message: '📦 ¿Qué deseas hacer?',
            choices: [
                '📂 Gestionar clientes',
                '📝 Gestionar propuestas',
                '📁 Gestionar proyectos',
                '📜 Gestionar contratos',
                '🚀 Gestionar Entregables',
                '💰 Gestion Financiera',

                '🚪 Salir'
            ]
        }
    ]);

    switch (opcion) {
        case '📂 Gestionar clientes':
            await menuCliente();
            break;
        case '📝 Gestionar propuestas':
            await menuPropuestas();
            break;
        case '📁 Gestionar proyectos':
            await menuProyectos();
            break;
        case '📜 Gestionar contratos':
            await menuContratos();
            break;
        case '🚀 Gestionar Entregables':
            await menuEntregables();
            break;
        case '💰 Gestion Financiera':
            await menuFinanzas();
            break;
        case '🚪 Salir':
            console.log('\n👋 ¡Gracias por usar el Gestor de Portafolio!\n');
            process.exit(0);
    }

    await inquirer.prompt([{ type: 'input', name: 'continuar', message: '\nPresiona ENTER para volver al menú principal...' }]);
    await mostrarMenuPrincipal();
}

mostrarMenuPrincipal();
