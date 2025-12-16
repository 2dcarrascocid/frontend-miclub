"En el proyecto frontend, quiero crear una nueva vista de detalle de players 
[Funcionalidad: ver detalle del jugador ].
- obtener al jugador desde la vista donde se listan los jugadores
- eliminar el icono de lapiz y trash en accines editar y eliminar y agregar un icono de ver jugador 
- el nuevo componente debe cargar todos los datos del jugador 
- el nuevo componente debe tener un boton de regresar a la lista de jugadores
- debe poder actulizar los datos 
- debe poder eliminar el jugador la aliminaciion sera logica osea estado activo = false
- es estilo debe ser formato ficha de jugador con un espacio para la fotografia 
- debe tener un boton de agregar foto 
- debe tener un boton de eliminar foto 

Usa el stack: Vue 3, Vite y Axios.
modifica el componente en src/views/players/.
Configura la ruta en src/router/index.js. si es que fuera necesario
Usa estilos oscuros/modernos acorde al diseño actual."
Usa las clases de utilidad de style.css

estos son los datos del jugador 

        {
            "id": "1781484e-754a-46c9-9b9e-825b499ac841",
            "club_id": "20daf933-d0dd-4f96-a0c8-85cf793141d0",
            "usuario_id": null,
            "nombre_completo": "Jorge Rojas",
            "rut": "73626180-k",
            "email": "23062189@gmail.com",
            "telefono": "+5691000827",
            "fecha_nacimiento": "1984-04-12",
            "es_socio": true,
            "activo": true,
            "created_at": "2025-12-07T22:48:29.235131+00:00",
            "updated_at": "2025-12-07T22:48:29.235131+00:00",
            "folio": 1,
            "es_jugador": false,
            "path_foto": "https://fplaychile.com/storage/players/1781484e-754a-46c9-9b9e-825b499ac841.jpg"
        },

