# Plantilla de E-commerce (multi-rubro)

Plantilla de tienda en línea con panel de administración, construida como base
reutilizable para distintos negocios: **ferretería, licorería, abasto, pizzería**, etc.
La identidad del negocio (nombre, logo, colores, moneda, impuesto, textos) es
**configurable** sin tocar el código.

Diseño oscuro profesional, catálogo con inventario en tiempo real, carrito,
checkout con transferencia bancaria y seguimiento de pedidos.

## Características

- Catálogo de productos con filtrado por categorías, búsqueda y paginación
- Carrito de compras interactivo
- Checkout con datos de facturación/envío y subida de comprobante de pago
- Compra como invitado (con token) o con cuenta de usuario
- Seguimiento de pedidos por código
- Perfil de usuario con historial, recompra y factura imprimible
- Panel de administración (productos, inventario, categorías, pedidos, envíos, cuentas bancarias, administradores)
- Imágenes optimizadas con `srcset` y precarga anticipada al hacer scroll

## Tecnologías

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase (Postgres + Auth + Storage + Edge Functions)
- Lucide React (iconos)
- React Router

## Configuración

### 1. Variables de entorno

Copia `.env.example` a `.env` y rellena al menos las de Supabase:

```bash
cp .env.example .env
```

| Variable | Obligatoria | Descripción |
|----------|:-----------:|-------------|
| `VITE_SUPABASE_URL` | ✅ | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Anon key del proyecto |
| `VITE_STORE_*` | ❌ | Identidad del negocio (ver `.env.example`) |

### 2. Adaptar la plantilla a otro negocio

Toda la identidad del negocio vive en **`src/config/store.config.ts`**.
Puedes editar ese archivo directamente, o sobrescribir cualquier valor con
variables `VITE_STORE_*` en tu `.env` / Vercel. Ejemplo para una licorería:

```env
VITE_STORE_NAME="Licorería El Trago"
VITE_STORE_TAGLINE="Los mejores tragos de la ciudad"
VITE_STORE_LOGO="/mi-logo.png"
VITE_STORE_TAX_RATE="0.16"
```

Los **productos y categorías** son datos: se gestionan desde el panel de
administración, no en el código.

### 3. Panel de administración

Disponible en la ruta **`/admin`**. Requiere iniciar sesión con una cuenta que
esté registrada en la tabla `admin_users` (con `is_active = true`); el acceso se
valida con la función `is_admin()` de la base de datos.

Secciones: Dashboard, Productos, Inventario, Categorías, Pedidos (con revisión de
comprobantes y cambio de estado), Reglas de envío, Cuentas bancarias y
Administradores.

Para autorizar a un nuevo administrador: la persona se registra como usuario en
la tienda, y luego se agrega su `user_id` a `admin_users` desde Supabase.

### 4. Desarrollo

```bash
npm install
npm run dev
```

### 5. Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Previsualizar el build |
| `npm run lint` | Linter |
| `npm run typecheck` | Comprobación de tipos |
