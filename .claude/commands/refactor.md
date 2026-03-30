Refactoriza código Vue 3 mejorando su calidad sin cambiar su comportamiento.

## Código a Refactorizar
$ARGUMENTS

---

## Principio Fundamental

**Un refactor no cambia el comportamiento observable.** Leer el código actual completo antes de empezar.

---

## Cuándo Refactorizar

### SÍ refactorizar cuando:
- Componentes > 200 líneas mezclando múltiples responsabilidades
- Misma llamada API duplicada en 3+ componentes
- Nombres de variables que no describen lo que contienen
- Lógica de carga repetida sin composable

### NO refactorizar cuando:
- El código funciona y es legible
- Hay un bug activo — primero arreglar
- El cambio es solo preferencia de estilo

---

## Tipos de Refactor Comunes

### Extraer composable
```javascript
// Antes: lógica de carga repetida en cada vista
const loading = ref(false)
const jugadores = ref([])
onMounted(async () => { ... })

// Después: composable reutilizable
// src/composables/useJugadores.js
export function useJugadores(clubId) {
  const loading = ref(false)
  const jugadores = ref([])
  // ...
  return { loading, jugadores, loadJugadores }
}
```

### Extraer componente
```javascript
// Cuando una sección del template es usada en 2+ vistas
// → moverla a src/components/{dominio}/NombreComponente.vue
```

### Simplificar template
```html
<!-- Antes: condiciones anidadas difíciles de leer -->
<!-- Después: usar computed para derivar el estado -->
```

---

## Proceso

1. **Leer** el código actual completo
2. **Identificar** el problema específico
3. **Aplicar** un cambio a la vez
4. **Verificar** que la UI se ve y comporta igual
5. **Build** sin errores

---

## Checklist Post-Refactor

- [ ] Comportamiento observable idéntico al original
- [ ] Build sin errores (`npm run build`)
- [ ] Nombres más descriptivos que antes
- [ ] No hay lógica duplicada entre 3+ componentes
- [ ] Sin dependencias innecesarias añadidas
