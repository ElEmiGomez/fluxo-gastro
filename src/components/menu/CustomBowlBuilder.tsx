'use client'

import React, { useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { Product } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils'

export interface CustomIngredient {
  id: string
  name: string
  price: number
  category: 'Proteínas' | 'Carbohidratos' | 'Grasas & Quesos' | 'Vegetales & Toppings'
}

export const BOWL_INGREDIENTS: CustomIngredient[] = [
  // Proteínas
  { id: 'p1', name: 'Pollo grillado en finas hierbas', price: 3200, category: 'Proteínas' },
  { id: 'p2', name: 'Doble carne Smash madurada', price: 4200, category: 'Proteínas' },
  { id: 'p3', name: 'Salmón fresco en sésamo', price: 5800, category: 'Proteínas' },
  { id: 'p4', name: 'Medallón Veggie / Tofu', price: 2900, category: 'Proteínas' },
  // Carbohidratos
  { id: 'c1', name: 'Papas rústicas con romero', price: 2100, category: 'Carbohidratos' },
  { id: 'c2', name: 'Quinoa real orgánica', price: 2400, category: 'Carbohidratos' },
  { id: 'c3', name: 'Arroz jazmín tostado', price: 1800, category: 'Carbohidratos' },
  { id: 'c4', name: 'Boniato / Batata asada', price: 2200, category: 'Carbohidratos' },
  // Grasas & Quesos
  { id: 'g1', name: 'Palta / Aguacate Hass fresca', price: 2300, category: 'Grasas & Quesos' },
  { id: 'g2', name: 'Cheddar inglés fundido', price: 1900, category: 'Grasas & Quesos' },
  { id: 'g3', name: 'Queso azul / Gorgonzola', price: 2200, category: 'Grasas & Quesos' },
  { id: 'g4', name: 'Bacon crocante ahumado', price: 2100, category: 'Grasas & Quesos' },
  // Vegetales & Toppings
  { id: 'v1', name: 'Rúcula selvática & Cherry', price: 1400, category: 'Vegetales & Toppings' },
  { id: 'v2', name: 'Cebolla caramelizada al malbec', price: 1300, category: 'Vegetales & Toppings' },
  { id: 'v3', name: 'Champiñones salteados', price: 1800, category: 'Vegetales & Toppings' },
  { id: 'v4', name: 'Pepinillos agridulces encurtidos', price: 1200, category: 'Vegetales & Toppings' },
]

export const BOWL_BASE_PRICE = 4500

interface CustomBowlBuilderProps {
  restaurantId: string
  tableNumber: string
  onAddBowlToCart: (product: Product, selectedIngNames: string[], formattedNotes: string) => void
}

export function CustomBowlBuilder({
  restaurantId,
  tableNumber,
  onAddBowlToCart,
}: CustomBowlBuilderProps) {
  const [customBowlIngredients, setCustomBowlIngredients] = useState<string[]>([])

  const toggleIngredient = (id: string) => {
    setCustomBowlIngredients(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const customBowlTotal = customBowlIngredients.reduce((sum, id) => {
    const ing = BOWL_INGREDIENTS.find(i => i.id === id)
    return sum + (ing ? ing.price : 0)
  }, BOWL_BASE_PRICE)

  const handleConfirm = () => {
    if (customBowlIngredients.length === 0) {
      alert('Por favor selecciona al menos 1 ingrediente para armar tu bowl.')
      return
    }

    const selectedIngNames = customBowlIngredients
      .map(id => BOWL_INGREDIENTS.find(i => i.id === id)?.name)
      .filter(Boolean) as string[]

    const bowlProduct: Product = {
      id: `custom-bowl-${Date.now()}`,
      restaurant_id: restaurantId,
      category_id: 'cat-custom-bowl',
      name: 'Bowl Gourmet Personalizado',
      description: `Armado a medida con ${selectedIngNames.length} ingredientes seleccionados.`,
      price: customBowlTotal,
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      model_3d_url: null,
      is_available: true,
    }

    const notesFormatted = `[Bowl: ${selectedIngNames.join(', ')}]`
    onAddBowlToCart(bowlProduct, selectedIngNames, notesFormatted)
    setCustomBowlIngredients([])
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-3 space-y-6">
      <div className="bg-blue-50/80 p-4 sm:p-5 rounded-2xl border border-blue-100 flex items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🥗</span>
            <h2 className="font-extrabold text-blue-950 text-base sm:text-lg">
              Arma tu Bowl Personalizado
            </h2>
          </div>
          <p className="text-xs text-blue-800/80 mt-1">
            Base ({formatCurrency(BOWL_BASE_PRICE)}) + Elige los ingredientes a tu gusto.
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <span className="text-[10px] uppercase font-bold text-blue-600 block">Subtotal Bowl</span>
          <span className="font-black text-base sm:text-lg text-blue-900">
            {formatCurrency(customBowlTotal)}
          </span>
        </div>
      </div>

      {(['Proteínas', 'Carbohidratos', 'Grasas & Quesos', 'Vegetales & Toppings'] as const).map((categoria) => (
        <div key={categoria} className="space-y-2.5">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            {categoria}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {BOWL_INGREDIENTS
              .filter(i => i.category === categoria)
              .map((ing) => {
                const isSelected = customBowlIngredients.includes(ing.id)
                return (
                  <button
                    key={ing.id}
                    onClick={() => toggleIngredient(ing.id)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-98 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20'
                        : 'bg-white text-slate-800 border-slate-200/80 hover:border-blue-200 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold leading-snug">{ing.name}</div>
                      <div className={`text-[11px] mt-0.5 font-semibold ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        +{formatCurrency(ing.price)}
                      </div>
                    </div>
                    {isSelected && <Check size={18} className="text-white shrink-0 ml-2 stroke-[3]" />}
                  </button>
                )
              })}
          </div>
        </div>
      ))}

      <div className="pt-2">
        <button
          onClick={handleConfirm}
          className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-98 transition-all"
        >
          <Check size={18} className="stroke-[3]" />
          <span>Agregar Bowl Personalizado ({formatCurrency(customBowlTotal)})</span>
        </button>
      </div>
    </div>
  )
}
