Flujo rápido y seguro para corregir bugs críticos en producción.

## Bug a Corregir
$ARGUMENTS

---

## Principio del Hotfix

Un hotfix es un fix mínimo para un problema crítico. No es el momento de refactorizar.

**Regla**: El cambio debe ser lo más pequeño posible para resolver el problema.

---

## Proceso Hotfix

### Paso 1: Diagnóstico Rápido
- Leer el componente o archivo afectado
- Identificar la causa raíz exacta (no síntomas)

### Paso 2: Fix Mínimo
- Cambiar solo lo necesario para corregir el bug
- Si la solución requiere más de 20 líneas, probablemente no sea un hotfix

### Paso 3: Validación Rápida
- Verificar que el bug está resuelto
- Verificar que no se rompió nada adyacente
- `npm run build` sin errores

### Paso 4: Commit y Deploy
- Commit con prefijo `fix:`
- Build y deploy del frontend
- Verificar en producción

---

## Checklist Hotfix

- [ ] Causa raíz identificada
- [ ] Cambio mínimo que resuelve el bug
- [ ] No se tocó código no relacionado
- [ ] Build sin errores
- [ ] Verificado en producción

---

## Formato de Commit

```
fix(scope): descripción corta del bug corregido

Causa: {causa raíz}
Fix: {qué cambió exactamente}
```
