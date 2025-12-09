"En el proyecto frontend, quiero modificar la vista clubs 
[Funcionalidad: listar clubes de un owner_id].

mostrar clubes en forma de tarjetas descripctivas 

Usa el stack: Vue 3, Vite y Axios.
modifica el componente en src/views/players/.
Configura la ruta en src/router/index.js. si es que fuera necesario

Usa estilos oscuros/modernos acorde al diseño actual."

Asegúrate de consumir el endpoint del backend 
GET http://localhost:3000/clubes?owner_id=0e05d871-9780-43c6-95b4-02f3d3db7444
con este nuevo formato de retorno del backend
[
    {
        "id": "0017c061-4f9b-439a-90d7-2afe19f2cda3",
        "nombre": "estrella verde",
        "descripcion": null,
        "admin_id": "0e05d871-9780-43c6-95b4-02f3d3db7444",
        "created_at": "2025-12-04T01:00:47.479151+00:00",
        "updated_at": "2025-12-04T01:00:47.479151+00:00"
    },
    {
        "id": "20daf933-d0dd-4f96-a0c8-85cf793141d0",
        "nombre": "estrella roja",
        "descripcion": null,
        "admin_id": "0e05d871-9780-43c6-95b4-02f3d3db7444",
        "created_at": "2025-12-04T01:27:07.060458+00:00",
        "updated_at": "2025-12-04T01:27:07.060458+00:00"
    }
]

Usa las clases de utilidad de style.css