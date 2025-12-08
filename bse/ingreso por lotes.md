"En el proyecto frontend, quiero crear un componente para la funcionalidad de finanzas el cula debe funionar con un boton de carga ingresos o egresos por lotes 

[Funcionalidad: cargar finanzas por lotes].
crear boton de carga ingresos o egresos por lotes.
maximo 20 registros por lote.
se debe crear un titulo a la carga por lotes el cual se copiara en todos los objetos en el campo descripcion: ejemplo : "FECHA 1 APERTURA 2026"
la tabla debe  ir cargando los datos linea  a linea con los siguientes campos:

"club_id": "20daf933-d0dd-4f96-a0c8-85cf793141d0",
"tipo": "ingreso",
"categoria": "Pago camiseta",
"monto":4000,
"descripcion": ( titulo a la carga por lotes )
"jugador_id":"4f476731-4ada-4e75-982f-3c3ea498cd14"

para obtener el jugador id se debe buscar en la tabla el_dep_jugadores con el folio o primeras letras del nombre, o rut, o telefono. se cargara solo el nombre en la tabla.
el servicio debe validar que el jugador exista en la tabla el_dep_jugadores.
 GET  | http://localhost:3000/clubes/{clubId}/jugadores/buscar
ejemplo = http://localhost:3000/clubes/20daf933-d0dd-4f96-a0c8-85cf793141d0/jugadores/buscar?query=juan
retorna lista :
[
    {
        "id": "4d1df737-4f2b-472f-b66e-67630030260a",
        "nombre_completo": "Juan Torres",
        "rut": "34775934-k",
        "telefono": "+5693827224",
        "folio": 8
    },
    {
        "id": "57e408e8-d0f8-44ea-aedf-22fc35ec6c07",
        "nombre_completo": "Juan Torres C",
        "rut": "49702209-k",
        "telefono": "+5698824756",
        "folio": 17
    },
    {
        "id": "9b292a1a-2c54-4194-9bf6-e37877eddc66",
        "nombre_completo": "Juan Torres D",
        "rut": "72534375-k",
        "telefono": "+5693738265",
        "folio": 36
    },
    {
        "id": "4582f0a1-2daa-480d-85de-620aa6d61cd4",
        "nombre_completo": "Juan Torres B",
        "rut": "55064433-k",
        "telefono": "+5693980545",
        "folio": 39
    }
] 
Usa el stack: Vue 3, Vite y Axios.
crea en componente  en src/components/finanzas/.
Configura la ruta en src/router/index.js. si es que fuera necesario
Asegúrate de consumir el endpoint del backend que acabamos de actualizar.

POST | http://localhost:3000/clubes/{clubId}/finanzas/movimientos/lote
ejemplo de body para uan lista de un solo movimiento
[
    {
"club_id": "20daf933-d0dd-4f96-a0c8-85cf793141d0",
"tipo": "ingreso",
"categoria": "Pago camiseta",
"monto":4000,
"descripcion":"Super-senior 16:00",
"jugador_id":"4f476731-4ada-4e75-982f-3c3ea498cd14"
    }
]

Usa estilos oscuros/modernos acorde al diseño actual."

Usa las clases de utilidad de style.css