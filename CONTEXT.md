# Contexto del proyecto (para retomar en cualquier sesión)

> Este archivo resume qué es el proyecto, las decisiones tomadas y las
> convenciones, para que cualquier chat/desarrollador nuevo entienda todo
> sin depender del historial de conversación. **Léelo antes de tocar código.**

## Qué es

Plantilla de **e-commerce genérica y reutilizable** (white-label): sirve para
distintos rubros —ferretería, licorería, abasto, pizzería, etc.— cambiando solo
la configuración, sin tocar el código. Incluye **tienda pública** y **panel de
administración** en `/admin`.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS (con tema claro/oscuro por tokens)
- React Router
- Supabase (Postgres + Auth + Storage + Edge Functions)
- lucide-react (iconos)
- Desplegado en Vercel (hay `vercel.json` con rewrites para el SPA)

## Decisiones clave (importantes)

- **Marca configurable** en `src/config/store.config.ts` (o variables `VITE_STORE_*`):
  nombre, logo, favicon, moneda, textos, contacto. Marca por defecto: "Nova Store".
  Si no hay logo, se muestra el nombre como texto.
- **IVA 16%** (Venezuela), configurable vía `taxRate`. Cálculo centralizado en
  `src/lib/format.ts` (`calculateTotals`, `formatCurrency`, `formatPrice`). **No**
  volver a hardcodear `* 0.19` ni porcentajes.
- **Tema claro/oscuro** con variables CSS semánticas (ver `src/index.css` y
  `tailwind.config.js`). **Usar SIEMPRE tokens**: `bg`, `bg-subtle`, `bg-elevated`,
  `surface`, `surface-hover`, `content`, `content-soft`, `content-muted`, `line`,
  `brand`, `brand-hover`, `brand-soft`, `brand-contrast`, `accent`, `accent-contrast`,
  sombras `shadow-card`/`shadow-card-hover`. **NO** usar clases hardcodeadas
  `slate-*`, `amber-*`, `orange-*`. Botones sobre `bg-brand` usan `text-brand-contrast`.
- **Configuración de la tienda en BD**: tabla `store_settings` (fila única id=1)
  con flags `require_cedula`, `require_rif`, `enable_2fa` y parámetros de envío
  (`fuel_price`, `vehicle_kml`, `shipping_margin`, `round_trip`). Editable desde
  Admin → Configuración. Contexto: `SettingsContext` (`useSettings`).
- **Envío**: manual por ciudad (tabla `shipping_rules`). En Admin → Envíos hay una
  **calculadora** por consumo de gasolina: `(km × (ida y vuelta?2:1) ÷ km_por_litro)
  × precio_litro × (1 + margen)`. Punto de partida: Miranda. Incluye enlace a Google Maps.
- **Comprobantes de pago**: bucket de Storage **`transfer-proofs` es PRIVADO**. Se
  ven con **URL firmada temporal** (5 min) generada por la edge function
  `get-proof-url` (solo admin). No poner el bucket público.
- **2FA (TOTP)**: opcional, se habilita por tienda (`enable_2fa`). El usuario lo
  activa en su perfil (QR). En login se pide el código solo si lo tiene activo
  (contraseña siempre + MFA si aplica; NO existe "solo MFA sin contraseña").
- **Recuperación de contraseña**: por correo (`resetPasswordForEmail` → página
  `/reset-password`). El cambio de contraseña en el perfil pide solo la nueva.
- **Sesión**: persistente (comportamiento por defecto de Supabase). Decisión tomada.

## Estructura del código

- `src/config/store.config.ts` — configuración de marca (ÚNICO archivo a tocar por rubro)
- `src/lib/` — `supabase.ts` (cliente), `types.ts` (tipos del dominio),
  `format.ts` (moneda/impuesto/fecha), `applyStoreMeta.ts`, `imageOptimization.ts`
- `src/contexts/` — `Theme`, `Toast`, `Confirm`, `Settings`, `Auth`
- `src/hooks/` — `useCart`, `useCatalog`, `useAdmin`
- `src/services/` — capa de acceso a datos: `catalog`, `orders`, `profile`,
  `bankAccounts`, `admin`, `settings`, `mfa`, `edgeFunctions` (helper para llamar functions)
- `src/components/` — UI de la tienda
- `src/pages/` — `Checkout`, `Profile`, `ResetPassword` + `admin/` (panel completo)
- `supabase/functions/` — edge functions

## Edge Functions (⚠️ se despliegan MANUALMENTE en Supabase)

No se despliegan solas al mergear. Tras cambiarlas hay que redeployar:
`npx supabase functions deploy <nombre> --project-ref <ref>` o por el dashboard.

- `create-order` — crea el pedido (valida stock/precios en servidor; incluye cédula/RIF opcionales en notas)
- `upload-payment-proof` — sube el comprobante al bucket
- `cancel-order` — cancela y restaura stock
- `track-order` — rastreo por código
- `get-proof-url` — URL firmada temporal del comprobante (solo admin)
- `admin-reset-mfa` — quita el 2FA de un usuario (solo admin)
- `admin-list-mfa-users` — lista usuarios con 2FA activo (solo admin)

## Base de datos (Supabase)

Tablas: `products`, `categories`, `inventory`, `product_images`, `orders`,
`order_items`, `customer_profiles` (con `rif`), `shipping_rules`, `bank_accounts`,
`admin_users`, `store_settings`.

Funciones/otros: `is_admin(p_uid)`, `handle_new_user` (trigger que crea perfil al
registrarse; usa `NULLIF(...,'')` para no chocar con el UNIQUE de `cedula`),
`update_updated_at_column`. RLS activo: lectura pública del catálogo; escritura
solo admins; cada usuario ve solo lo suyo.

Acceso admin: ruta `/admin`, requiere estar en `admin_users` con `is_active=true`.

## Convenciones de trabajo

- Cambios en **ramas + Pull Request** hacia `main` (nunca commit directo a main).
- Mensajes de commit descriptivos; PRs con descripción de qué/por qué.
- **El sandbox tiene el registro npm bloqueado**: no se puede compilar ahí. Hacer
  `npm run typecheck && npm run build` en local antes de mergear.
- Variables de entorno en Vercel (Settings → Environment Variables): al menos
  `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Tras cambiarlas, **redeploy**.
- El `.env` NO se sube (está en `.gitignore`); usar `.env.example` como plantilla.

## Ideas / posibles próximos pasos

- Notificaciones de pedidos (email/WhatsApp)
- Reportes de ventas en el admin
- Cupones/descuentos
- RIF dentro de la factura del pedido (hoy va en las notas)
