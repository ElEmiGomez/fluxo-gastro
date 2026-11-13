import React from 'react';
import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  MASTER_SPRING_CONFIG,
  SCENE_1_DURATION,
  SCENE_2_DURATION,
  SCENE2_TAP_CART,
  SCENE2_TAP_PILL_1,
  SCENE2_TAP_PILL_2,
  SCENE2_TAP_PLUS_1,
  SCENE2_TAP_PLUS_2,
} from '../constants';
import { PitchVideoProps, Product } from '../schemas/pitchVideoSchema';
import { PhoneFrame916 } from './PhoneFrame916';
import { scene1Cues, scene2Cues, scene3Cues, SoundEffects } from './SoundEffects';
import { interpolateCursorArc, TouchCursor } from './TouchCursor';

const resolveImgSrc = (url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const clean = url.startsWith('/') ? url.slice(1) : url;
  return staticFile(clean);
};

export interface ContinuousMenuCanvasProps extends PitchVideoProps {
  /**
   * 'master': frames 0..720 continuous across Scenes 1, 2, and 3
   * 'scene1': standalone B-Roll (maps local 0..210 -> master 0..210)
   * 'scene2': standalone B-Roll (maps local 0..270 -> master 210..480)
   * 'scene3': standalone B-Roll (maps local 0..240 -> master 480..720)
   */
  mode?: 'master' | 'scene1' | 'scene2' | 'scene3';
}

// ── Exact Deterministic Pixel Geometry Inside 834x1682 Phone Screen ──
// Grid Row 1 starts at y = 206. Card 1 x = 24, Card 2 x = 426 (each 384x580).
// Inside each 384x580 card:
// - Pill 2 (variants[1]) center: relative x = 282, relative y = 412
// - (+) Button center: relative x = 340, relative y = 542
const TARGET_PILL_1 = { x: 24 + 282, y: 206 + 412 }; // (306, 618)
const TARGET_PLUS_1 = { x: 24 + 340, y: 206 + 542 }; // (364, 748)
const TARGET_PILL_2 = { x: 426 + 282, y: 206 + 412 }; // (708, 618)
const TARGET_PLUS_2 = { x: 426 + 340, y: 206 + 542 }; // (766, 748)
// Floating Cart Bar at top = 1468, left = 24, width = 786, height = 84.
// "Ver comanda ->" button at right (width 196, padding-right 18 -> center x_rel = 670, y_rel = 42)
const TARGET_VER_COMANDA = { x: 24 + 670, y: 1468 + 42 }; // (694, 1510)

export const ContinuousMenuCanvas: React.FC<ContinuousMenuCanvasProps> = ({
  mode = 'master',
  isStandalone = false,
  ...props
}) => {
  const localFrame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Map local frame to master timeline frame (0..720)
  const timelineOffset =
    mode === 'scene2'
      ? SCENE_1_DURATION
      : mode === 'scene3'
      ? SCENE_1_DURATION + SCENE_2_DURATION
      : 0;
  const masterFrame = localFrame + timelineOffset;

  // Absolute beat keyframes in master timeline (0..720)
  const F_TAP_PILL_1 = SCENE_1_DURATION + SCENE2_TAP_PILL_1; // 210 + 60 = 270
  const F_TAP_PLUS_1 = SCENE_1_DURATION + SCENE2_TAP_PLUS_1; // 210 + 120 = 330
  const F_TAP_PILL_2 = SCENE_1_DURATION + SCENE2_TAP_PILL_2; // 210 + 180 = 390
  const F_TAP_PLUS_2 = SCENE_1_DURATION + SCENE2_TAP_PLUS_2; // 210 + 225 = 435
  const F_TAP_CART = SCENE_1_DURATION + SCENE2_TAP_CART; // 210 + 255 = 465
  const F_MODAL_OPEN = SCENE_1_DURATION + SCENE_2_DURATION; // 480

  // Dynamic short table label (e.g., "Mesa 12" or "Mesa 4")
  const tableMatch = props.tableZoneBadge.match(/MESA\s*\d+/i);
  const tableLabel = tableMatch
    ? tableMatch[0].charAt(0).toUpperCase() + tableMatch[0].slice(1).toLowerCase()
    : props.tableZoneBadge.replace(/[📍·]/g, '').trim().split(' ')[0] ?? 'Mesa';

  // Ensure 4 products for the 2x2 vertical grid
  const fallbackProducts: Product[] = [
    {
      id: 'p1',
      name: 'Estrella Galicia de Grifo',
      imageUrl: '/images/dishes/estrella-galicia.jpg',
      category: 'Cervezas',
      description: 'Cerveza gallega de tirador servida bien fría con dos dedos de crema.',
      variants: [
        { label: 'Caña (200ml)', price: 2.0 },
        { label: 'Xarra (500ml)', price: 3.8 },
      ],
      selectedVariantIndex: 1,
    },
    {
      id: 'p2',
      name: '1906 Reserva Especial',
      imageUrl: '/images/dishes/cerveza-1906.jpg',
      category: 'Cervezas',
      description: 'Cerveza tostada extra con carácter, maltas torrefactas y cuerpo intenso.',
      variants: [
        { label: '1906 Reserva', price: 2.8 },
        { label: 'Red Vintage', price: 3.0 },
      ],
      selectedVariantIndex: 1,
    },
    {
      id: 'p3',
      name: 'Vinos Blancos Gallegos',
      imageUrl: '/images/dishes/vino-blanco.jpg',
      category: 'Vinos Gallegos',
      description: 'Copas de los mejores blancos de las Rías Baixas y O Ribeiro frescos.',
      variants: [
        { label: 'Albariño D.O.', price: 2.8 },
        { label: 'Godello D.O.', price: 3.0 },
      ],
      selectedVariantIndex: 0,
    },
    {
      id: 'p4',
      name: 'Vermús de Barril',
      imageUrl: '/images/dishes/vermu-gallego.jpg',
      category: 'Vermús',
      description: 'Vermú tradicional servido con hielo, rodaja de naranja y aceituna.',
      variants: [
        { label: 'Rojo Casero', price: 2.6 },
        { label: 'Blanco Reserva', price: 3.0 },
      ],
      selectedVariantIndex: 0,
    },
  ];

  const gridProducts: Product[] = [
    props.products[0] ?? fallbackProducts[0],
    props.products[1] ?? fallbackProducts[1],
    props.products[2] ?? fallbackProducts[2],
    props.products[3] ?? fallbackProducts[3],
  ];

  // ── 1. Interactive State (100% Coherent Across Scenes 1, 2 & 3) ──
  const isPill1Selected = masterFrame >= F_TAP_PILL_1;
  const isPlus1Added = masterFrame >= F_TAP_PLUS_1;
  const isPill2Selected = masterFrame >= F_TAP_PILL_2;
  const isPlus2Added = masterFrame >= F_TAP_PLUS_2;
  const isCartButtonTapped = masterFrame >= F_TAP_CART;
  const isModalOpen = masterFrame >= F_MODAL_OPEN;

  const activeVariantIdx1 = isPill1Selected ? Math.min(1, gridProducts[0].variants.length - 1) : 0;
  const activeVariantIdx2 = isPill2Selected ? Math.min(1, gridProducts[1].variants.length - 1) : 0;

  const selectedVar1 = gridProducts[0].variants[activeVariantIdx1] ?? gridProducts[0].variants[0];
  const selectedVar2 = gridProducts[1].variants[activeVariantIdx2] ?? gridProducts[1].variants[0];

  // 1:1 Mathematical Parity: Cart & Modal items derive directly from the 2 tapped cards
  const liveModalItems = [
    {
      name: gridProducts[0].name,
      variantLabel: selectedVar1?.label ?? 'Estándar',
      quantity: 1,
      unitPrice: selectedVar1?.price ?? 0,
    },
    {
      name: gridProducts[1].name,
      variantLabel: selectedVar2?.label ?? 'Estándar',
      quantity: 1,
      unitPrice: selectedVar2?.price ?? 0,
    },
  ];

  const cartItemCount = (isPlus1Added ? 1 : 0) + (isPlus2Added ? 1 : 0);
  const cartTotalPrice =
    (isPlus1Added ? liveModalItems[0].unitPrice : 0) +
    (isPlus2Added ? liveModalItems[1].unitPrice : 0);
  const finalOrderTotal = liveModalItems[0].unitPrice + liveModalItems[1].unitPrice;

  // ── 2. Continuous 2.5D Camera Choreography (Zero Static Frames) ──
  // Entrance spring (0..45)
  const entranceSpring = spring({
    frame: masterFrame,
    fps,
    config: MASTER_SPRING_CONFIG,
  });

  // Transition 1 -> 2 spring (210..255)
  const panToGridSpring = spring({
    frame: Math.max(0, masterFrame - SCENE_1_DURATION),
    fps,
    config: MASTER_SPRING_CONFIG,
  });

  // Pan to bottom cart bar spring (420..465)
  const panToBottomSpring = spring({
    frame: Math.max(0, masterFrame - 420),
    fps,
    config: MASTER_SPRING_CONFIG,
  });

  // Modal framing spring (480..520)
  const panToModalSpring = spring({
    frame: Math.max(0, masterFrame - F_MODAL_OPEN),
    fps,
    config: MASTER_SPRING_CONFIG,
  });

  // Continuous Dolly-in during Scene 3 (500..720) so image NEVER freezes
  const dollyProgress = interpolate(masterFrame, [500, 720], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Compute continuous camera parameters:
  // Base Scene 1: scale 1.22, translateY 200px, rotateX 4deg, rotateY -3deg (100% inside safe margins)
  // Scene 2 Grid: scale 1.18, translateY 20px, rotateX 2deg, rotateY 2deg
  // Scene 2 Bottom Bar: scale 1.22, translateY -135px, rotateX 0deg, rotateY 0deg
  // Scene 3 Modal Dolly: scale 1.20 -> 1.28, translateY -75px -> -100px
  const camScale =
    1.12 +
    0.10 * entranceSpring - // -> 1.22 in Scene 1
    0.04 * panToGridSpring + // -> 1.18 in Scene 2 Grid
    0.04 * panToBottomSpring - // -> 1.22 in Scene 2 Bottom
    0.02 * panToModalSpring + // -> 1.20 at Modal open
    0.08 * dollyProgress; // -> 1.28 continuous dolly-in to frame 720

  const camTranslateY =
    250 -
    50 * entranceSpring - // -> 200px in Scene 1
    180 * panToGridSpring - // -> 20px in Scene 2 Grid
    155 * panToBottomSpring + // -> -135px in Scene 2 Bottom
    60 * panToModalSpring - // -> -75px at Modal open
    25 * dollyProgress; // -> -100px continuous dolly-in to frame 720

  const camRotateX =
    6 -
    2 * entranceSpring - // -> 4deg in Scene 1
    2 * panToGridSpring - // -> 2deg in Scene 2 Grid
    2 * panToBottomSpring; // -> 0deg in Scene 2 Bottom & Scene 3

  const camRotateY =
    -3 +
    5 * panToGridSpring - // -> +2deg in Scene 2 Grid
    2 * panToBottomSpring; // -> 0deg in Scene 2 Bottom & Scene 3

  // Subtle horizontal tracking so left/right cards have generous margin
  const camTranslateX = interpolate(
    masterFrame,
    [0, 210, 260, 340, 385, 440, 480],
    [0, 0, 8, 8, -8, -8, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // ── 3. Button Micro-Press Springs & UI Animations ──
  const plus1Spring = spring({
    frame: Math.max(0, masterFrame - F_TAP_PLUS_1),
    fps,
    config: MASTER_SPRING_CONFIG,
  });
  const plus1Scale =
    masterFrame >= F_TAP_PLUS_1 && masterFrame < F_TAP_PLUS_1 + 24
      ? Math.max(
          0,
          interpolate(plus1Spring, [0, 0.4, 1], [1, 0.82, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        )
      : 1;

  const plus2Spring = spring({
    frame: Math.max(0, masterFrame - F_TAP_PLUS_2),
    fps,
    config: MASTER_SPRING_CONFIG,
  });
  const plus2Scale =
    masterFrame >= F_TAP_PLUS_2 && masterFrame < F_TAP_PLUS_2 + 24
      ? Math.max(
          0,
          interpolate(plus2Spring, [0, 0.4, 1], [1, 0.82, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        )
      : 1;

  const cartBtnSpring = spring({
    frame: Math.max(0, masterFrame - F_TAP_CART),
    fps,
    config: MASTER_SPRING_CONFIG,
  });
  const cartBtnScale =
    masterFrame >= F_TAP_CART && masterFrame < F_MODAL_OPEN
      ? Math.max(
          0,
          interpolate(cartBtnSpring, [0, 0.45, 1], [1, 0.88, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        )
      : 1;

  // Floating Cart Bar emergence when first product is added (frame 330)
  const cartBarSpring = spring({
    frame: Math.max(0, masterFrame - F_TAP_PLUS_1),
    fps,
    config: MASTER_SPRING_CONFIG,
  });
  const cartBarTranslateY = isPlus1Added
    ? interpolate(cartBarSpring, [0, 1], [140, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 140;

  // Category Bar shifts upward smoothly when Cart Bar is active
  const categoryBarTranslateY = isPlus1Added
    ? interpolate(cartBarSpring, [0, 1], [0, -90], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  // ── 4. TouchCursor Trajectory Inside Phone Screen (Frames 225..478) ──
  let cursorX = TARGET_PILL_1.x;
  let cursorY = TARGET_PILL_1.y;
  let cursorOpacity = 0;
  let activeTapLocalFrame = -1;

  if (masterFrame >= 225 && masterFrame < F_TAP_PILL_1) {
    // Enter & travel to Card 1 Pill 2 along a quadratic Bezier arc (225..270)
    cursorOpacity = interpolate(masterFrame, [225, 240], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const pt = interpolateCursorArc(
      masterFrame,
      225,
      F_TAP_PILL_1,
      { x: 420, y: 480 },
      TARGET_PILL_1,
      0.16
    );
    cursorX = pt.x;
    cursorY = pt.y;
  } else if (masterFrame >= F_TAP_PILL_1 && masterFrame < 295) {
    // Hold & Tap Card 1 Pill 2 (270..295)
    cursorOpacity = 1;
    cursorX = TARGET_PILL_1.x;
    cursorY = TARGET_PILL_1.y;
    activeTapLocalFrame = F_TAP_PILL_1 - timelineOffset;
  } else if (masterFrame >= 295 && masterFrame < F_TAP_PLUS_1) {
    // Travel from Card 1 Pill 2 to Card 1 (+) Button along an arc (295..330)
    cursorOpacity = 1;
    const pt = interpolateCursorArc(
      masterFrame,
      295,
      F_TAP_PLUS_1,
      TARGET_PILL_1,
      TARGET_PLUS_1,
      0.15
    );
    cursorX = pt.x;
    cursorY = pt.y;
  } else if (masterFrame >= F_TAP_PLUS_1 && masterFrame < 355) {
    // Hold & Tap Card 1 (+) Button (330..355)
    cursorOpacity = 1;
    cursorX = TARGET_PLUS_1.x;
    cursorY = TARGET_PLUS_1.y;
    activeTapLocalFrame = F_TAP_PLUS_1 - timelineOffset;
  } else if (masterFrame >= 355 && masterFrame < F_TAP_PILL_2) {
    // Travel across grid to Card 2 Pill 2 along a natural hand arc (355..390)
    cursorOpacity = 1;
    const pt = interpolateCursorArc(
      masterFrame,
      355,
      F_TAP_PILL_2,
      TARGET_PLUS_1,
      TARGET_PILL_2,
      -0.16
    );
    cursorX = pt.x;
    cursorY = pt.y;
  } else if (masterFrame >= F_TAP_PILL_2 && masterFrame < 410) {
    // Hold & Tap Card 2 Pill 2 (390..410)
    cursorOpacity = 1;
    cursorX = TARGET_PILL_2.x;
    cursorY = TARGET_PILL_2.y;
    activeTapLocalFrame = F_TAP_PILL_2 - timelineOffset;
  } else if (masterFrame >= 410 && masterFrame < F_TAP_PLUS_2) {
    // Travel to Card 2 (+) Button along an arc (410..435)
    cursorOpacity = 1;
    const pt = interpolateCursorArc(
      masterFrame,
      410,
      F_TAP_PLUS_2,
      TARGET_PILL_2,
      TARGET_PLUS_2,
      0.15
    );
    cursorX = pt.x;
    cursorY = pt.y;
  } else if (masterFrame >= F_TAP_PLUS_2 && masterFrame < 445) {
    // Hold & Tap Card 2 (+) Button (435..445)
    cursorOpacity = 1;
    cursorX = TARGET_PLUS_2.x;
    cursorY = TARGET_PLUS_2.y;
    activeTapLocalFrame = F_TAP_PLUS_2 - timelineOffset;
  } else if (masterFrame >= 445 && masterFrame < F_MODAL_OPEN) {
    // Travel down to "Ver comanda ->" button on Floating Cart Bar along an arc (445..465) and tap at 465
    cursorOpacity = interpolate(masterFrame, [472, 479], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const pt = interpolateCursorArc(
      masterFrame,
      445,
      F_TAP_CART,
      TARGET_PLUS_2,
      TARGET_VER_COMANDA,
      0.15
    );
    cursorX = pt.x;
    cursorY = pt.y;
    if (masterFrame >= F_TAP_CART) {
      activeTapLocalFrame = F_TAP_CART - timelineOffset;
    }
  }

  // ── 5. Scene 3 Modal Drawer Animations (Master Frames 480..720) ──
  const modalFrames = Math.max(0, masterFrame - F_MODAL_OPEN);
  const modalBackdropOpacity = isModalOpen
    ? interpolate(modalFrames, [0, 20], [0, 0.68], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  const modalDrawerSpring = spring({
    frame: modalFrames,
    fps,
    config: MASTER_SPRING_CONFIG,
  });
  const modalDrawerY = isModalOpen
    ? interpolate(modalDrawerSpring, [0, 1], [860, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 860;

  // Counter Ticker in Modal: rises from 0,00 € to finalOrderTotal between frames 495..540
  const animatedModalTotal = interpolate(
    masterFrame,
    [F_MODAL_OPEN + 15, F_MODAL_OPEN + 60],
    [0, finalOrderTotal],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Frame 600 Fast-Pay Notice Pulse (keeps Scene 3 alive & dynamic between 540..720)
  const noticePulseSpring = spring({
    frame: Math.max(0, masterFrame - 600),
    fps,
    config: MASTER_SPRING_CONFIG,
  });
  const noticeScale =
    masterFrame >= 600
      ? Math.max(
          0,
          interpolate(
            noticePulseSpring,
            [0, 0.45, 1],
            [1, 1.045, 1.015],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          )
        )
      : 1;
  const noticeGlowOpacity = interpolate(
    masterFrame,
    [600, 620, 690, 720],
    [0, 1, 0.85, 0.6],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Green live indicator dot
  const pulseDotOpacity = interpolate(
    Math.sin((masterFrame / 15) * Math.PI),
    [-1, 1],
    [0.45, 1]
  );

  // Standalone B-Roll audio cues selection
  const standaloneCues =
    mode === 'scene1'
      ? scene1Cues
      : mode === 'scene2'
      ? scene2Cues
      : mode === 'scene3'
      ? scene3Cues
      : undefined;

  return (
    <PhoneFrame916
      camera={{
        scale: camScale,
        translateX: camTranslateX,
        translateY: camTranslateY,
        rotateX: camRotateX,
        rotateY: camRotateY,
      }}
    >
      {isStandalone && standaloneCues && (
        <SoundEffects cues={standaloneCues} enableSfx={props.enableSfx} />
      )}

      {/* ── INTERNAL PHONE SCREEN DOM (834px x 1682px Continuous Coordinate System) ── */}
      <div className="relative w-[834px] h-[1682px] bg-[#f8fafc] flex flex-col font-sans select-none overflow-hidden">
        {/* 1. STICKY HEADER (h-[76px], y: 0..76) */}
        <header className="h-[76px] px-[24px] bg-white border-b border-slate-200/90 flex items-center justify-between flex-shrink-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-[50px] h-[50px] rounded-full bg-white border border-slate-200/90 p-1 shadow-xs flex items-center justify-center overflow-hidden flex-shrink-0">
              <Img
                src={resolveImgSrc(props.logoUrl)}
                alt={props.businessName}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex flex-col gap-1 min-w-0">
              <h1 className="text-[18px] font-black text-slate-900 tracking-tight leading-none truncate max-w-[300px]">
                {props.businessName}
              </h1>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/90 text-blue-700 text-[11px] font-black w-fit">
                <span
                  style={{ opacity: pulseDotOpacity }}
                  className="w-2 h-2 rounded-full bg-emerald-500"
                />
                <span className="leading-none whitespace-nowrap">{props.tableZoneBadge}</span>
              </div>
            </div>
          </div>

          {/* Header Actions: ES + WiFi + Camarero */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-[11px] border border-slate-200/80 flex items-center gap-1">
              <span className="text-blue-600">🌐</span>
              <span>ES</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-[11px] border border-slate-200/80 flex items-center gap-1">
              <span>📶</span>
              <span>WiFi</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white text-slate-800 font-extrabold text-[11px] border border-slate-200/90 shadow-2xs flex items-center gap-1.5">
              <span className="text-blue-700">🔔</span>
              <span>Camarero</span>
            </div>
          </div>
        </header>

        {/* 2. HELP BANNER (h-[54px], mt-[12px], y: 88..142) */}
        <div className="h-[54px] mt-[12px] mx-[24px] px-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/90 to-blue-50 border border-blue-200/90 flex items-center justify-between gap-3 flex-shrink-0 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="text-lg flex-shrink-0">💡</span>
            <p className="text-[12.5px] font-bold text-blue-950 leading-snug tracking-tight text-balance truncate">
              {props.bannerTipText}
            </p>
          </div>
          <span className="text-[11px] font-black text-blue-700 bg-white px-3 py-1 rounded-full border border-blue-200 shadow-2xs whitespace-nowrap flex-shrink-0">
            {tableLabel}
          </span>
        </div>

        {/* 3. DIETARY FILTERS BAR (h-[42px], mt-[8px], y: 150..192 — NO "Disponibles" filter) */}
        <div className="h-[42px] mt-[8px] px-[24px] bg-white/95 border-b border-slate-200/70 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
              FILTROS:
            </span>
            <div className="px-3 py-1 rounded-lg text-[11px] font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs flex items-center gap-1">
              <span>🌾</span>
              <span>Sin Gluten</span>
            </div>
            <div className="px-3 py-1 rounded-lg text-[11px] font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs flex items-center gap-1">
              <span>🌱</span>
              <span>Veggie</span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            Carta Oficial · 2 columnas
          </span>
        </div>

        {/* 4. 2-COLUMN VERTICAL PRODUCT GRID (mt-[14px], mx-[24px], starts at y = 206) */}
        <div className="mt-[14px] mx-[24px] grid grid-cols-2 gap-x-[18px] gap-y-[16px] flex-shrink-0">
          {gridProducts.map((product, cardIdx) => {
            const activeVarIdx =
              cardIdx === 0
                ? activeVariantIdx1
                : cardIdx === 1
                ? activeVariantIdx2
                : 0;
            const activeVariant =
              product.variants[activeVarIdx] ?? product.variants[0];
            const currentPrice = activeVariant?.price ?? 0;

            const isAdded =
              (cardIdx === 0 && isPlus1Added) || (cardIdx === 1 && isPlus2Added);
            const btnScale =
              cardIdx === 0 ? plus1Scale : cardIdx === 1 ? plus2Scale : 1;

            return (
              <div
                key={product.id || `card-${cardIdx}`}
                className="relative w-[384px] h-[580px] bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden select-none"
              >
                {/* Top Dish Photo (h-[236px], y_card: 0..236) */}
                <div className="absolute top-0 left-0 right-0 h-[236px] bg-slate-100 overflow-hidden">
                  <Img
                    src={resolveImgSrc(product.imageUrl)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.category && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-extrabold tracking-wide">
                      {product.category}
                    </span>
                  )}
                  {isAdded && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black shadow-md">
                      ✓ En comanda
                    </span>
                  )}
                </div>

                {/* Title, Dynamic Price & Description (y_card: 250..354) */}
                <div className="absolute top-[250px] left-[18px] right-[18px] h-[104px] flex flex-col justify-start">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[16px] font-black text-slate-900 leading-snug tracking-tight text-balance line-clamp-2">
                      {product.name}
                    </h3>
                    <span className="text-[18px] font-black text-blue-700 tabular-nums whitespace-nowrap flex-shrink-0">
                      {currentPrice.toFixed(2).replace('.', ',')} €
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-500 line-clamp-2 mt-1.5 leading-snug tracking-tight text-balance">
                    {product.description}
                  </p>
                </div>

                {/* Variant Pills Section (y_card: 364..490) */}
                <div className="absolute top-[364px] left-[18px] right-[18px] h-[126px]">
                  <span className="block h-[18px] text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    ELIGE OPCIÓN / TAMAÑO:
                  </span>
                  {/* 2-Column Pill Row at top-[24px] -> y_card: 388..436 (center y_card = 412) */}
                  <div className="absolute top-[24px] left-0 right-0 h-[48px] grid grid-cols-2 gap-[10px]">
                    {product.variants.slice(0, 2).map((v, vIdx) => {
                      const isVarActive = vIdx === activeVarIdx;
                      return (
                        <div
                          key={`var-${cardIdx}-${vIdx}`}
                          className={`h-[48px] px-2.5 rounded-xl flex flex-col items-center justify-center text-center border ${
                            isVarActive
                              ? 'bg-blue-700 text-white border-blue-800 shadow-xs'
                              : 'bg-slate-100 text-slate-700 border-slate-200/80'
                          }`}
                        >
                          <span className="text-[11.5px] font-black leading-tight tracking-tight truncate w-full">
                            {v.label}
                          </span>
                          <span
                            className={`text-[10.5px] font-extrabold tabular-nums leading-tight ${
                              isVarActive ? 'text-blue-100' : 'text-slate-500'
                            }`}
                          >
                            {v.price.toFixed(2).replace('.', ',')} €
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer & (+) Action Button (y_card: 504..580, center y_card = 542) */}
                <div className="absolute bottom-0 left-[18px] right-[18px] h-[76px] border-t border-slate-100 flex items-center justify-between">
                  <span
                    className={`text-[11px] font-extrabold ${
                      isAdded ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {isAdded ? '✓ 1 en comanda' : 'Toca (+) para pedir'}
                  </span>

                  {/* (+) Button: 52x52px at right edge -> center x_card = 340, center y_card = 542 */}
                  <div
                    style={{
                      transform: `scale(${btnScale})`,
                    }}
                    className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm ${
                      isAdded
                        ? 'bg-blue-700 text-white border border-blue-800'
                        : 'bg-blue-600 text-white border border-blue-700'
                    }`}
                  >
                    +
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 5. BOTTOM CATEGORY BAR (Shifts up when Cart Bar is active) */}
        <div
          style={{
            transform: `translateY(${categoryBarTranslateY}px)`,
          }}
          className="absolute top-[1474px] left-[24px] w-[786px] h-[60px] z-20 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-lg px-3 flex items-center gap-2"
        >
          <div className="px-3.5 py-2 rounded-xl text-xs bg-blue-600 text-white font-black whitespace-nowrap shadow-2xs">
            🍴 Toda la Carta
          </div>
          <div className="px-3.5 py-2 rounded-xl text-xs bg-slate-100 text-slate-700 font-bold whitespace-nowrap">
            🍺 {gridProducts[0].category ?? 'Especialidades'}
          </div>
          <div className="px-3.5 py-2 rounded-xl text-xs bg-slate-100 text-slate-700 font-bold whitespace-nowrap">
            🍷 {gridProducts[2].category ?? 'Bodega'}
          </div>
          <div className="px-3.5 py-2 rounded-xl text-xs bg-slate-100 text-slate-700 font-bold whitespace-nowrap">
            🌿 {gridProducts[3].category ?? 'Raciones'}
          </div>
        </div>

        {/* 6. FLOATING DARK CART BAR (top: 1468px, height: 84px -> center y = 1510px) */}
        {isPlus1Added && (
          <div
            style={{
              transform: `translateY(${cartBarTranslateY}px)`,
            }}
            className="absolute top-[1468px] left-[24px] w-[786px] h-[84px] z-30 bg-slate-900/95 backdrop-blur-md border border-slate-800 text-white px-[18px] rounded-2xl shadow-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white font-black text-base flex items-center justify-center shadow-xs flex-shrink-0">
                {cartItemCount}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[15px] font-black text-white leading-snug tracking-tight truncate">
                  {cartItemCount} {cartItemCount === 1 ? 'producto' : 'productos'} ·{' '}
                  <span className="text-amber-300 tabular-nums">
                    {cartTotalPrice.toFixed(2).replace('.', ',')} €
                  </span>
                </span>
                <span className="text-[11.5px] text-slate-300 font-semibold leading-none truncate mt-0.5">
                  {props.tableZoneBadge}
                </span>
              </div>
            </div>

            {/* "Ver comanda ->" Button: w-[196px] h-[54px] -> center x = 24 + 670 = 694, center y = 1510 */}
            <div
              style={{
                transform: `scale(${cartBtnScale})`,
              }}
              className="w-[196px] h-[54px] bg-blue-600 text-white font-black text-[15px] rounded-xl shadow-md flex items-center justify-center gap-2 flex-shrink-0"
            >
              <span className="whitespace-nowrap">Ver comanda</span>
              <span>→</span>
            </div>
          </div>
        )}

        {/* 7. TOUCH CURSOR (Rendered inside the 834x1682 screen DOM so 3D camera transforms never offset clicks) */}
        {!isModalOpen && (
          <TouchCursor
            x={cursorX}
            y={cursorY}
            opacity={cursorOpacity}
            tapFrame={activeTapLocalFrame}
          />
        )}

        {/* 8. SCENE 3 DRAWER MODAL: "Comanda de tu Mesa" (Unfolds over the same continuous canvas at frame 480) */}
        {isModalOpen && (
          <>
            <div
              style={{ opacity: modalBackdropOpacity }}
              className="absolute inset-0 bg-slate-950/70 z-40"
            />

            <div
              style={{
                transform: `translateY(${modalDrawerY}px)`,
              }}
              className="absolute top-[790px] left-[18px] right-[18px] z-50 bg-white rounded-[38px] shadow-2xl border border-slate-200 px-8 py-7 flex flex-col gap-5"
            >
              {/* Drag Handle & Clean Header */}
              <div>
                <div className="w-14 h-1.5 rounded-full bg-slate-200 mx-auto mb-4" />
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-[26px] font-black text-slate-900 tracking-tight leading-snug">
                      Comanda de tu Mesa
                    </h2>
                    <p className="text-[13px] font-bold text-slate-500 mt-1.5 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11.5px] font-black">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {props.tableZoneBadge}
                      </span>
                      <span>— Enséñale o léele esta lista al camarero</span>
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-sm">
                    ✕
                  </div>
                </div>

                {/* 1:1 Exact Selected Products List */}
                <div className="mt-5 space-y-4">
                  {liveModalItems.map((item, idx) => {
                    const rowSpring = spring({
                      frame: Math.max(0, modalFrames - 8 - idx * 8),
                      fps,
                      config: MASTER_SPRING_CONFIG,
                    });
                    const rowY = interpolate(rowSpring, [0, 1], [24, 0], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    });

                    return (
                      <div
                        key={`modal-item-${idx}`}
                        style={{
                          transform: `translateY(${rowY}px)`,
                        }}
                        className="p-5 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="w-11 h-11 rounded-xl bg-blue-600 text-white font-black text-base flex items-center justify-center flex-shrink-0 shadow-xs">
                            {item.quantity}x
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-[17px] font-black text-slate-900 leading-snug tracking-tight text-balance truncate">
                              {item.name}
                            </h4>
                            <p className="text-[13.5px] text-blue-700 font-extrabold leading-tight mt-0.5">
                              {item.variantLabel}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5 flex-shrink-0">
                          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center">
                              -
                            </span>
                            <span className="text-xs font-black text-slate-900 w-5 text-center">
                              {item.quantity}
                            </span>
                            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                              +
                            </span>
                          </div>
                          <span className="text-[19px] font-black text-slate-900 tabular-nums w-20 text-right">
                            {(item.quantity * item.unitPrice).toFixed(2).replace('.', ',')} €
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer: Exact Total + Fast-Pay Bar Note with Frame 600 Pulse + Action Buttons */}
              <div className="pt-5 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-base font-extrabold text-slate-500 uppercase tracking-wider">
                    Total Comanda
                  </span>
                  <span className="text-[34px] font-black text-blue-700 tabular-nums leading-none">
                    {animatedModalTotal.toFixed(2).replace('.', ',')} €
                  </span>
                </div>

                {/* Fast-Pay Bottom Notice (Pulses at frame 600 so Scene 3 never freezes) */}
                <div
                  style={{
                    transform: `scale(${noticeScale})`,
                    boxShadow:
                      masterFrame >= 600
                        ? `0 0 24px rgba(37, 99, 235, ${noticeGlowOpacity * 0.28})`
                        : 'none',
                  }}
                  className={`py-3.5 px-4 rounded-2xl border text-center ${
                    masterFrame >= 600
                      ? 'bg-blue-50 border-blue-300 text-blue-950'
                      : 'bg-slate-50 border-slate-200/80 text-slate-600'
                  }`}
                >
                  <p className="text-[13.5px] font-bold leading-snug tracking-tight text-balance">
                    💡 Para pagar más rápido en barra, indica tu mesa:{' '}
                    <strong className="font-black text-blue-700">{tableLabel}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  <div className="py-3.5 px-4 rounded-xl bg-slate-100 text-slate-700 text-[13px] font-extrabold text-center">
                    Vaciar todo
                  </div>
                  <div className="py-3.5 px-4 rounded-xl bg-slate-900 text-white text-[13px] font-extrabold text-center">
                    Seguir mirando la carta
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PhoneFrame916>
  );
};
