class Contrato {
    constructor({ proyectoId, condiciones, fechaInicio, fechaFin, valorTotal }) {
        this.proyectoId = proyectoId;
        this.condiciones = condiciones;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.valorTotal = valorTotal;
        this.createdAt = new Date();
    }
}

const contratoSchema = {
    type: "object",
    properties: {
        proyectoId: { type: "string" },
        condiciones: { type: "string", minLength: 15 },
        fechaInicio: { type: "string", format: "date" },
        fechaFin: { type: "string", format: "date" },
        valorTotal: { type: "number", minimum: 1 },
        formaPago: { type: "string", enum: ["anticipo", "contraentrega", "por hitos", "mensual"] },
        moneda: { type: "string", pattern: "^[A-Z]{3}$" },
        penalizacionPorRetraso: { type: "string" },
        notasAdicionales: { type: "string", maxLength: 500 },
    },
    required: ["proyectoId", "condiciones", "fechaInicio", "fechaFin", "valorTotal", "formaPago", "moneda"],
    additionalProperties: false
};

module.exports = {
    Contrato: function (data) { return data; },
    contratoSchema
};
