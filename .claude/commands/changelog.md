Genera un changelog profesional basado en los commits recientes.

## Rango o Contexto
$ARGUMENTS

---

## Proceso

1. Ejecutar `git log` para ver los commits recientes
2. Agrupar por tipo (feat, fix, refactor, etc.)
3. Generar el changelog en formato estándar

---

## Formato de Output

```markdown
# Changelog — Frontend MiClub

## [versión] — YYYY-MM-DD

### Nuevas Funcionalidades
- **jugadores**: agrega vista de detalle con historial de pagos
- **auth**: agrega flujo de recuperación de contraseña

### Correcciones
- **navbar**: corrige menú vacío al iniciar sesión
- **auth**: corrige redirección tras reset de contraseña

### Mejoras
- **api**: centraliza manejo de errores 401 en interceptor
- **router**: simplifica guards a solo requiresAuth / hideForAuth

### Cambios Internos
- Actualiza vue-router a 4.6
- Elimina sistema de permisos dinámicos
```

---

## Reglas

- **Lenguaje**: español, claro y directo
- **No incluir**: commits de formato, typos, merges automáticos
- **Sí incluir**: cambios que afecten UI, flujos o integración con backend

## Niveles de Versión (SemVer)

| Cambio | Versión |
|--------|---------|
| Breaking change en rutas o stores | MAJOR |
| Nueva vista o flujo completo | MINOR |
| Bug fix, mejora de UI | PATCH |

## Comandos Git Útiles

```bash
git log --since="7 days ago" --oneline
git log v1.0.0..HEAD --oneline
```
