class Propuesta {
    constructor({ clienteId, descripcion, precio, plazoDias, tecnologias, tipoTrabajo }) {
        this.clienteId = clienteId;
        this.descripcion = descripcion;
        this.precio = precio;
        this.plazoDias = plazoDias;
        this.tecnologias = tecnologias;
        this.tipoTrabajo = tipoTrabajo;
        this.estado = 'pendiente';
        this.createdAt = new Date();
    }
}

const propuestaSchema = {
    type: "object",
    properties: {
        clienteId: { type: "string", minLength: 10 },
        descripcion: { type: "string", minLength: 10 },
        precio: { type: "number", minimum: 1 },
        plazoDias: { type: "number", minimum: 1 },
        tecnologias: {
            type: "array",
            items: { type: "string" },
            minItems: 1
        },
        tipoTrabajo: {
            type: "string",
            enum: ["frontend", "backend", "fullstack"]
        }
    },
    required: ["clienteId", "descripcion", "precio", "plazoDias", "tecnologias", "tipoTrabajo"],
    additionalProperties: false
};

module.exports = { Propuesta, propuestaSchema };
