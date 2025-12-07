"En el proyecto frontend, quiero modificar la vista dashboard 
[Funcionalidad: tarjetas de contar, jugadores y socios].

Usa el stack: Vue 3, Vite y Axios.
modifica el componente en src/views/dashboard/.
Configura la ruta en src/router/index.js. si es que fuera necesario
Asegúrate de consumir el endpoint del backend que acabamos de actualizar.
Usa estilos oscuros/modernos acorde al diseño actual."
Tips Clave:

un tarjeta debe tener el siguiente formato:

jugadores (pelota) 
socios (estrella)
se den mantener las tarjetas actuales existentes 

con este nuevo formato de retorno del backend
{
    "total_jugadores_activos": 100,
    "total_socios_no_jugadores": 50
}

Usa las clases de utilidad de style.css