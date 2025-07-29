class Proyecto {
    constructor({ clienteId, propuestaId, nombre, descripcion, estado }) {
        this.clienteId = clienteId;
        this.propuestaId = propuestaId || null;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.estado = estado || 'activo';
        this.createdAt = new Date();
    }
    static validar(data) {
        const errores = [];
        if (!data.clienteId) errores.push('Cliente requerido');
        if (!data.nombre || typeof data.nombre !== 'string') errores.push('Nombre inválido');
        if (!data.descripcion || typeof data.descripcion !== 'string') errores.push('Descripción inválida');
        if (!['activo', 'pausado', 'finalizado', 'cancelado'].includes(data.estado)) errores.push('Estado inválido');
        return errores;
    }
}

module.exports = Proyecto;