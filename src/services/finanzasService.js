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
        const resultado = await session.withTransaction(async () => {
            if (!validate({ ...data, tipo: "ingreso" })) {
                const errores = validate.errors.map(e => `• ${e.instancePath} ${e.message}`).join('\n');
                throw new Error(`❌ Datos inválidos:\n${errores}`);
            }

            const proyecto = await db.collection('proyectos').findOne(
                { _id: new ObjectId(data.proyectoId) },
                { session }
            );
            if (!proyecto) throw new Error('❌ Proyecto no encontrado.');

            const contrato = await db.collection('contratos').findOne(
                { proyectoId: new ObjectId(data.proyectoId) },
                { session }
            );
            if (!contrato) throw new Error('❌ Este proyecto no tiene contrato asociado.');

            const ingresosPrevios = await db.collection('finanzas').aggregate([
                {
                    $match: {
                        proyectoId: data.proyectoId,
                        tipo: 'ingreso'
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalIngresos: { $sum: '$monto' }
                    }
                }
            ], { session }).toArray();

            const totalIngresado = ingresosPrevios[0]?.totalIngresos || 0;
            const restante = contrato.valorTotal - totalIngresado;

            if (data.monto > restante) {
                throw new Error(`❌ El ingreso supera el monto restante del contrato. Restante: $${restante.toLocaleString()}`);
            }

            const ingreso = new MovimientoFinanciero(data);
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
