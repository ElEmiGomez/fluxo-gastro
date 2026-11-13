import { z } from 'zod';

export const VariantSchema = z.object({
  label: z.string(),
  price: z.number(),
});

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string(),
  category: z.string().optional(),
  description: z.string().optional(),
  variants: z.array(VariantSchema),
  selectedVariantIndex: z.number().default(0),
});

export const OrderItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  variantLabel: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
});

export const PitchVideoSchema = z.object({
  businessName: z.string(),
  logoUrl: z.string(),
  tableZoneBadge: z.string(),
  bannerTipText: z.string(),
  products: z.array(ProductSchema),
  orderItems: z.array(OrderItemSchema),
  enableSfx: z.boolean().default(true),
  isStandalone: z.boolean().optional(),
});

export type Variant = z.infer<typeof VariantSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type PitchVideoProps = z.infer<typeof PitchVideoSchema>;

export const jaraTusasPreset: PitchVideoProps = {
  businessName: 'Bar Jara-Tusas',
  logoUrl: '/images/jaratusas-logo-circle.png',
  tableZoneBadge: '📍 MESA 12 · TERRAZA',
  bannerTipText: 'Selecciona con el botón (+) los productos que quieras pedir',
  products: [
    {
      id: 'cerv-grifo',
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
      id: 'cerv-1906',
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
      id: 'vinos-gallegos',
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
      id: 'vermu-gallego',
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
  ],
  // 1:1 Mathematical Parity: Exact 2 items tapped by TouchCursor in Scene 2 (3,80 € + 3,00 € = 6,80 €)
  orderItems: [
    {
      id: 'item-1',
      name: 'Estrella Galicia de Grifo',
      variantLabel: 'Xarra (500ml)',
      quantity: 1,
      unitPrice: 3.8,
    },
    {
      id: 'item-2',
      name: '1906 Reserva Especial',
      variantLabel: 'Red Vintage',
      quantity: 1,
      unitPrice: 3.0,
    },
  ],
  enableSfx: true,
};

export const casaMarDaVilaPreset: PitchVideoProps = {
  businessName: 'Casa Mar da Vila',
  logoUrl: '/images/casamar-logo.png',
  tableZoneBadge: '📍 MESA 4 · SALÓN',
  bannerTipText: 'Selecciona con el botón (+) los productos que quieras pedir',
  products: [
    {
      id: 'pulpo-feira',
      name: 'Pulpo á Feira con Cachelos',
      imageUrl: '/images/dishes/pulpo.jpg',
      category: 'Mariscos y Raciones',
      description: 'Pulpo de lonja cocido al punto con pimentón de la Vera y AOVE.',
      variants: [
        { label: 'Ración', price: 16.0 },
        { label: 'Media Ración', price: 10.0 },
      ],
      selectedVariantIndex: 1,
    },
    {
      id: 'zamburinas',
      name: 'Zamburiñas a la Plancha',
      imageUrl: '/images/dishes/zamburinas.jpg',
      category: 'Mariscos y Raciones',
      description: 'Zamburiñas de las Rías Baixas marcadas con salsa de ajo y perejil.',
      variants: [
        { label: 'Docena (12u)', price: 18.0 },
        { label: 'Media Docena', price: 11.0 },
      ],
      selectedVariantIndex: 1,
    },
    {
      id: 'raxo-queixo',
      name: 'Raxo al Queso de Tetilla',
      imageUrl: '/images/dishes/raxo-queixo.jpg',
      category: 'Carnes',
      description: 'Lomo de cerdo adobado a la sartén fundido con auténtico queso de Tetilla.',
      variants: [
        { label: 'Ración', price: 12.5 },
        { label: 'Con Patatas', price: 14.0 },
      ],
      selectedVariantIndex: 0,
    },
    {
      id: 'calamares',
      name: 'Calamares de la Ría',
      imageUrl: '/images/dishes/calamares.jpg',
      category: 'Mariscos y Raciones',
      description: 'Calamares frescos crujientes con alioli casero y toque de limón.',
      variants: [
        { label: 'Ración', price: 13.0 },
        { label: 'Media Ración', price: 8.5 },
      ],
      selectedVariantIndex: 0,
    },
  ],
  // 1:1 Mathematical Parity: Exact 2 items tapped by TouchCursor in Scene 2 (10,00 € + 11,00 € = 21,00 €)
  orderItems: [
    {
      id: 'cm-1',
      name: 'Pulpo á Feira con Cachelos',
      variantLabel: 'Media Ración',
      quantity: 1,
      unitPrice: 10.0,
    },
    {
      id: 'cm-2',
      name: 'Zamburiñas a la Plancha',
      variantLabel: 'Media Docena',
      quantity: 1,
      unitPrice: 11.0,
    },
  ],
  enableSfx: true,
};
