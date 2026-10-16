import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, DollarSign, Calendar, Tag, CreditCard, AlignLeft, Trash2 } from 'lucide-react';

export default function TransactionModal({ isOpen, onClose, onSave, onDelete, categories, editingTx }) {
  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: today,
    type: 'EXPENSE',
    sub_type: 'REGULAR',
    category_id: '',
    payment_method: 'PIX',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingTx) {
      setFormData({
        description: editingTx.description || '',
        amount: editingTx.amount || '',
        date: editingTx.date || today,
        type: editingTx.type || 'EXPENSE',
        sub_type: editingTx.sub_type || 'REGULAR',
        category_id: editingTx.category_id || '',
        payment_method: editingTx.payment_method || 'PIX',
        notes: editingTx.notes || '',
      });
    } else {
      setFormData({
        description: '',
        amount: '',
        date: today,
        type: 'EXPENSE',
        sub_type: 'REGULAR',
        category_id: '',
        payment_method: 'PIX',
        notes: '',
      });
    }
    setError('');
  }, [editingTx, isOpen]);

  const filteredCategories = categories.filter((c) => c.type === formData.type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      setError('Por favor, informe a descrição');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Por favor, informe um valor válido');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave({
        ...formData,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id ? Number(formData.category_id) : null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Erro ao salvar transação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transition-all transform animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {editingTx ? 'Editar Transação' : 'Nova Transação'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-200 dark:border-rose-900/50">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Tipo (Receita vs Despesa) Switch */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ 
                  ...prev, 
                  type: 'EXPENSE', 
                  sub_type: 'REGULAR', 
                  category_id: '' 
                }));
              }}
              className={`flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-bold transition-all ${
                formData.type === 'EXPENSE'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Despesa</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ 
                  ...prev, 
                  type: 'INCOME', 
                  sub_type: 'SALARY', 
                  category_id: '' 
                }));
              }}
              className={`flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-bold transition-all ${
                formData.type === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Receita / Entrada</span>
            </button>
          </div>

          {/* Subtype for Income (Salário, Adiantamento, Renda Extra) */}
          {formData.type === 'INCOME' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Tipo de Entrada
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'SALARY', label: 'Salário' },
                  { id: 'ADVANCE', label: 'Adiantamento' },
                  { id: 'EXTRA', label: 'Renda Extra' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, sub_type: item.id }))}
                    className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      formData.sub_type === item.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Descrição *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Mercado semanal, Salário..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Valor (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>
          </div>

          {/* Date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Data *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Categoria
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="">Selecione uma categoria</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.is_essential ? '★ (Essencial)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Forma de Pagamento
            </label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="PIX">PIX</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Cartão de Débito">Cartão de Débito</option>
              <option value="Boleto">Boleto Bancário</option>
              <option value="Transferência Bancária">Transferência / TED</option>
              <option value="Dinheiro">Dinheiro Físico</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Notas / Observações (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Compra parcelada 2/5, reembolso do trabalho..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              {editingTx && onDelete && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    if (window.confirm(`Tem certeza que deseja excluir "${editingTx.description}"?`)) {
                      setLoading(true);
                      try {
                        await onDelete(editingTx.id);
                        onClose();
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                  className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Salvando...' : editingTx ? 'Atualizar Transação' : 'Adicionar Transação'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
