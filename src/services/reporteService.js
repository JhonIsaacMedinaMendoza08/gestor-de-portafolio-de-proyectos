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
            cliente = await db.collection('clientes').findOne({ _id: new ObjectId(clienteId) }, { session });
            if (!cliente) {
                throw new Error("❌ Cliente no encontrado.");
            }

            const proyectos = await db.collection('proyectos').find({ clienteId: clienteId }).toArray({ session });
            if (proyectos.length === 0) throw new Error('El cliente no tiene proyectos asociados');

            let contenido = `📄 Reporte financiero por cliente\n`;
            contenido += `Cliente: ${cliente.nombre} (${cliente.correo})\n`;
            contenido += `Teléfono: ${cliente.telefono}\n`;
            contenido += `\n──────────────────────────────\n`;

            for (const proyecto of proyectos) {
                const contrato = await db.collection('contratos').findOne({ proyectoId: proyecto._id.toString() }, { session });

                let valorContrato = contrato?.valorTotal || 0;
                let contratoId = contrato?._id || null;

                let totalIngresado = 0;
                let totalEgresado = 0;

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
                contenido += `📌 Proyecto: ${proyecto.nombre}\n`;
                contenido += `• Valor del contrato: $${valorContrato.toLocaleString()}\n`;
                contenido += `• Total ingresos:    $${totalIngresado.toLocaleString()}\n`;
                contenido += `• Total egresos:     $${totalEgresado.toLocaleString()}\n`;
                contenido += `• Balance neto:      $${(totalIngresado - totalEgresado).toLocaleString()}\n`;
                contenido += `──────────────────────────────\n`;
            }
            contenidoFinal = contenido;
        });

        const fileName = `reporte_cliente_${cliente.nombre.replace(/\s/g, '_')}.txt`;
        const filePath = path.join(__dirname, '../reportes', fileName);

        // Asegurar que exista la carpeta /reportes
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        fs.writeFileSync(filePath, contenidoFinal, 'utf8');
        return filePath;


    }
    catch (error) {
        console.error(error.message);
        throw error;
    } finally {
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
            proyecto = await db.collection('proyectos').findOne({ _id: new ObjectId(proyectoId) }, { session});
            if (!proyecto) throw new Error('❌ Proyecto no encontrado');

            contrato = await db.collection('contratos').findOne({ proyectoId: proyecto._id.toString() }, { session});

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
                    ], { session}).toArray(),
                    db.collection('finanzas').aggregate([
                        { $match: { contratoId, tipo: 'egreso' } },
                        { $group: { _id: null, total: { $sum: '$monto' } } }
                    ], { session}).toArray()
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
            if (!fs.existsSync(filePath)) fs.mkdirSync(filePath, { recursive: true });

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


module.exports = {
    generarReportePorCliente,
    generarReportePorProyecto
};
