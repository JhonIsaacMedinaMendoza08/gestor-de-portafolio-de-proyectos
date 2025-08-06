const fs = require('fs');
const path = require('path');
const { getDB } = require('../config/mongo.js');
const { ObjectId } = require('mongodb');


async function generarReportePorCliente(clienteId) {
    const db = await getDB();
    const session = db.client.startSession();

    let contenidoFinal = '';
    let cliente = null;

    try {
        await session.withTransaction(async () => {

            // 🔍 Buscar cliente por ID con sesión activa
            cliente = await db.collection('clientes').findOne({ _id: new ObjectId(clienteId) }, { session });
            if (!cliente) {
                throw new Error("❌ Cliente no encontrado.");
            }

            // 📦 Buscar todos los proyectos asociados a ese cliente
            const proyectos = await db.collection('proyectos').find({ clienteId: clienteId }).toArray({ session });
            if (proyectos.length === 0) throw new Error('El cliente no tiene proyectos asociados');

            // 📝 Comenzar a construir contenido del reporte
            let contenido = `📄 Reporte financiero por cliente\n`;
            contenido += `Cliente: ${cliente.nombre} (${cliente.correo})\n`;
            contenido += `Teléfono: ${cliente.telefono}\n`;
            contenido += `\n──────────────────────────────\n`;

            for (const proyecto of proyectos) {

                // 🔗 Buscar contrato asociado al proyecto
                const contrato = await db.collection('contratos').findOne({ proyectoId: proyecto._id.toString() }, { session });

                let valorContrato = contrato?.valorTotal || 0;
                let contratoId = contrato?._id || null;

                let totalIngresado = 0;
                let totalEgresado = 0;

                // 💰 Si hay contrato, calcular ingresos y egresos totales asociados
                if (contratoId) {
                    const [ingresos, egresos] = await Promise.all([
                        db.collection('finanzas').aggregate([
                            { $match: { contratoId, tipo: 'ingreso' } },
                            { $group: { _id: null, total: { $sum: '$monto' } } }
                        ], { session }).toArray(),
                        db.collection('finanzas').aggregate([
                            { $match: { contratoId, tipo: 'egreso' } },
                            { $group: { _id: null, total: { $sum: '$monto' } } }
                        ], { session }).toArray()
                    ]);

                    totalIngresado = ingresos[0]?.total || 0;
                    totalEgresado = egresos[0]?.total || 0;
                }

                // 📌 Agregar información del proyecto al reporte
                contenido += `📌 Proyecto: ${proyecto.nombre}\n`;
                contenido += `• Valor del contrato: $${valorContrato.toLocaleString()}\n`;
                contenido += `• Total ingresos:    $${totalIngresado.toLocaleString()}\n`;
                contenido += `• Total egresos:     $${totalEgresado.toLocaleString()}\n`;
                contenido += `• Balance neto:      $${(totalIngresado - totalEgresado).toLocaleString()}\n`;
                contenido += `──────────────────────────────\n`;
            }

            // ✔️ Guardar contenido final del reporte para escribir fuera de la transacción
            contenidoFinal = contenido;
        });

        // 🗂 Definir ruta y nombre del archivo a guardar
        const fileName = `reporte_cliente_${cliente.nombre.replace(/\s/g, '_')}.txt`;
        const filePath = path.join(__dirname, '../reportes', fileName);

        // 📁 Asegurarse de que exista la carpeta /reportes
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // 💾 Escribir el archivo .txt con el contenido generado
        fs.writeFileSync(filePath, contenidoFinal, 'utf8');
        return filePath;

    } catch (error) {
        console.error(error.message);
        throw error;

    } finally {
        // 🔚 Cerrar sesión de la transacción
        await session.endSession();
    }
};

async function generarReportePorProyecto(proyectoId) {
    const db = await getDB();
    const session = db.client.startSession();
    let contenidoFinal = '';

    let proyecto = null
    let contrato = null;



    try {
        await session.withTransaction(async () => {
            proyecto = await db.collection('proyectos').findOne({ _id: new ObjectId(proyectoId) }, { session });
            if (!proyecto) throw new Error('❌ Proyecto no encontrado');

            contrato = await db.collection('contratos').findOne({ proyectoId: proyecto._id.toString() }, { session });

            let valorContrato = 0;
            let totalIngresado = 0;
            let totalEgresado = 0;
            let contratoId = contrato?._id || null;

            if (contratoId) {
                valorContrato = contrato.valorTotal;

                const [ingresos, egresos] = await Promise.all([
                    db.collection('finanzas').aggregate([
                        { $match: { contratoId, tipo: 'ingreso' } },
                        { $group: { _id: null, total: { $sum: '$monto' } } }
                    ], { session }).toArray(),
                    db.collection('finanzas').aggregate([
                        { $match: { contratoId, tipo: 'egreso' } },
                        { $group: { _id: null, total: { $sum: '$monto' } } }
                    ], { session }).toArray()
                ]);
                totalIngresado = ingresos[0]?.total || 0;
                totalEgresado = egresos[0]?.total || 0;
            }

            const balance = totalIngresado - totalEgresado;

            const contenido = `
📄 REPORTE FINANCIERO POR PROYECTO
────────────────────────────────────────────
📌 Proyecto: ${proyecto.nombre}
🧾 Descripción: ${proyecto.descripcion}
👤 Cliente ID: ${proyecto.clienteId}

💼 Valor del contrato: $${valorContrato.toLocaleString()}
💰 Total ingresado: $${totalIngresado.toLocaleString()}
💸 Total egresado: $${totalEgresado.toLocaleString()}
📈 Balance: $${balance.toLocaleString()}
────────────────────────────────────────────
📅 Generado: ${new Date().toLocaleString()}
`;
            contenidoFinal = contenido;
        });
        const filePath = path.join(__dirname, '..', 'reportes');
        if (!fs.existsSync(filePath)) 
            fs.mkdirSync(filePath, { recursive: true });

        // Nombre del archivo
        const fileName = `reporte_proyecto_${proyecto.nombre.replace(/\s+/g, '_')}.txt`;
        const ruta = path.join(filePath, fileName);

        // Escribir archivo
        fs.writeFileSync(ruta, contenidoFinal.trim());

        return ruta;
    }
    catch (error) {
        console.error(error.message);
        throw error;
    } finally {
        await session.endSession();
    }

}

async function generarReportePorRangoFechas(fechaInicioStr, fechaFinStr) {
    const db = await getDB();

    // Iniciar una sesión para usar transacciones
    const session = db.client.startSession();

    // Convertir strings a objetos Date
    const fechaInicio = new Date(fechaInicioStr);
    const fechaFin = new Date(fechaFinStr);
    let contenidoFinal = ''; // Variable para acumular el contenido del reporte

    try {
        await session.withTransaction(async () => {
            // 🧪 Validar que las fechas sean correctas y en orden lógico
            if (isNaN(fechaInicio) || isNaN(fechaFin) || fechaInicio > fechaFin) {
                throw new Error('❌ Rango de fechas inválido.');
            }

            // 🔍 Buscar movimientos financieros dentro del rango de fechas
            const movimientos = await db.collection('finanzas').aggregate([
                {
                    $match: {
                        fecha: {
                            $gte: fechaInicio,
                            $lte: fechaFin
                        }
                    }
                },
                {
                    // Agrupar por proyecto y tipo (ingreso / egreso) para sumar montos
                    $group: {
                        _id: { proyectoId: "$proyectoId", tipo: "$tipo" },
                        total: { $sum: "$monto" }
                    }
                }
            ], { session }).toArray();

            // ⚠️ Si no hay movimientos en ese rango, lanzar error
            if (movimientos.length === 0) {
                throw new Error('⚠️ No hay movimientos financieros en ese rango de fechas.');
            }

            // 📊 Estructura para organizar ingresos y egresos por proyecto
            const resumenPorProyecto = {};

            // 📦 Clasificar y acumular montos por tipo (ingreso o egreso)
            for (const mov of movimientos) {
                const id = mov._id.proyectoId.toString();

                // Inicializar estructura si aún no existe
                if (!resumenPorProyecto[id]) {
                    resumenPorProyecto[id] = {
                        totalIngresado: 0,
                        totalEgresado: 0
                    };
                }

                // Acumular según el tipo
                if (mov._id.tipo === 'ingreso') {
                    resumenPorProyecto[id].totalIngresado = mov.total;
                } else if (mov._id.tipo === 'egreso') {
                    resumenPorProyecto[id].totalEgresado = mov.total;
                }
            }

            // 🔎 Obtener los nombres de los proyectos asociados a los IDs encontrados
            const ids = Object.keys(resumenPorProyecto).map(id => new ObjectId(id));
            const proyectos = await db.collection('proyectos')
                .find({ _id: { $in: ids } })
                .toArray();

            // 📝 Construir contenido del reporte en texto plano
            let contenido = `📄 REPORTE GENERAL POR RANGO DE FECHAS\n`;
            contenido += `Desde: ${fechaInicio.toLocaleDateString()}  Hasta: ${fechaFin.toLocaleDateString()}\n`;
            contenido += `────────────────────────────────────────────\n`;

            // Recorrer proyectos para mostrar su balance
            for (const proyecto of proyectos) {
                const resumen = resumenPorProyecto[proyecto._id.toString()];
                const balance = resumen.totalIngresado - resumen.totalEgresado;

                contenido += `📌 Proyecto: ${proyecto.nombre}\n`;
                contenido += `💰 Ingresos: $${resumen.totalIngresado.toLocaleString()}\n`;
                contenido += `💸 Egresos:  $${resumen.totalEgresado.toLocaleString()}\n`;
                contenido += `📈 Balance:  $${balance.toLocaleString()}\n`;
                contenido += `────────────────────────────────────────────\n`;
            }

            // Almacenar el contenido generado para usarlo fuera de la transacción
            contenidoFinal = contenido;

        });

        // 📁 Crear ruta y archivo .txt del reporte
        const fileName = `reporte_general_${Date.now()}.txt`;
        const filePath = path.join(__dirname, '../reportes', fileName);

        // Asegurarse de que exista la carpeta /reportes
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // ✍️ Escribir el contenido al archivo
        fs.writeFileSync(filePath, contenidoFinal.trim(), 'utf8');

        return filePath; // Devolver ruta del archivo generado

    } catch (error) {
        // Mostrar errores en consola y relanzarlos
        console.error(error.message);
        throw error;

    } finally {
        // Cerrar sesión de transacción
        await session.endSession();
    }
}

async function generarReporteUltimaSemana() {
    const hoy = new Date();
    const hace7Dias = new Date();
    hace7Dias.setDate(hoy.getDate() - 7);

    const fechaInicioStr = hace7Dias.toISOString().split('T')[0];
    const fechaFinStr = hoy.toISOString().split('T')[0];

    const pathOriginal = await generarReportePorRangoFechas(fechaInicioStr, fechaFinStr);

    // Renombrar el archivo a algo más claro
    const nuevoNombre = `reporte_semanal_${Date.now()}.txt`;
    const nuevoPath = path.join(path.dirname(pathOriginal), nuevoNombre);

    fs.renameSync(pathOriginal, nuevoPath);

    return nuevoPath;
}

async function generarReporteUltimoMes() {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);

    const fechaInicioStr = hace30Dias.toISOString().split('T')[0];
    const fechaFinStr = hoy.toISOString().split('T')[0];

    const pathOriginal = await generarReportePorRangoFechas(fechaInicioStr, fechaFinStr);

    // Renombrar el archivo a algo más claro
    const nuevoNombre = `reporte_mensual_${Date.now()}.txt`;
    const nuevoPath = path.join(path.dirname(pathOriginal), nuevoNombre);

    fs.renameSync(pathOriginal, nuevoPath);

    return nuevoPath;
}
module.exports = {
    generarReportePorCliente,
    generarReportePorProyecto,
    generarReportePorRangoFechas,
    generarReporteUltimaSemana,
    generarReporteUltimoMes
};





// ## ✍️ Escritura de archivos
// - **fs.writeFile()**  
//   Crea o sobrescribe un archivo de forma asíncrona.
// - **fs.writeFileSync()**  
//   Crea o sobrescribe un archivo de forma sincrónica.
// - **fs.appendFile()**  
//   Agrega contenido al final de un archivo de forma asíncrona.
// - **fs.appendFileSync()**  
//   Agrega contenido al final de un archivo de forma sincrónica.
// ---

// ## 📖 Lectura de archivos
// - **fs.readFile()**  
//   Lee el contenido de un archivo de forma asíncrona.
// - **fs.readFileSync()**  
//   Lee el contenido de un archivo de forma sincrónica.
// ---

// ## ❌ Eliminación de archivos
// - **fs.unlink()**  
//   Elimina un archivo de forma asíncrona.
// - **fs.unlinkSync()**  
//   Elimina un archivo de forma sincrónica.
// ---

// ## 🧭 Verificación
// - **fs.existsSync()**  
//   Verifica si un archivo o directorio existe (solo versión sincrónica).
// ---
// ## 🗂️ Directorios
// - **fs.mkdir()**  
//   Crea un directorio de forma asíncrona.
// - **fs.mkdirSync()**  
//   Crea un directorio de forma sincrónica.
// - **fs.readdir()**  
//   Lista los archivos de un directorio de forma asíncrona.
// - **fs.readdirSync()**  
//   Lista los archivos de un directorio de forma sincrónica.
// ---
// ## ✏️ Otros
// - **fs.rename()**  
//   Cambia el nombre o mueve un archivo/directorio (asíncrono).
// - **fs.renameSync()**  
//   Cambia el nombre o mueve un archivo/directorio (sincrónico).