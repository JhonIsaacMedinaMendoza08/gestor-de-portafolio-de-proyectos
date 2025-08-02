const { getDB } = require('../config/mongo');
const { MovimientoFinanciero, ingresoSchema } = require('../models/ingresoModel');
const { MovimientoFinancieroEgreso, egresoSchema } = require('../models/egresoModel');
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

async function registrarEgreso(data) {
    const db = await getDB();
    const session = db.client.startSession();
    const ajv = new Ajv();
    addFormats(ajv);
    const validate = ajv.compile(egresoSchema);

    try {
        await session.withTransaction(async () => {
            const datosParaValidar = {
                ...data,
                tipo: 'egreso'
            };

            if (!validate(datosParaValidar)) {
                const errores = validate.errors.map(e => `• ${e.instancePath} ${e.message}`).join('\n');
                throw new Error(`❌ Datos inválidos:\n${errores}`);
            }

            const proyectoId = new ObjectId(data.proyectoId);
            let contratoId = null;

            const proyecto = await db.collection('proyectos').findOne({ _id: proyectoId }, { session });
            if (!proyecto) throw new Error('❌ Proyecto no encontrado.');

            const contrato = await db.collection('contratos').findOne({ proyectoId: data.proyectoId }, { session });
            let saldoDisponible = Infinity;

            if (contrato) {
                contratoId = contrato._id;

                const ingresos = await db.collection('finanzas').aggregate([
                    { $match: { contratoId, tipo: 'ingreso' } },
                    { $group: { _id: null, total: { $sum: '$monto' } } }
                ], { session }).toArray();

                const egresos = await db.collection('finanzas').aggregate([
                    { $match: { contratoId, tipo: 'egreso' } },
                    { $group: { _id: null, total: { $sum: '$monto' } } }
                ], { session }).toArray();

                const totalIngresado = ingresos[0]?.total || 0;
                const totalEgresado = egresos[0]?.total || 0;

                saldoDisponible = totalIngresado - totalEgresado;

                if (data.monto > saldoDisponible) {
                    throw new Error(`❌ El egreso supera el saldo disponible del proyecto. Disponible: $${saldoDisponible.toLocaleString()}`);
                }
            }

            const egreso = new MovimientoFinancieroEgreso({
                proyectoId,
                contratoId,
                descripcion: data.descripcion,
                monto: data.monto
            });

            await db.collection('finanzas').insertOne(egreso, { session });
        });

        return true;
    } finally {
        await session.endSession();
    }
}

async function consultarBalancePorCliente(clienteId) {
    const db = await getDB();

    const proyectos = await db.collection('proyectos')
        .find({ clienteId})
        .toArray();

    if (proyectos.length === 0) return [];

    const resumenes = [];

    for (const proyecto of proyectos) {
        const contrato = await db.collection('contratos').findOne({ proyectoId: proyecto._id.toString() });
        
        let totalIngresado = 0;
        let totalEgresado = 0;
        let contratoId = null;
        let valorContrato = 0;

        if (contrato) {
            contratoId = contrato._id;
            valorContrato = contrato.valorTotal;

            const ingresos = await db.collection('finanzas').aggregate([
                { $match: { contratoId, tipo: 'ingreso' } },
                { $group: { _id: null, total: { $sum: '$monto' } } }
            ]).toArray();

            const egresos = await db.collection('finanzas').aggregate([
                { $match: { contratoId, tipo: 'egreso' } },
                { $group: { _id: null, total: { $sum: '$monto' } } }
            ]).toArray();

            totalIngresado = ingresos[0]?.total || 0;
            totalEgresado = egresos[0]?.total || 0;
        }

        resumenes.push({
            nombreProyecto: proyecto.nombre,
            valorContrato,
            totalIngresado,
            totalEgresado,
            balance: totalIngresado - totalEgresado
        });
    }

    return resumenes;
}

async function listarTodasLasOperaciones() {
    const db = await getDB();

    const movimientos = await db.collection('finanzas').aggregate([
        {
            $lookup: {
                from: 'proyectos',
                localField: 'proyectoId',
                foreignField: '_id',
                as: 'proyecto'
            }
        },
        {
            $unwind: {
                path: '$proyecto',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $sort: {
                fecha: -1
            }
        },
        {
            $project: {
                _id: 0,
                fecha: 1,
                tipo: 1,
                descripcion: 1,
                monto: 1,
                nombreProyecto: '$proyecto.nombre'
            }
        }
    ]).toArray();

    return movimientos;
}

module.exports = {
    registrarIngreso,
    registrarEgreso,
    consultarBalancePorCliente,
    listarTodasLasOperaciones
};
