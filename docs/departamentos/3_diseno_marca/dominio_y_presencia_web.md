# 🌐 ESTRATEGIA DE DOMINIO Y PRESENCIA WEB — FLUXO

> **Departamento:** Departamento 3 — Diseño de Marca, Identidad Visual & Presencia Web  
> **Fecha de Actualización:** `19/10/2026`  
> **Estado:** Aprobado para Implementación (DEC-33)

---

## 1. 🎯 Diagnóstico de Disponibilidad de Dominios

| Dominio | Estado | Precio Mercado | Propósito y Estrategia |
| :--- | :---: | :---: | :--- |
| **`fluxogastro.com`** | **DISPONIBLE** | **~10 € - 11 €/año** | **Dominio Principal Oficial** para el software, cartas QR y landing comercial. |
| **`fluxogastro.es`** | **DISPONIBLE** | **6,95 €/año** | **Protección de Marca Nacional** en España / Galicia. Redirección 301 a `.com`. |
| **`fluxosystem.com`** | **OCUPADO** | Indeterminado | Registrado por un tercero desde 2023. Descartado formalmente. |

---

## 2. 📊 Comparativa de Registradores para `fluxogastro.com` (.com)

| Registrador | 1º Año | Renovación Anual | Privacidad WHOIS | Ventajas / Inconvenientes |
| :--- | :---: | :---: | :---: | :--- |
| **Vercel Domains** | **11,25 $** (~10,35 €) | **11,25 $** (~10,35 €) | **Gratis** | **Recomendado por Simplicidad.** Compra directa a precio de coste (programa *Domains at cost*). 0 configuración DNS; SSL automático y facturación centralizada. |
| **Cloudflare Registrar** | **10,44 $** (~9,60 €) | **10,44 $** (~9,60 €) | **Gratis** | Precio de coste estricto sin margen comercial. Requiere gestionar DNS en Cloudflare y configurar registros A y CNAME hacia Vercel. |
| **Porkbun** | **11,08 $** (~10,20 €) | **11,08 $** (~10,20 €) | **Gratis** | Registrador independiente con precios transparentes sin subidas en renovación. |
| **Namecheap** | **6,79 $** (~6,25 €) | **15,98 $** (~14,70 €) | **Gratis** | Oferta gancho el primer año con código `NEWCOM679`, pero encarece la renovación un 40%. |
| **DonDominio** | **15,95 €** (+ IVA) | **15,95 €** (+ IVA) | **Gratis** | Proveedor español con soporte en castellano y facturación con IVA deducible. |

---

## 3. 🇪🇸 Dominio Territorial Español: `fluxogastro.es` (.es)

Los registradores estadounidenses (Vercel, Cloudflare, Porkbun) no comercializan la extensión `.es` por requerimientos normativos de Red.es.

* **Registrador Recomendado:** **DonDominio**.
* **Tarifa:** **6,95 €/año** (+ IVA = 8,41 €/año) tanto para registro como para renovación.
* **Uso Recomendado:** Apuntar con un registro de redirección 301 permanente hacia `https://fluxogastro.com` para evitar que competidores o terceros ocupen el nombre en España.

---

## 4. 🛠️ Protocolo Técnico de Vinculación en Vercel

### Caso A: Compra Directa en Vercel Domains (Opción 1 Clic)
1. Iniciar sesión en [Vercel Dashboard](https://vercel.com).
2. Entrar en el proyecto `fluxo-gastro` $\rightarrow$ **Settings $\rightarrow$ Domains**.
3. Escribir `fluxogastro.com` y pulsar **Buy / Add**.
4. Confirmar el pago de **11,25 $/año**. Vercel autoconfigura los registros DNS y genera el certificado SSL (HTTPS) en menos de 2 minutos.

### Caso B: Compra Externa (Cloudflare, DonDominio o Porkbun)
1. En Vercel $\rightarrow$ **Settings $\rightarrow$ Domains** $\rightarrow$ Añadir `fluxogastro.com`.
2. En el panel del registrador externo, crear los registros DNS oficiales de Vercel:
   * **Tipo A:** Host `@` $\rightarrow$ Valor `76.76.21.21`
   * **Tipo CNAME:** Host `www` $\rightarrow$ Valor `cname.vercel-dns.com`
3. Esperar la propagación DNS (entre 5 y 30 minutos).
