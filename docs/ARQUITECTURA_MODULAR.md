# Arquitectura modular extrema

Regla madre: **cada cosa que pueda cambiar por separado vive separada**.

- Landing no rompe auth.
- Auth no rompe informes.
- Informes no rompen PDF.
- PDF no rompe calendario.
- Control no rompe usuario.
- Pricing no queda hardcodeado en pantallas.

## Estructura

```txt
src/blocks/{bloque}/
  desktop/
  mobile/
  shared/
  components/
  services/
  hooks/
  types/
  config/
  content/
  styles/
```

Desktop y mobile son capas de presentación separadas. Comparten lógica solo cuando conviene.

## Shared mínimo

`src/shared` solo para componentes y utilidades genéricas. Nada de lógica comercial específica.

## Bloques incluidos

- landing
- auth
- user-dashboard
- reports
- gemini
- actions-smart
- normativa
- pdf
- calendar
- payments
- tracking
- control
- demo
- xprize-evidence
