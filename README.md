# 🍽️ Gastro PWA Multi-Tenant (White-Label)

Plataforma web móvil gastronómica modular de alta velocidad diseñada para operar 100% en teléfonos móviles y tablets. Desarrollada con **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS** y **Supabase (PostgreSQL, Realtime, RLS)**.

---

## 📱 Vistas Principales

### 1. Vista Comensal (`/menu/[restaurant-slug]?table=X`)
- Catálogo táctil de alta resolución organizado por categorías.
- Preparado para **modelos 3D y Realidad Aumentada (AR)** mediante el campo `model_3d_url` (.glb / .usdz).
- Carrito de compras interactivo con selección de mesa.
- **Botón de llamado directo al mozo** con confirmación visual instantánea.

### 2. Vista Comandero de Personal (`/staff/comandero/[restaurant-slug]`)
- Interfaz ultrarrápida ergonómica para **uso con una sola mano**.
- Selector directo de número de mesa (ej. *Mesa 24*).
- **Sistema Híbrido de Modificadores**:
  - **Píldoras rápidas de 1 toque** (*Sin Sal, Puré, Papas, Bien cocido, Sin TACC*).
  - **Campo de nota libre / Aclaración especial** (*"Sin tomate, salsa por separado"*).
  - Teclado inteligente móvil con sugerencias rápidas.
  - Guardado directo en el campo `notes` de `order_items`.
- Envío directo de comanda en 1 solo toque.

### 3. Vista de Cocina KDS (`/staff/kitchen/[restaurant-slug]`)
- Tablero en tiempo real sincronizado mediante **Supabase Realtime**.
- **Alerta sonora automática** (Sintetizador Web Audio API sin dependencias externas) y **flash visual** al ingresar cada comanda.
- **Semáforo y temporizador de espera en vivo**:
  - 🟢 Verde: < 10 minutos
  - 🟡 Amarillo: 10 a 20 minutos
  - 🔴 Rojo: > 20 minutos (alerta de demora)
- **Aclaración del cliente resaltada en caja roja de alta visibilidad** para eliminar errores en cocina.

### 4. Capa White-Label Multi-Tenant
- Personalización en tiempo real basada en el `slug` del restaurante.
- Inyección dinámica de colores de marca (`--brand-primary`, `--brand-secondary`, `--brand-accent`), logos e información de contacto mediante `TenantProvider`.

---

## 🗄️ Esquema de Base de Datos Supabase

El archivo [`supabase/schema.sql`](./supabase/schema.sql) incluye la estructura DDL completa, índices, políticas RLS, publicaciones de Realtime y **Seed Data con 2 restaurantes de prueba**:
- `burger-gourmet` (Marca urbana, tonos naranja y pizarra)
- `bella-napoli` (Trattoria tradicional, tonos verde esmeralda y rojo)

### Ejecución del SQL en Supabase:
1. Abre tu proyecto en el panel de Supabase: [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Ve a **SQL Editor**.
3. Copia y pega el contenido de `supabase/schema.sql` y presiona **Run**.

---

## ⚙️ Configuración de Variables de Entorno

Copia el archivo `.env.local.example` a `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

> **Nota:** La aplicación incluye un **motor de Mock reactivo con persistencia local**. Si aún no tienes una cuenta de Supabase configurada, podrás probar todas las vistas y flujos de inmediato.

---

## 🚀 Inicio del Servidor de Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para acceder al panel interactivo de demostración.
