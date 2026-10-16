import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  X
} from 'lucide-react';
import { formatCurrency, formatDateBR } from '../utils/formatters';

export default function TransactionsView({ 
  transactions, 
  categories, 
  filters, 
  setFilters, 
  onEditTransaction, 
  onDeleteTransaction, 
  onOpenNewTransaction 
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleClearFilters = () => {
    setFilters({
      search: '',
      type: '',
      sub_type: '',
      category_id: '',
      month: filters.month || ''
    });
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.type || filters.sub_type || filters.category_id
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Filters Bar */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800 shadow-soft dark:shadow-soft-dark space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Gestão de Transações
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Controle detalhado de entradas, despesas e adiantamentos
            </p>
          </div>
          <button
            onClick={onOpenNewTransaction}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Transação</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar descrição ou notas..."
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Type filter */}
          <div>
            <select
              value={filters.type || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="">Todos os Tipos</option>
              <option value="INCOME">Apenas Receitas (+)</option>
              <option value="EXPENSE">Apenas Despesas (-)</option>
            </select>
          </div>

          {/* Sub-type filter */}
          <div>
            <select
              value={filters.sub_type || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, sub_type: e.target.value }))}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="">Todas as Fontes</option>
              <option value="SALARY">Salário</option>
              <option value="ADVANCE">Adiantamento</option>
              <option value="EXTRA">Renda Extra</option>
              <option value="REGULAR">Regular / Geral</option>
            </select>
          </div>

          {/* Category filter */}
          <div>
            <select
              value={filters.category_id || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, category_id: e.target.value }))}
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === 'INCOME' ? 'Receita' : 'Despesa'})
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center justify-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-soft dark:shadow-soft-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Classificação</th>
                <th className="py-3 px-4">Pagamento</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {transactions.length > 0 ? (
                transactions.map((tx) => {
                  const isIncome = tx.type === 'INCOME';
                  return (
                    <tr 
                      key={tx.id} 
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Data */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {formatDateBR(tx.date)}
                      </td>

                      {/* Descrição */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        <div className="truncate">{tx.description}</div>
                        {tx.notes && (
                          <div className="text-[11px] font-normal text-slate-400 truncate mt-0.5">
                            {tx.notes}
                          </div>
                        )}
                      </td>

                      {/* Categoria */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {tx.category ? (
                          <span 
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: `${tx.category.color}15`, 
                              color: tx.category.color 
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tx.category.color }} />
                            {tx.category.name}
                            {tx.category.is_essential && (
                              <ShieldCheck className="w-3 h-3 text-amber-500" title="Despesa Essencial" />
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sem categoria</span>
                        )}
                      </td>

                      {/* Classificação / Sub-type */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        {isIncome ? (
                          <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase ${
                            tx.sub_type === 'SALARY' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                            tx.sub_type === 'ADVANCE' ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300' :
                            tx.sub_type === 'EXTRA' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {tx.sub_type === 'SALARY' ? 'Salário' : tx.sub_type === 'ADVANCE' ? 'Adiantamento' : tx.sub_type === 'EXTRA' ? 'Renda Extra' : 'Receita'}
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400 text-xs">
                            {tx.category?.is_essential ? 'Essencial' : 'Discricionário'}
                          </span>
                        )}
                      </td>

                      {/* Forma de Pagamento */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        {tx.payment_method || '—'}
                      </td>

                      {/* Valor */}
                      <td className={`py-3.5 px-4 whitespace-nowrap text-right font-bold text-sm ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-1">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          title="Editar"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        {confirmDeleteId === tx.id ? (
                          <div className="inline-flex items-center space-x-1">
                            <button
                              onClick={async () => {
                                const idToDelete = tx.id;
                                setConfirmDeleteId(null);
                                await onDeleteTransaction(idToDelete);
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-600 text-white hover:bg-rose-500 shadow-sm"
                            >
                              Excluir
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-slate-200"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(tx.id)}
                            title="Excluir"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    Nenhuma transação encontrada com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
