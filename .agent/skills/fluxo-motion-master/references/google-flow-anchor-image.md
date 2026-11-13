# Protocolo Automatizado Google Flow CLI (`google-flow` v2.0.3) + Regla de la Imagen Ancla

Fuentes integradas:
1. **Skill CLI Automatizada (`BRPLia/google-flow-skill-v1` — v2.0.3):** Instalada en `.agent/skills/google-flow/flow.py` y `C:\Users\mima7\.gemini\config\skills\google-flow\`.
2. **Metodología de la Imagen Ancla (Pau Rodríguez — `L1JEGCPOJoE`):** Consistencia visual absoluta encadenando `image` $\rightarrow$ `video` (`--start`).

---

## 1. Qué resuelve esta integración en el Sistema de Vídeo de Fluxo

Cuando un vídeo de Fluxo necesita **B-Roll cinematográfico hiperrealista** (ej. terraza llena en hora punta, cerveza tirándose con espuma cremosa, camarero sonriendo en sala o cocina trabajando con KDS) para combinarlo con nuestras interfaces vectoriales en Remotion (`src/remotion/`), **tú no tienes que copiar ni pegar prompts a mano en Google Flow**.

El agente ejecuta directamente la CLI `.agent/skills/google-flow/flow.py` en tu máquina local, controla Chrome, genera primero las **Imágenes Ancla**, las anima en **vídeos MP4 (`9:16` o `16:9`)**, las descarga automáticamente y luego las monta en `public/assets/flow/` para renderizar el anuncio final en Remotion.

---

## 2. Modelos Soportados en Google Flow (`flow_provider/registry.py`)

| Tipo de Activo | Modelos Activos en `flow.py` | Uso Recomendado en Fluxo |
| :--- | :--- | :--- |
| **Imagen (Imagen Ancla)** | • `Nano Banana 2 Lite` *(por defecto)*<br>• `Nano Banana 2.1`<br>• `Nano Banana Pro` | Generar el fotograma maestro de referencia (iluminación, terraza, plato o camarero) con estética consistente. |
| **Vídeo (Animación B-Roll)** | • `Veo 3.1 - Lite` *(por defecto, alta fidelidad)*<br>• `Omni 1.2 Flash` *(admite `--duration 4s` o `8s` por deslizador)* | Animar la Imagen Ancla (`--start`) con movimiento de cámara suave para usar como fondo o split-screen en Remotion. |

*(Nota: Flow retira `Omni 1.1 Flash`, `Veo 3.1 - Fast` y `Veo 3.1 - Quality` en diciembre de 2026; usar siempre los modelos de la tabla superior).*

---

## 3. Comandos Oficiales de `flow.py` (Desde la raíz de `.agent/skills/google-flow/`)

### 3.1 Instalación y Sesión Inicial (1 sola vez)
```powershell
cd ".agent\skills\google-flow" ; python setup.py ; python flow.py status
```
- Si `status` devuelve `SIN SESION` (o la sesión expiró), se ejecuta:
```powershell
cd ".agent\skills\google-flow" ; python flow.py login
```
Esto abre una ventana visible de Google Chrome en tu escritorio para que inicies sesión con tu cuenta de Google. El perfil queda guardado localmente en `.agent/skills/google-flow/session/flowbot-profile/` (excluido en `.gitignore`).

### 3.2 Ejecución por Lotes con Imagen Ancla Encadenada (`batch`)
Para cualquier vídeo con 2 o más planos de B-Roll, **prohibido ejecutar comandos sueltos a mano**. El agente genera un archivo JSON de lote (ej. `scratch/flow_batch_fluxo.json`) donde cada escena crea primero su **Imagen Ancla** (`"type": "image"`) y luego el clip de vídeo la referencia en `"start"`:

```json
{
  "project": "fluxo_broll_terraza",
  "defaults": {
    "ratio": "9:16",
    "image_model": "Nano Banana 2.1",
    "video_model": "Veo 3.1 - Lite"
  },
  "jobs": [
    {
      "type": "image",
      "name": "ancla_mesa_terraza",
      "prompt": "Warm sunlit Spanish restaurant terrace table, two diners smiling while looking at a smartphone digital menu on the table, shallow depth of field, cinematic lighting, vertical 9:16"
    },
    {
      "type": "video",
      "name": "clip_mesa_terraza",
      "start": "ancla_mesa_terraza",
      "duration": "8s",
      "prompt": "Slow smooth camera push-in toward the table as the diner taps the smartphone screen, warm ambient sunlight, subtle natural movement"
    }
  ]
}
```

Y lo ejecuta con:
```powershell
cd ".agent\skills\google-flow" ; python flow.py batch "..\..\scratch\flow_batch_fluxo.json"
```

### 3.3 Verificación y Paso a Remotion (`public/assets/flow/`)
1. Al finalizar el lote, el agente inspecciona `.agent/skills/google-flow/outputs/<project>/batch_report.json` para confirmar `"status": "ok"` y la ruta de cada `.png` y `.mp4`.
2. Si un vídeo se generó en Flow pero falló la descarga por red, **nunca reenviar a ciegas** (para no gastar créditos dobles): recuperar primero con `python flow.py download --project UUID --asset-id CLAVE --out ruta.mp4`.
3. Copiar los `.mp4` aprobados a `public/assets/flow/` e inyectarlos en la escena de Remotion mediante `<OffthreadVideo src={staticFile('assets/flow/clip_mesa_terraza.mp4')} />` detrás de los componentes vectoriales (`ContinuousMenuCanvas`, `SpotlightActionCard` o `SplitSyncConnector`).
