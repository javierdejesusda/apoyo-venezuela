# Apoyo Venezuela

Mapa colaborativo para coordinar la ayuda tras el terremoto del 24 de junio de 2026 en Venezuela (doble sismo de magnitudes aproximadas M7.1 y M7.5). Permite reportar zonas afectadas, publicar necesidades por ubicación, marcar el estado estructural y consultar teléfonos de emergencia verificados.

Sitio en producción: https://apoyovenezuela.com

> Iniciativa ciudadana sin afiliación política. La información es aportada por la comunidad: verifica antes de actuar o compartir. Ante una emergencia que ponga en riesgo la vida, llama al 911.

## Qué hace

- **Mapa interactivo** de zonas afectadas con un semáforo de estado estructural (derrumbe, dañado, estable, sin confirmar), siempre con color + icono + etiqueta.
- **Reporte de zonas** con geolocalización o selección de punto en el mapa.
- **Necesidades por zona** (rescate, agua, alimentos, medicinas, refugio, etc.) con ciclo de vida: se necesita -> en camino -> cubierto.
- **Teléfonos de emergencia verificados** por estado, con tap-to-call y la fuente de cada número.
- **Guía de ayuda**: qué donar y qué evitar, refugios y centros de acopio, organizaciones de ayuda.
- **Enlace al proyecto hermano** de personas desaparecidas: https://desaparecidosterremotovenezuela.com
- **Actualizaciones en vivo** (mapa y listas) vía Supabase Realtime.
- PWA, modo claro/oscuro y diseño mobile-first.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + React 19 + TypeScript estricto
- Tailwind CSS v4 (tokens de diseño en `app/globals.css` vía `@theme`)
- Mapa: Leaflet + react-leaflet con tiles de OpenStreetMap (sin API key)
- Datos: Supabase (Postgres + Realtime); validación con Zod
- Iconos: lucide-react
- Pruebas: Vitest

## Cómo correr en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000.

Sin variables de entorno la app arranca en **modo demostración**: usa un almacén en memoria con datos de ejemplo de las zonas afectadas. Los datos no se comparten entre usuarios en este modo.

### Conectar Supabase (datos en vivo)

Define estas variables (por ejemplo en `.env.local` o en el panel de tu hosting):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
```

Cuando ambas existen, la app usa Supabase automáticamente en lugar del modo demo. La `anon key` es pública por diseño (se incluye en el bundle del navegador); no expongas nunca la `service_role` ni claves secretas.

### Base de datos

El esquema vive en `supabase/migrations/20260625000000_init.sql` (tablas `locations` y `needs`, índices, RLS y publicación de Realtime). Para aplicarlo:

```bash
supabase db push
```

o pega el SQL en el editor del panel de Supabase.

La política de RLS deja abiertas la **lectura, la inserción y la actualización** (herramienta de emergencia sin login) y **no permite borrado**. La moderación queda como mejora futura.

## Scripts

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servir el build |
| `npm run lint` | ESLint |
| `npm run test` | Pruebas (Vitest) |
| `npm run typecheck` | Chequeo de tipos (tsc) |

## Estructura

```
app/            Rutas (App Router): home, reportar, telefonos, guia, zona/[id], metadata PWA/SEO
components/     UI (mapa, formularios, tarjetas, navegación, estados)
components/ui/  Primitivas (button, form, badge)
lib/data/       Modelo de datos, store (demo vs Supabase), selectores, seed, contactos
lib/status.ts   Sistema visual (semáforo): iconos, etiquetas y tonos
supabase/       Migración del esquema
tests/          Pruebas de lógica pura
```

## Datos de emergencia

Los teléfonos y recursos se recopilaron de fuentes públicas y se marcaron como verificados cuando al menos una fuente confiable los confirmó. Aun así, las líneas pueden saturarse o cambiar: **verifica el número antes de llamar**.

## Contribuir

Las contribuciones son bienvenidas, en especial correcciones de datos (teléfonos, refugios, organizaciones) con su fuente. Mantén el estilo del proyecto: tokens de diseño, iconos de lucide, copy en español con acentos y sin colores partidistas.
