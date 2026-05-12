Actúa como Frontend Engineer senior 
Usa el stack: Vue 3, Vite y Axios.
Usa estilos oscuros/modernos acorde al diseño actual.
crea o actulaiza las clases de utilidad de style.css
obligatorio antes usa 
nvm use 22
Necesito que modifiques únicamente el FRONTEND para ajustar la lógica de precios y la UI de suscripciones.

REQUERIMIENTO
1) Planes y precios
- Mantener el precio base mensual actual del plan (precio_mensual).
- Agregar/actualizar 2 opciones de compra:
  A) Plan 12 meses:
     - total_bruto = precio_mensual * 12
     - descuento = 15% sobre total_bruto
     - total_final = total_bruto - (total_bruto * 0.15)
     - mostrar: “Ahorras X” y “15% OFF”
  B) Plan 6 meses:
     - total_bruto = precio_mensual * 6
     - descuento = 5% sobre total_bruto
     - total_final = total_bruto - (total_bruto * 0.05)
     - mostrar: “Ahorras X” y “5% OFF”
- Mantener también la opción mensual (sin descuento) si ya existe.

2) Fechas del plan (inicio y término)
- Al seleccionar un plan, calcular:
  - fecha_inicio = fecha actual (local del usuario)
  - fecha_termino:
    - mensual: +1 mes
    - 6 meses: +6 meses
    - 12 meses: +12 meses
- Reglas importantes:
  - Usar una función robusta para sumar meses evitando fechas inválidas (ej: 31 -> último día del mes).
  - Mostrar fechas en formato legible para Chile: dd-mm-aaaa.
  - La fecha de término debe ser inclusiva/exclusiva según criterio consistente:
    - sugerencia: término = misma fecha del mes futuro (si no existe, último día del mes), y mostrar “Válido hasta: <fecha_termino>”.
  - No usar librerías externas (dayjs/moment) salvo que el proyecto ya las tenga instaladas; preferir Date nativo y utilidades propias.

3) UI/UX (obligatorio)
- Actualizar la vista de suscripciones para que el usuario pueda elegir:
  - Mensual
  - 6 meses (5% OFF)
  - 12 meses (15% OFF)
- Mostrar en cada opción:
  - Precio mensual base
  - Total bruto (precio_mensual * meses)
  - Descuento en monto (ahorro)
  - Total final (lo que pagará)
  - Fecha de inicio (hoy) y fecha de término estimada
- Agregar indicadores visuales:
  - “Recomendado” en 12 meses (si aplica)
  - badge de descuento (5% / 15%)
- Bloquear el botón “Continuar/Pagar” hasta que exista una opción seleccionada (si hoy no se selecciona por defecto).

4) Datos y compatibilidad
- No modificar backend.
- Asumir que el frontend hoy obtiene el precio mensual de cada suscripción desde:
  - una prop, store (Pinia) o respuesta API ya existente.
- Si el precio viene como string o número, normalizar.
- Formatear moneda CLP con separador de miles (ej: $ 12.990) usando Intl.NumberFormat('es-CL', { style:'currency', currency:'CLP' }).
- Redondeo:
  - total_final debe quedar en entero CLP (sin decimales).
  - definir regla: Math.round o Math.floor, pero ser consistente y documentarlo en comentarios.

5) Entregables
- Indicar exactamente qué archivos del frontend modificarás.
- Entregar el código final (componentes + utilidades) listo para copiar/pegar:
  - función calculatePlanPricing(precioMensual, meses, descuentoPct)
  - función addMonthsSafe(date, months)
  - UI actualizada con ejemplo de render de opciones
- Incluir ejemplos con números para validar:
  - precio_mensual = 10.000
    - 12 meses: bruto 120.000, 15% = 18.000, final 102.000
    - 6 meses: bruto 60.000, 5% = 3.000, final 57.000

Restricciones
- SOLO FRONTEND.
- No inventar endpoints nuevos.
- No romper el flujo actual de “suscribirse/pagar”; solo adaptar la selección y los totales mostrados/enviados si ya se envía algún monto o planId.

Objetivo
Que el usuario vea claramente el precio final con descuento según duración, y que quede visible el período del plan (inicio y término) antes de pagar.


