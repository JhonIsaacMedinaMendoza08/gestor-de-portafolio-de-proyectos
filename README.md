# 📦 Gestor de Portafolio de Proyectos Freelance

Aplicación de línea de comandos (CLI) desarrollada en Node.js para que freelancers puedan gestionar de forma integral sus clientes, propuestas, contratos, proyectos, entregables y finanzas.

---

## 🚀 Descripción General

Este sistema permite llevar el control completo de un portafolio freelance de forma modular, aplicando principios de calidad de software como SOLID y patrones de diseño. Está enfocado en la gestión real de proyectos de clientes, incluyendo su facturación y seguimiento de entregables.


## 🧰 Instrucciones de instalación

1. Clona este repositorio:
```bash
git clone https://github.com/JhonIsaacMedinaMendoza08/gestor-de-portafolio-de-proyectos.git
cd gestor-de-portafolio-de-proyectos
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura tu conexión a MongoDB en `.env`:
```
MONGO_URI=mongodb+srv://freelancer_test:freelancer123@mycluster.vlbhwms.mongodb.net/
DB_NAME=gestor_portafolio
```

4. Ejecuta la aplicación:
```bash
node index.js
```

---

## 🧭 Cómo usar la CLI

Una vez iniciada, se mostrará un menú principal con opciones como:

- '📂 Gestionar clientes',
- '📝 Gestionar propuestas',
- '📁 Gestionar proyectos',
- '📜 Gestionar contratos',
- '🚀 Gestionar Entregables',
- '💰 Gestion Financiera',

Cada módulo ofrece submenús para **crear, listar, editar o eliminar registros**.

Ejemplo de flujo:

1. Crear cliente
2. Crear propuesta asociada
3. Crear proyecto basado en propuesta
4. Crear contrato
5. Registrar entregables
6. Registrar ingresos y egresos
7. Consultar balance financiero

---

## 🗂️ Estructura del Proyecto

```
src/
├── config/             # Conexión a base de datos
├── models/             # Modelos con validación JSON Schema
├── services/           # Lógica de negocio y persistencia
├── utils/              # Menús CLI por dominio
            
index.js/               # Archivo principal
README.md 
```

---

## 🧱 Principios SOLID Aplicados

- **S - Single Responsibility**: Cada módulo (modelo, servicio, menú) tiene una única responsabilidad.
- **O - Open/Closed**: Nuevas funcionalidades pueden añadirse sin modificar las existentes.
- **L - Liskov Substitution**: Modelos y validaciones pueden intercambiarse sin romper dependencias.
- **I - Interface Segregation**: Las interfaces del usuario están separadas por dominio.
- **D - Dependency Inversion**: Conexiones y servicios desacoplados mediante inyección modular.

---

## 🧠 Patrones de Diseño Usados

- **Repository Pattern**: Los servicios actúan como capa de persistencia.
- **Factory Function**: Modelos son instanciados con validaciones automáticas.
- **CLI Navigation**: Enrutamiento por árbol de decisiones (Command Pattern implícito).
- **Transacción**: Se aplican transacciones MongoDB en operaciones críticas (finanzas).

---

## ⚙️ Consideraciones Técnicas

- Base de datos: MongoDB Atlas
- Validador: JSON Schema con `ajv`
- CLI: `inquirer` y `chalk` para interacción y estilo
- Validaciones estrictas (unicidad, formatos, relaciones)
- Modularidad por contexto
- Transacciones aplicadas a ingresos y egresos
- Reportes financieros por cliente y proyecto

---

## 👨‍💻 Créditos

Desarrollado por: **Isaac Medina**

GitHub: [@jhonisaacmedinamendoza08](https://github.com/jhonisaacmedinamendoza08)

---

¡Gracias por usar esta herramienta! Si encuentras mejoras o bugs, siéntete libre de contribuir o abrir un issue.