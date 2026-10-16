import React, { useState } from 'react';
import { Plus, Edit3, Trash2, ShieldCheck, Tag, Info, Check, X } from 'lucide-react';

const PRESET_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', 
  '#F59E0B', '#EF4444', '#06B6D4', '#F97316', 
  '#84CC16', '#6366F1', '#14B8A6', '#64748B'
];

export default function CategoriesView({ categories, onSaveCategory, onDeleteCategory }) {
  const [activeTab, setActiveTab] = useState('EXPENSE');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'EXPENSE',
    color: '#10B981',
    is_essential: false,
  });

  const [error, setError] = useState('');

  const filtered = categories.filter((c) => c.type === activeTab);

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({
        name: cat.name,
        type: cat.type,
        color: cat.color,
        is_essential: Boolean(cat.is_essential),
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        type: activeTab,
        color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
        is_essential: activeTab === 'EXPENSE',
      });
    }
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Informe o nome da categoria');
      return;
    }

    try {
      setError('');
      await onSaveCategory(formData, editingCategory?.id);
      setModalOpen(false);
    } catch (err) {
      setError(err.message || 'Erro ao salvar categoria');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Explanation */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800 shadow-soft dark:shadow-soft-dark flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Gestão de Categorias
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Personalize suas categorias de receitas e despesas com cores e marcação essencial
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Tabs for Expense / Income */}
          <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('EXPENSE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'EXPENSE'
                  ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Despesas
            </button>
            <button
              onClick={() => setActiveTab('INCOME')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'INCOME'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Receitas
            </button>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Categoria</span>
          </button>
        </div>
      </div>

      {/* Info Tip about Essential Categories */}
      <div className="bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 rounded-2xl p-4 flex items-start space-x-3 text-xs text-amber-800 dark:text-amber-300">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Como funciona a flag "Essencial"? </span>
          Categorias marcadas com o selo <ShieldCheck className="w-3.5 h-3.5 inline text-amber-600" /> Essencial (como Alimentação, Moradia, Saúde) representam o seu <strong>custo de vida inegociável</strong>. O <em>Módulo de Estimativas de Inflação</em> utiliza esses dados para projetar o impacto de preços no que você realmente precisa para viver.
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cat) => (
          <div
            key={cat.id}
            className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 shadow-soft dark:shadow-soft-dark flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
          >
            <div className="flex items-center space-x-3 truncate">
              <span 
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              >
                <Tag className="w-4 h-4" />
              </span>
              <div className="truncate">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {cat.name}
                </p>
                <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                  <span>{cat.type === 'INCOME' ? 'Receita' : 'Despesa'}</span>
                  {cat.is_essential && (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      Essencial
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
              <button
                onClick={() => handleOpenModal(cat)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              {confirmDeleteId === cat.id ? (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      onDeleteCategory(cat.id);
                      setConfirmDeleteId(null);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white"
                  >
                    Excluir
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="p-1 text-slate-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(cat.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Category */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Farmácia, Combustível, Bônus..."
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Tipo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'EXPENSE' }))}
                    className={`py-1.5 rounded-xl text-xs font-semibold border ${
                      formData.type === 'EXPENSE'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'INCOME', is_essential: false }))}
                    className={`py-1.5 rounded-xl text-xs font-semibold border ${
                      formData.type === 'INCOME'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    Receita
                  </button>
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Cor de Identificação
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color: hex }))}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                      style={{ backgroundColor: hex }}
                    >
                      {formData.color === hex && <Check className="w-4 h-4 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Essential checkbox (only for expense) */}
              {formData.type === 'EXPENSE' && (
                <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    id="is_essential"
                    checked={formData.is_essential}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_essential: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="is_essential" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <span className="font-semibold">Gasto Essencial</span> (Custo de vida básico, alimentação, contas fixas, moradia)
                  </label>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Salvar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
