class MovimientoFinancieroEgreso {
    constructor({ proyectoId, contratoId = null, descripcion, monto }) {
        this.proyectoId = proyectoId;
        this.contratoId = contratoId;
        this.descripcion = descripcion;
        this.monto = monto;
        this.tipo = 'egreso';
        this.fecha = new Date();
    }
}

const egresoSchema = {
    type: 'object',
    properties: {
        proyectoId: { type: 'string', minLength: 10 },
        descripcion: { type: 'string', minLength: 5 },
        monto: { type: 'number', exclusiveMinimum: 0 },
        tipo: { type: 'string', enum: ['egreso'] }
    },
    required: ['proyectoId', 'descripcion', 'monto', 'tipo'],
    additionalProperties: false
};

module.exports = { MovimientoFinancieroEgreso, egresoSchema };
