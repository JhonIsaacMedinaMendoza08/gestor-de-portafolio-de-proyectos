class Propuesta {
    constructor({clienteId, descripcion, precio, plazoDias}){
        this.clienteId = clienteId;
        this.descripcion = descripcion;
        this.precio = precio;
        this.plazoDias = plazoDias;
        this.estado = 'pendiente'; // por defecto
        this.createdAt = new Date();

    }

    static validar(propuesta){
        const errores = [ ]

        if (!propuesta.clienteId) errores.push("Cliente asociado obligatorio");
        if (!propuesta.descripcion || typeof propuesta.descripcion !== 'string') errores.push("Descripción inválida");
        if (!propuesta.precio || typeof propuesta.precio !== 'number' || propuesta.precio <= 0) errores.push("Precio inválido");
        if (!propuesta.plazoDias || typeof propuesta.plazoDias !== 'number' || propuesta.plazoDias < 1) errores.push("Plazo inválido");

        return errores;
    }
}
module.export = Propuesta;