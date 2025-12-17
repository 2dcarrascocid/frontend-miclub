En el proyecto frontend-miclub, quiero crear una nueva vista clubDetalle
[Funcionalidad: ver el club seleccionado].
desde la vista clubes, cuando se clickea en un club, se debe mostrar la vista clubDetalle con los detalles del club seleccionado.

datos principales del club:
- nombre
- descripcion
- cantidad de jugadores

una labla que liste las categorias del club con su edad minima y maxima
ademas la funcionalidad para crear actulizar y eliminar categorias.



Asegúrate de consumir el endpoint del backend 
 POST   | http://localhost:3000/clubes/{clubId}/categorias                                    │
 GET    | http://localhost:3000/clubes/{clubId}/categorias                                    │
 PUT    | http://localhost:3000/clubes/{clubId}/categorias/{id}                               │
 DELETE | http://localhost:3000/clubes/{clubId}/categorias/{id}

con este nuevo formato dede entrada y retorno del backend

    :id_club,
    :nombre,
    :descripcion,
    :edad_desde,
    :edad_hasta

Usa el stack: Vue 3, Vite y Axios.
modifica el componente en src/views/players/.
Configura la ruta en src/router/index.js. si es que fuera necesario
Usa estilos oscuros/modernos acorde al diseño actual.
Usa las clases de utilidad de style.css
