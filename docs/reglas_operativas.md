# REGLAS OPERATIVAS Y LÓGICA DE NEGOCIO — FLUXO GASTRO PWA
> **Versión:** 1.0.0 (Producción B2B / Paridad Analógica)  
> **Filosofía Base:** *"Paridad Operacional antes que Innovación"*. Reemplazar al 100% el comportamiento analógico del papel sin añadir fricción a ninguno de los 3 actores (Comensal, Mozo, Cocina).

---

## 1. El Mozo como "Gatekeeper" Antifraude (`pending_validation`)
* **Problema Operativo:** Si un usuario se lleva una foto del código QR a su casa o lo escanea desde la calle, podría enviar 20 hamburguesas a una mesa para sabotear el restaurante. No se deben usar soluciones complejas como GPS o geolocalización, ya que fallan en interiores o si el comensal desactiva los permisos de ubicación.
* **Regla de Negocio:**
  1. Cuando el comensal pulsa *"Enviar Comanda"*, el pedido se registra en la base de datos con el estado inicial **`pending_validation`**.
  2. **La cocina KDS NO recibe este pedido** en su pantalla ni se imprimen tickets mientras esté en este estado.
  3. El móvil del comensal muestra un aviso de cortesía: *"Comanda en espera de validación. Tu mozo se acercará a la mesa para confirmar tu pedido antes de enviarlo a cocina"*.
  4. El **Comandero del Mozo (`/staff/comandero/[slug]`)** recibe una alerta prioritaria en la sección *"Validación Requerida en Mesa"* con el detalle de platos, cantidades y aclaraciones.
  5. El mozo asiste a la mesa, corrobora de forma verbal con los comensales y pulsa **"✓ Confirmar a Cocina"**.
  6. En ese instante, el estado de la comanda pasa a **`pending`**, salta a la pantalla KDS con timbre sonoro y la barra del comensal cambia a *"Comanda validada · En cola de cocina"*.
  7. Si el mozo detecta que la mesa está desocupada (pedido fantasma), descarta la comanda con un toque en **"Descartar"** (`cancelled`), neutralizando el intento sin perjuicio económico ni operativo para la cocina.

---

## 2. Modificadores Estructurados (Cero Texto Libre para Comensales)
* **Problema Operativo:** Las cajas de texto libre (`<textarea>` / `<input>`) permiten notas complejas, ambiguas o contradictorias que retrasan la línea de cocina y generan reclamos infundados de clientes.
* **Regla de Negocio:**
  1. Se **elimina cualquier campo de texto libre** en la interfaz de la carta digital del cliente.
  2. La personalización se restringe estrictamente a tres niveles normalizados:
     - **Puntos de Cocción de Carne (Radio buttons):** *Poco hecha*, *Al punto*, *Bien hecha*. Respaldo digital ante disputas de cocción.
     - **Exclusiones y Preferencias Fijas (Píldoras / Checkboxes):** *Sin cebolla*, *Sin mayonesa*, *Salsa aparte*, *Sin sal*, *Pan bien tostado*, *Sin hielo*, *Extra limón*, *Para compartir*.
     - **Alérgenos Visuales Normativos:** Etiquetas obligatorias por normativa europea (Gluten, Lácteos, Huevo, Frutos Secos, Pescado).
  3. Si el cliente requiere una indicación inusual o extrema (ej. alergia severa cruzada), la comunica de forma oral al mozo cuando este se acerque a validar la comanda.

---

## 3. Llamador con Intención Específica (Cero Viajes Dobles)
* **Problema Operativo:** Un botón genérico de *"Llamar al mozo"* duplica los traslados del personal: el mozo va a la mesa solo a preguntar qué desea el cliente y luego debe hacer un segundo viaje a buscarlo.
* **Regla de Negocio:**
  1. El llamador despliega un menú modal de intenciones específicas de 1 toque:
     - 💧 **Jarra de Agua** (`service_water`): Mozo acude directo con la jarra.
     - 🥖 **Pan / Cubiertos** (`service_bread`): Ración extra sin esperas.
     - 💳 **Pedir Cuenta con Tarjeta** (`request_bill_card`): Mozo acude directamente con el datáfono / TPV inalámbrico.
     - 💵 **Pedir Cuenta en Efectivo** (`request_bill_cash`): Mozo acude directamente con el cambio.
     - 🙋 **Atención del Mozo** (`order_dictate` / `call_waiter`): Consulta general.
  2. En el comandero móvil del personal, la notificación visual y auditiva detalla el ícono y la acción exacta (ej. *"Mesa 14 — Solicita Cuenta con Tarjeta"*).

---

## 4. KDS Híbrido: Pantalla Táctil Industrial o Impresora Térmica
* **Problema Operativo:** En una cocina activa, los cocineros tienen las manos con harina, grasa o guantes de látex y no pueden realizar gestos finos o Drag & Drop en pantallas de móvil. Además, locales tradicionales rechazan pantallas y exigen tickets físicos en papel.
* **Regla de Negocio:**
  * **Opción Pantalla (KDS Digital):** La interfaz `/staff/kitchen/[slug]` opera con **botones de altura industrial (`h-16 py-4`, >70px)** para transiciones de 1 toque (*Iniciar Preparación* ➔ *Marcar Listo* ➔ *Entregado*). Cero Drag & Drop.
  * **Opción Papel (Impresora Térmica ESC/POS):** El sistema dispone del endpoint `/api/printers/receipt?order_id=[id]&width=42` que emite la comanda en texto plano formateado y en secuencias de bytes binarios ESC/POS estándar con corte de papel automático (`\x1d\x56\x00`), permitiendo conectar tiqueteras térmicas (Epson, Bixolon, Star) para restaurantes que prefieran el ticket colgado en el pasaplatos.

---

## 5. Exclusión de Pagos Automatizados en el MVP
* **Regla de Negocio:**
  1. El MVP excluye pasarelas de pago bancarias automatizadas (Stripe, Redsys, etc.) para evitar comisiones intermedias, fricciones de registro KYC y complejidad contable en la fase de adopción inicial.
  2. El cobro continúa gestionándose de forma tradicional por medio del mozo o en la caja del establecimiento, asistido por los llamadores de cuenta con indicación de método de pago.
