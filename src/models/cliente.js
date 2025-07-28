class Cliente {
    constructor ({nombre, correo, telefono, tipo}){
        this.nombre = nombre;
        this.correo = correo;
        this.telefono = telefono;
        this.tipo = tipo;
        this.createAt = new Date();
    }

    static validar(cliente){
        const errores = [];

        if (!cliente.nombre || typeof cliente.nombre !== 'string') errores.push("Nombre inválido");
        if (!cliente.correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.correo)) errores.push("Correo inválido");
        if (!cliente.telefono || typeof cliente.telefono !== 'string') errores.push("Teléfono inválido");
        if (!cliente.tipo || !['empresa', 'independiente'].includes(cliente.tipo)) errores.push("Tipo inválido");

    return errores;

    }
}

module.exports = Cliente;