const inquirer = require('inquirer');
const menuCliente = require('./src/menus/clienteMenu');
const menuPropuestas = require('./src/menus/propuestaMenu.js');
const connectDB = require('./src/config/mongo'); // asegúrate de tenerlo

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
        case '🚪 Salir':
            console.log('\n👋 ¡Gracias por usar el Gestor de Portafolio!\n');
            process.exit(0);
    }

    await inquirer.prompt([{ type: 'input', name: 'continuar', message: '\nPresiona ENTER para volver al menú principal...' }]);
    await mostrarMenuPrincipal();
}

mostrarMenuPrincipal();
