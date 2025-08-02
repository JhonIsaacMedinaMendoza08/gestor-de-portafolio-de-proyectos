class Cliente {
    constructor({ nombre, correo, telefono, tipo }) {
        this.nombre = nombre;
        this.correo = correo;
        this.telefono = telefono;
        this.tipo = tipo;
        this.createAt = new Date();
    }
}

const clienteSchema = {
    type: 'object',
    properties: {
        nombre: { type: 'string', minLength: 3 },
        correo: { type: 'string', format: 'email' },
        telefono: { type: 'string', minLength: 7 },
        tipo: { type: 'string', enum: ['empresa', 'independiente'] }
    },
    required: ['nombre', 'correo', 'telefono', 'tipo'],
    additionalProperties: false
};

module.exports = { Cliente, clienteSchema };