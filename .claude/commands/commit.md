Genera un commit git con mensaje profesional y bien estructurado.

## Instrucciones

1. Ejecuta `git diff --staged` y `git status` para ver los cambios staged
2. Si no hay nada staged, ejecuta `git diff` para ver cambios sin stagear e infórmale al usuario
3. Analiza los cambios y genera un mensaje de commit siguiendo **Conventional Commits**

## Formato del Mensaje

```
<tipo>(<scope>): <descripción corta en español>

[cuerpo opcional — explica el POR QUÉ, no el qué]

[footer opcional — breaking changes, closes #issue]
```

## Tipos

| Tipo | Usar cuando |
|------|------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `refactor` | Refactor sin cambio funcional |
| `chore` | Tareas de mantenimiento, config |
| `docs` | Solo documentación |
| `style` | Formato, espacios (sin cambio lógico) |
| `test` | Agregar o corregir tests |
| `perf` | Mejora de performance |
| `ci` | Cambios de CI/CD |
| `revert` | Revertir commit anterior |

## Scope (ejemplos para este frontend)

`auth`, `navbar`, `jugadores`, `clubes`, `eventos`, `finanzas`, `dashboard`, `router`, `store`, `api`, `config`, `deps`

## Reglas

- Descripción en **español**, imperativo: "agrega", "corrige", "actualiza"
- Máximo 72 caracteres en la primera línea
- Cuerpo solo si el cambio no es obvio

## Ejemplos

```
feat(jugadores): agrega vista de detalle de jugador

fix(auth): corrige redirección al login cuando token expira

refactor(navbar): simplifica menú a lista estática sin permisos

chore(deps): actualiza vue-router a 4.6
```

## Proceso

1. Analiza los cambios staged
2. Propón el mensaje de commit
3. **Pregunta al usuario si confirma** antes de ejecutar `git commit`
4. Si confirma, ejecuta el commit

$ARGUMENTS
