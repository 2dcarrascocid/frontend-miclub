Rol del agente:
Actúa como Frontend Engineer senior especializado en SPA modernas (Vue 3 preferentemente) con experiencia en integraciones de pasarelas de pago, manejo de redirecciones seguras, UX de pagos y consumo de APIs REST.

⚙️ Requisito de entorno (OBLIGATORIO)

Antes de ejecutar cualquier comando, instalar dependencias o levantar el proyecto, el agente DEBE ejecutar:

nvm use 22


Y confirmar que el proyecto corre sobre Node.js v22.x.

🎯 Objetivo general

Diseñar e implementar la integración frontend con Webpay Plus, consumiendo un backend propio, sin exponer credenciales, garantizando una experiencia de pago clara, segura y resiliente.

🧩 Alcance del requerimiento (Frontend)
1️⃣ Lógica de experiencia de usuario (UX)

Explicar claramente el flujo completo desde el frontend:

Usuario selecciona un producto / suscripción / evento.

Usuario presiona “Pagar”.

Frontend solicita creación de pago al backend.

Frontend recibe token + url.

Frontend redirige al formulario Webpay vía POST.

Usuario vuelve desde Webpay a una vista de resultado.

Frontend consulta backend para confirmar estado final.

Debe explicarse:

Qué pantallas existen

Qué información se muestra en cada estado

Qué ocurre si el usuario cancela, recarga o pierde conexión

2️⃣ Comunicación con el Backend

Definir claramente:

Endpoints consumidos

Payloads enviados

Payloads recibidos

Manejo de errores HTTP y timeouts

Retries controlados (si aplica)

Ejemplo esperado:

POST /api/pagos/webpay-plus/create

GET /api/pagos/webpay-plus/status/:token

3️⃣ Redirección a Webpay (CRÍTICO)

Explicar e implementar:

Por qué NO se puede usar window.location

Uso obligatorio de:

<form method="POST" action="{url}">

input hidden token_ws

Auto-submit del formulario

Limpieza del DOM tras la redirección

4️⃣ Vistas de retorno

Diseñar vistas claras:

Pago exitoso

Pago rechazado

Pago cancelado

Error inesperado

Cada vista debe:

Consultar backend para validar estado real

NO confiar en parámetros del navegador

Mostrar mensajes claros al usuario

Permitir reintento o volver al inicio

5️⃣ Arquitectura Frontend (Vue 3 sugerido)

Definir estructura:

services/ (API pagos)

views/ (PagoInicio, PagoExito, PagoError)

stores/ (Pinia, si aplica)

router/ (rutas de retorno)

Buenas prácticas:

Separación de lógica

Componentes pequeños

Manejo centralizado de errores

Loading states y bloqueo de botones

6️⃣ Seguridad (Frontend)

El agente debe dejar explícito:

Qué NO debe hacer el frontend

Por qué nunca debe:

Guardar tokens en localStorage

Persistir estados de pago sin backend

Exponer llaves o headers Transbank

Cómo evitar doble click / doble pago

7️⃣ Implementación técnica

Entregar:

Código Vue 3 (Composition API)

Servicio JS/TS para pagos

Ejemplo de auto-submit form

Manejo de estados visuales (loading, disabled)

Manejo de rutas protegidas post-pago

8️⃣ Entregables esperados

El agente debe entregar:

Diagrama del flujo frontend

Documentación técnica de integración frontend

Ejemplos de código listos para producción

Checklist de pruebas:

Pago exitoso

Pago rechazado

Cancelación usuario

Refresh / back browser

Errores comunes y mitigaciones

🛑 Restricciones

No usar librerías externas para el pago (solo redirección estándar)

No implementar lógica de negocio de pagos en frontend

No asumir acceso directo a Transbank desde frontend

Cumplir estrictamente el flujo oficial de Webpay Plus

📌 Contexto adicional

SPA moderna (Vue / Vite)

Backend propio

Pasarela Transbank Webpay Plus

Uso en pagos de eventos, suscripciones y servicios deportivos

Si quieres, en el próximo paso puedo:

Unificar este prompt con el backend en un solo requerimiento maestro

Convertir esto en una historia de usuario Jira

Adaptarlo a Nuxt 3

Bajar esto a una checklist de implementación paso a paso

Usa el stack: Vue 3, Vite y Axios.
Usa estilos oscuros/modernos acorde al diseño actual.
crea o actulaiza las clases de utilidad de style.css