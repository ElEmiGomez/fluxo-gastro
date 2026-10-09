# Análisis Competitivo y Estratégico: Astarté Informática vs Fluxo

## 1. Perfil de la Empresa
* **Nombre:** Astarté Informática S.L.
* **Ubicación:** Plaza Uncibay 3, Málaga (España).
* **Trayectoria:** Más de 20-25 años en el mercado español (evolución desde software en MS-DOS hasta Windows y Android).
* **Modelo de Negocio:** Venta tradicional de licencias de software TPV (`MAÎTRE` para hostelería y `TIENDA` para comercio) a través de red de distribuidores de hardware informático a nivel nacional, con cuotas de mantenimiento y soporte.

---

## 2. Radiografía de su Suite para Hostelería (`MAÎTRE`)

Astarté comercializa una arquitectura dividida en múltiples versiones y módulos independientes:

1. **Software Central de Caja (`MAÎTRE Serie 6 Profesional`):**
   * Aplicación nativa instalable para sistemas Windows (TPVs táctiles de sobremesa).
   * Cuatro niveles de licencia escalonados: *Base*, *CR*, *CR Plus* y *Pro*.
   * Gestión tradicional de tickets, cobros, proveedores, control de inventario y compras.
2. **Comandero Móvil (`MAÎTRE Serie 7 Tablet`):**
   * Módulo independiente para tabletas o teléfonos Android que conecta con la base de datos local de Windows.
3. **Monitor de Cocina (`MAÎTRE Serie 7 Cocina`):**
   * Pantalla KDS para sustituir las impresoras de papel de cocina, con cambios de color según tiempo de espera.
4. **Módulo de Autoservicio (`MAÎTRE Serie 7 Pedir y Pagar`):**
   * Solución QR orientada principalmente a comida rápida y recogida en mostrador (*el cliente pide en el móvil y va a buscar el plato*).
5. **Kiosco Táctil (`MAÎTRE Serie 6 Kiosco`):**
   * Para cadenas de comida rápida con terminales físicos de autoservicio.
6. **Módulos de Integración Física:**
   * Datáfonos inteligentes (Dojo): envía el importe directo al datáfono para evitar descuadres de caja.
   * Cajones automáticos de efectivo (Cashlogy, CashGuard).
   * Adaptación a normativa legal: **TicketBAI** (País Vasco) y **VeriFactu** (Ley Antifraude estatal).

---

## 3. Matriz Comparativa: Astarté Informática vs Fluxo

| Criterio | Astarté Informática (`MAÎTRE`) | Fluxo Gastronomic System |
| :--- | :--- | :--- |
| **Arquitectura técnica** | **Legacy / Local:** Requiere instalación física en Windows, red local cableada y sincronización con apps Android. | **Cloud Nativo:** 100% Web en la nube (Next.js 14 + Supabase Realtime). Funciona en cualquier navegador y dispositivo sin instalar nada. |
| **Puesta en marcha** | **Lenta y costosa:** Requiere visita de instalador, configuración de red, IPs locales y formación presencial/remota. | **Instantánea:** Se accede con URL y código PIN en menos de 5 minutos desde cualquier móvil o tablet. |
| **Modelo comercial y precios** | **Opaco y fragmentado:** No publican precios. Cobran alta inicial, licencias por módulo (TPV + cocina + comanderos) y mantenimiento. | **Transparente y Todo Incluido:** Planes claros (Básico, Medio y Plan Full 99€/mes con todo el ciclo operativo incluido). |
| **Resiliencia ante fallos** | Si el ordenador central de caja falla o Windows se actualiza, la operativa del restaurante se detiene. | **Aislamiento por UUID y Alta Disponibilidad:** Funciona con tolerancia a desconexiones en terrazas y respaldos en la nube. |
| **Experiencia del Comensal (QR)** | Muy básica, pensada para pedir y recoger en mostrador. Sin seguimiento de fases de cocina. | **Experiencia Premium:** Multi-rondas en mesa, micro-onboarding, seguimiento reactivo en tiempo real ("En cola", "Preparando", "Listo") y llamadas al mozo. |
| **Inteligencia Artificial** | **Inexistente.** | **Integrada:** Asistente de importación de menús por IA, generación/mejora de fotos de platos y sugerencias de carta. |
| **Inteligencia de Negocio** | Informes tradicionales en listados contables de ventas y horas pico. | **Reportes Ejecutivos Visuales:** Dashboard mensual con análisis de velocidad de servicio, rotación de mesas y matriz de rentabilidad de platos. |

---

## 4. Oportunidades y Aprendizajes Clave para Fluxo

1. **Aprovechar el "Cansancio de Licencias" del Hostelero:**
   * Los clientes de empresas como Astarté suelen estar frustrados por la fragmentación: si quieren una cocina digital, les cobran un extra; si quieren comanderos en mesa, otro extra; si cambian de móvil, otra licencia.
   * **Posicionamiento ganador de Fluxo:** *"Una sola cuota mensual plana donde tienes TPV de sala, comandero en el móvil de los camareros, pantalla de cocina y carta para comensales, sin pagar por dispositivos adicionales ni licencias de servidor"*.
2. **Garantía de Cumplimiento Legal (VeriFactu y TicketBAI):**
   * Astarté gana muchos clientes porque las asesorías fiscales recomiendan sistemas homologados ante la nueva Ley Antifraude.
   * Destacar en la web y dossieres comerciales de Fluxo que el sistema cumple de serie con los requisitos de inalterabilidad y encadenamiento de facturas da máxima tranquilidad al dueño.
3. **El Punto Fuerte de Astarté: La Integración con Datáfonos (Pasarelas como Dojo / Stripe Terminal):**
   * Los hosteleros valoran enormemente que el camarero no tenga que teclear los "46,50 €" a mano en el datáfono físico (donde se producen errores humanos de cobro).
   * La integración futura en Fluxo con pasarelas de cobro físico (Stripe Terminal o pasarelas locales) cerrará el círculo para sustituir definitivamente al TPV de caja tradicional.
4. **Cero Dependencia de Hardware Propietario:**
   * Para abrir un restaurante con Astarté, el hostelero suele invertir entre **1.500 € y 3.500 €** en equipos (pantalla táctil, cableado, PDAs).
   * Con Fluxo, el hostelero puede reutilizar cualquier móvil o tablet económica que ya tenga en el local. Esta barrera de entrada casi nula es el mayor catalizador de ventas para captar locales nuevos y bares independientes.
