const { getDB } = require('../config/mongo');
const { MovimientoFinanciero, ingresoSchema } = require('../models/ingresoModel');
const { ObjectId } = require('mongodb');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv();
addFormats(ajv);
const validate = ajv.compile(ingresoSchema);

async function registrarIngreso(data) {
    const db = await getDB();
    const session = db.client.startSession();

    try {
        await session.withTransaction(async () => {
            const proyectoId = new ObjectId(data.proyectoId);

            // 1. Validación previa sin contratoId
            const datosParaValidar = {
                proyectoId: data.proyectoId,
                descripcion: data.descripcion,
                monto: data.monto,
                tipo: 'ingreso'
            };

            if (!validate(datosParaValidar)) {
                const errores = validate.errors.map(e => `• ${e.instancePath} ${e.message}`).join('\n');
                throw new Error(`❌ Datos inválidos:\n${errores}`);
            }

            // 2. Verificar existencia de proyecto
            const proyecto = await db.collection('proyectos').findOne({ _id: proyectoId }, { session });
            if (!proyecto) {
                throw new Error('❌ Proyecto no encontrado.');
            }

            // 3. Buscar contrato
            let contratoId = null;
            const contrato = await db.collection('contratos').findOne({ proyectoId: data.proyectoId }, { session });

            if (contrato) {
                contratoId = contrato._id;

                const ingresosPrevios = await db.collection('finanzas').aggregate([
                    { $match: { contratoId: contrato._id, tipo: 'ingreso' } },
                    { $group: { _id: null, total: { $sum: '$monto' } } }
                ], { session }).toArray();

                const totalIngresado = ingresosPrevios[0]?.total || 0;
                const restante = contrato.valorTotal - totalIngresado;

                if (data.monto > restante) {
                    throw new Error(`❌ El ingreso supera el saldo restante. Disponible: $${restante.toLocaleString()}`);
                }
            }

            // 4. Crear ingreso
            const ingreso = new MovimientoFinanciero({
                proyectoId: new ObjectId(data.proyectoId),
                contratoId,  // ✅ se añade explícitamente
                descripcion: data.descripcion,
                monto: data.monto
            });

            await db.collection('finanzas').insertOne(ingreso, { session });
        });

        return true;

    } finally {
        await session.endSession();
    }
}

module.exports = {
    registrarIngreso
};
