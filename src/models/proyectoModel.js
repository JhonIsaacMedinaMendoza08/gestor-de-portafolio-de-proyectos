class Proyecto {
    constructor({ clienteId, nombre, descripcion, plazoDias, estado, propuestaId = null }) {
        this.clienteId = clienteId;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.plazoDias = plazoDias;
        this.estado = estado;
        this.propuestaId = propuestaId;
        this.createdAt = new Date();
    }
}

const proyectoSchema = {
    type: "object",
    properties: {
        clienteId: { type: "string", minLength: 10 },
        nombre: { type: "string", minLength: 5 },
        descripcion: { type: "string", minLength: 1 },
        plazoDias: { type: "number", minimum: 1 },
        estado: { type: "string", enum: ["activo", "pausado"] },
        propuestaId: { type: ["string", "null"] }
    },
    required: ["clienteId", "nombre", "descripcion", "plazoDias", "estado"],
    additionalProperties: false
};

module.exports = { Proyecto, proyectoSchema };
