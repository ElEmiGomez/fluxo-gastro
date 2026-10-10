'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { TenantProvider } from '@/components/tenant/TenantProvider'
import { StaffPinAuth } from '@/components/auth/StaffPinAuth'
import { AdminTab } from '@/types/admin.types'
import { useAdminMenu } from '@/hooks/admin/useAdminMenu'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminProductCatalog } from '@/components/admin/AdminProductCatalog'
import { AdminCategoryManager } from '@/components/admin/AdminCategoryManager'
import { AdminAiImporter } from '@/components/admin/AdminAiImporter'
import { AdminProductModal } from '@/components/admin/AdminProductModal'

export default function AdminMenuPage() {
  const params = useParams()
  const slug = (params?.slug as string) || 'burger-gourmet'

  const [activeTab, setActiveTab] = useState<AdminTab>('products')

  const {
    restaurant,
    categories,
    products,
    toastMsg,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    searchQuery,
    setSearchQuery,
    filteredProducts,
    editingProduct,
    setEditingProduct,
    selectedAllergens,
    setSelectedAllergens,
    isNewProductModalOpen,
    setIsNewProductModalOpen,
    newCatName,
    setNewCatName,
    editingCatId,
    setEditingCatId,
    editingCatName,
    setEditingCatName,
    aiRawText,
    setAiRawText,
    aiParsing,
    aiParsedResult,
    handleToggleAvailability,
    handleSaveProduct,
    handleDeleteProduct,
    handleCreateCategory,
    handleDeleteCategory,
    handleRenameCategory,
    handleMoveCategory,
    handleParseWithAI,
    handleApplyAiMenu,
  } = useAdminMenu({
    slug,
    onSwitchTab: (tab) => setActiveTab(tab),
  })

  return (
    <StaffPinAuth role="admin" restaurantSlug={slug}>
      <TenantProvider restaurant={restaurant}>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
          {/* Toast Notification */}
          {toastMsg && (
            <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 border border-cyan-500/50 text-white font-bold text-xs sm:text-sm shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* CABECERA PRINCIPAL ADMIN */}
          <AdminHeader
            slug={slug}
            restaurantName={restaurant.name}
            productsCount={products.length}
            categoriesCount={categories.length}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* CONTENIDO PRINCIPAL */}
          <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
            {activeTab === 'products' && (
              <AdminProductCatalog
                products={products}
                filteredProducts={filteredProducts}
                categories={categories}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategoryFilter={selectedCategoryFilter}
                onCategoryFilterChange={setSelectedCategoryFilter}
                onOpenNewProductModal={() => {
                  setEditingProduct(null)
                  setSelectedAllergens([])
                  setIsNewProductModalOpen(true)
                }}
                onOpenEditProductModal={(prod) => {
                  setEditingProduct(prod)
                  setSelectedAllergens(prod.allergens || [])
                  setIsNewProductModalOpen(true)
                }}
                onToggleAvailability={handleToggleAvailability}
                onDeleteProduct={handleDeleteProduct}
              />
            )}

            {activeTab === 'categories' && (
              <AdminCategoryManager
                categories={categories}
                products={products}
                newCatName={newCatName}
                onNewCatNameChange={setNewCatName}
                onCreateCategory={handleCreateCategory}
                editingCatId={editingCatId}
                editingCatName={editingCatName}
                onEditingCatNameChange={setEditingCatName}
                onStartEditingCategory={(cat) => {
                  setEditingCatId(cat.id)
                  setEditingCatName(cat.name)
                }}
                onCancelEditingCategory={() => setEditingCatId(null)}
                onRenameCategory={handleRenameCategory}
                onMoveCategory={handleMoveCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            )}

            {activeTab === 'ai_import' && (
              <AdminAiImporter
                aiRawText={aiRawText}
                onAiRawTextChange={setAiRawText}
                aiParsing={aiParsing}
                aiParsedResult={aiParsedResult}
                onParseWithAI={handleParseWithAI}
                onApplyAiMenu={handleApplyAiMenu}
              />
            )}
          </main>

          {/* MODAL DE CREAR / EDITAR PLATO */}
          <AdminProductModal
            isOpen={isNewProductModalOpen}
            editingProduct={editingProduct}
            categories={categories}
            selectedAllergens={selectedAllergens}
            onAllergenToggle={(allergenId) => {
              setSelectedAllergens((prev) =>
                prev.includes(allergenId) ? prev.filter((x) => x !== allergenId) : [...prev, allergenId]
              )
            }}
            onClose={() => {
              setEditingProduct(null)
              setIsNewProductModalOpen(false)
            }}
            onSave={handleSaveProduct}
          />
        </div>
      </TenantProvider>
    </StaffPinAuth>
  )
}
