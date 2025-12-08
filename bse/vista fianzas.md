"En el proyecto frontend, quiero modificar la vista finance.vue 
[Funcionalidad: listar movimientos recientes].

Usa el stack: Vue 3, Vite y Axios.
modifica el componente en src/views/Finance.vue.
Configura la ruta en src/router/index.js. si es que fuera necesario
Asegúrate de consumir el endpoint del backend que acabamos de actualizar.
Usa estilos oscuros/modernos acorde al diseño actual."
Tips Clave:

se desea que el listado de movimientos sea paginado con 10 movimientos por pagina en una tabla con los siguientes campos:

            "tipo": "ingreso", (imagen de ingreso/egreso)
            "categoria": "Camiseta",
            "monto": 4000,
            "descripcion": "Apertura fecha 1 super senior",
            "fecha_movimiento": "2025-12-08T02:40:49.542+00:00",
            "registrado_por_nombre": el nombre del usuario que registro el movimiento
            "jugador.nombre_completo"; nopombre de jugador,
            "created_at": "2025-12-08T02:40:48.032668+00:00",
            "registrado_por_nombre": "Juan"

con este nuevo formato de retorno del backend
{
    "data": [...], // aca los movimeintos
    "total_registros": 100,
    "next": "..."
}

Usa las clases de utilidad de style.css