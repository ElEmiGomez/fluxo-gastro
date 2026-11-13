/**
 * Fluxo Remotion Motion Constants
 * Calibrated for 60fps @ 120 BPM Musical Grid
 * 1 beat = 30 frames (0.50s) | 1/2 beat = 15 frames (0.25s) | 1 bar = 120 frames (2.00s)
 */

export const FPS = 60;
export const BPM = 120;
export const FRAMES_PER_BEAT = 30; // (60 * 60) / 120 = 30 frames
export const FRAMES_PER_HALF_BEAT = 15; // 0.250 seconds
export const FRAMES_PER_BAR = 120; // 4 beats = 2.00 seconds

export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;

// Safe margins for 9:16 vertical video (WhatsApp Status, Instagram Reels, YouTube Shorts)
export const SAFE_MARGIN_Y = 120; // top & bottom safe zone
export const SAFE_MARGIN_X = 80; // left & right safe zone

// Master Spring Physics (10% anticipation -> 60% rapid movement -> 30% organic settling)
export const MASTER_SPRING_CONFIG = {
  damping: 16,
  mass: 0.9,
  stiffness: 115,
};

// Touch / Tap Spring Config for fast responsive ripples and button micro-presses
export const TAP_SPRING_CONFIG = {
  damping: 15,
  mass: 0.7,
  stiffness: 160,
};

// Scene Durations aligned to exact musical beats (Total = 900 frames = 30 beats = 15.00s)
export const SCENE_1_DURATION = 210; // 7 beats (0s - 3.5s)
export const SCENE_2_DURATION = 270; // 9 beats (3.5s - 8.0s)
export const SCENE_3_DURATION = 240; // 8 beats (8.0s - 12.0s)
export const SCENE_4_DURATION = 180; // 6 beats (12.0s - 15.0s)
export const TOTAL_FRAMES_PITCH = 900; // 30 beats = 15.00s @ 60fps

// Scene 2 Exact Beat Interaction Keyframes (Multiples of 15 / 30)
export const SCENE2_TAP_PILL_1 = 60; // Beat 2.0 (1.00s) - Switches Variant Card 1
export const SCENE2_TAP_PLUS_1 = 120; // Beat 4.0 (2.00s) - Adds Card 1 to Comanda
export const SCENE2_TAP_PILL_2 = 180; // Beat 6.0 (3.00s) - Switches Variant Card 2
export const SCENE2_TAP_PLUS_2 = 225; // Beat 7.5 (3.75s) - Adds Card 2 to Comanda
export const SCENE2_TAP_CART = 255; // Beat 8.5 (4.25s) - Taps "Ver comanda ->"
