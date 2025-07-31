class Entregable {
    constructor({ proyectoId, nombre, descripcion, fechaLimite }) {
        this.proyectoId = proyectoId;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.fechaLimite = fechaLimite;
        this.estado = 'pendiente';
        this.createdAt = new Date();
    }
}

const entregableSchema = {
    type: 'object',
    properties: {
        proyectoId: { type: 'string', minLength: 10 },
        nombre: { type: 'string', minLength: 5 },
        descripcion: { type: 'string', minLength: 10 },
        fechaLimite: { type: 'string', format: 'date' },
        estado: { type: 'string', enum: ['pendiente'] }
    },
    required: ['proyectoId', 'nombre', 'descripcion', 'fechaLimite'],
    additionalProperties: false
};

module.exports = { Entregable, entregableSchema };
