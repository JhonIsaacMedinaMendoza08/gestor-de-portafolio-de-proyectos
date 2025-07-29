class Contrato {
    constructor({ proyectoId, condiciones, fechaInicio, fechaFin, valorTotal }) {
        this.proyectoId = proyectoId;
        this.condiciones = condiciones;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.valorTotal = valorTotal;
        this.createdAt = new Date();
    }

    static validar(data) {
        const errores = [];

        if (!data.proyectoId) errores.push("Proyecto asociado obligatorio");
        if (!data.condiciones || typeof data.condiciones !== 'string') errores.push("Condiciones inválidas");
        if (!data.fechaInicio || isNaN(new Date(data.fechaInicio))) errores.push("Fecha de inicio inválida");
        if (!data.fechaFin || isNaN(new Date(data.fechaFin))) errores.push("Fecha de fin inválida");
        if (!data.valorTotal || typeof data.valorTotal !== 'number' || data.valorTotal <= 0) errores.push("Valor total inválido");

        return errores;
    }
}

module.exports = Contrato;
