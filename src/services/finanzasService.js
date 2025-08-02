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
            // Preparar datos para validación
            const datosParaValidar = {
                ...data,
                tipo: 'ingreso'
            };

            // Validar estructura de datos
            if (!validate(datosParaValidar)) {
                const errores = validate.errors.map(e => `• ${e.instancePath} ${e.message}`).join('\n');
                throw new Error(`❌ Datos inválidos:\n${errores}`);
            }

            // Convertir ID para uso interno
            const proyectoId = new ObjectId(data.proyectoId);
            const proyectoIdStr = data.proyectoId; // string para comparación con contrato
            let contratoId = null;

            // Verificar que el proyecto exista
            const proyecto = await db.collection('proyectos').findOne({ _id: proyectoId }, { session });
            if (!proyecto) {
                throw new Error('❌ Proyecto no encontrado.');
            }

            // Buscar contrato asociado (comparando contra string)
            const contrato = await db.collection('contratos').findOne({ proyectoId: proyectoIdStr }, { session });
            if (contrato) {
                contratoId = contrato._id;

                const ingresosPrevios = await db.collection('finanzas').aggregate([
                    {
                        $match: {
                            contratoId: contrato._id,
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
                    throw new Error(`❌ El ingreso supera el saldo restante del contrato. Disponible: $${restante.toLocaleString()}`);
                }
            }

            // Crear ingreso con o sin contrato asociado
            const ingreso = new MovimientoFinanciero({
                proyectoId,
                contratoId,
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
