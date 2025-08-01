class MovimientoFinanciero {
    constructor({ proyectoId, descripcion, monto }) {
        this.proyectoId = proyectoId;
        this.descripcion = descripcion;
        this.monto = monto;
        this.tipo = 'ingreso';
        this.fecha = new Date();
    }
}

const ingresoSchema = {
    type: 'object',
    properties: {
        proyectoId: { type: 'string', minLength: 10 },
        descripcion: { type: 'string', minLength: 5 },
        monto: { type: 'number', exclusiveMinimum: 0 },
        tipo: { type: 'string', enum: ['ingreso'] }
    },
    required: ['proyectoId', 'descripcion', 'monto', 'tipo'],
    additionalProperties: false
};
module.exports = { MovimientoFinanciero, ingresoSchema };