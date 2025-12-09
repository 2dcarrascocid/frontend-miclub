"En el proyecto frontend, quiero modificar: 
1. vista dashboard 
2. vista finance

[Funcionalidad: tarjetas gastos, ingresos y balance].
utilizando separadores de miles y formato de monera clp ejmplo $1.000.000

Usa el stack: Vue 3, Vite y Axios.
modifica el componente en src/views/dashboard/ y src/views/finance/
Configura la ruta en src/router/index.js. si es que fuera necesario

Usa estilos oscuros/modernos acorde al diseño actual."

las  tarjetas mantener el formato actual:

Asegúrate de consumir el endpoint del backend : 
GET : http://localhost:3000/clubes/20daf933-d0dd-4f96-a0c8-85cf793141d0/finanzas/resumen

con este nuevo formato de retorno del backend
{
    "ingresos": 16000,
    "egresos": 0,
    "balance": 16000
}

Usa las clases de utilidad de style.css
