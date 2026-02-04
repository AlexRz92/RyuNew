# Ferretería Ryu - Sistema de Ventas

Aplicación frontend moderna para ventas de ferretería con diseño oscuro profesional y gestión de inventario en tiempo real.

## Características

- Catálogo de productos con filtrado por categorías
- Carrito de compras interactivo
- Gestión de inventario en tiempo real
- Diseño responsive y moderno
- Identidad visual fuerte con tonos oscuros, detalles dorados y botones naranja

## Configuración

1. Crea un archivo `.env` en la raíz del proyecto basado en `.env.example`:

```bash
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

2. La base de datos ya está configurada con las siguientes tablas:
   - `categories`: Categorías de productos
   - `products`: Productos de la ferretería
   - `inventory`: Control de stock

3. Los datos son administrados por una aplicación externa. Este frontend solo muestra los productos y gestiona las ventas.

## Tecnologías

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase
- Lucide React Icons
