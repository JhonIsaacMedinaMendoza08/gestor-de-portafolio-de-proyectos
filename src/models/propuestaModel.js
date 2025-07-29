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

    static validar(propuesta) {
        const errores = [];

        if (!propuesta.clienteId) errores.push("Cliente asociado obligatorio");
        if (!propuesta.descripcion || typeof propuesta.descripcion !== 'string') errores.push("Descripción inválida");
        if (!propuesta.precio || typeof propuesta.precio !== 'number' || propuesta.precio <= 0) errores.push("Precio inválido");
        if (!propuesta.plazoDias || typeof propuesta.plazoDias !== 'number' || propuesta.plazoDias < 1) errores.push("Plazo inválido");
        if (!Array.isArray(propuesta.tecnologias) || propuesta.tecnologias.length === 0) errores.push("Debe seleccionar al menos una tecnología");
        if (!['frontend', 'backend', 'fullstack'].includes(propuesta.tipoTrabajo)) errores.push("Tipo de trabajo inválido");


        return errores;
    }
}

module.exports = Propuesta;
