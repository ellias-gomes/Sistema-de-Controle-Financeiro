import React, { useState, useEffect } from 'react';
import { 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  TrendingUp, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Filter, 
  PieChart, 
  Flame,
  Check,
  X
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { api } from '../api';

export default function BudgetingView({ selectedMonth, categories, onRefreshNeeded }) {
  const [budgetOverview, setBudgetOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'budgeted', 'warning', 'exceeded'
  
  // Edit limit modal state
  const [editingCategory, setEditingCategory] = useState(null);
  const [inputLimit, setInputLimit] = useState('');
  const [savingLimit, setSavingLimit] = useState(false);

  const loadBudgetSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getBudgetsSummary(selectedMonth);
      setBudgetOverview(data);
    } catch (err) {
      console.error('Erro ao carregar orçamentos:', err);
      setError(err.message || 'Falha ao buscar orçamentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgetSummary();
  }, [selectedMonth]);

  const handleOpenEdit = (item) => {
    setEditingCategory(item);
    setInputLimit(item.monthly_limit > 0 ? String(item.monthly_limit) : '');
  };

  const handleSaveBudget = async () => {
    if (!editingCategory) return;
    const num = parseFloat(inputLimit.replace(',', '.'));
    if (isNaN(num) || num <= 0) {
      alert('Por favor, informe um valor de teto mensal positivo.');
      return;
    }

    setSavingLimit(true);
    try {
      await api.setCategoryBudget(editingCategory.category_id, num);
      setEditingCategory(null);
      await loadBudgetSummary();
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (err) {
      alert('Erro ao salvar orçamento: ' + err.message);
    } finally {
      setSavingLimit(false);
    }
  };

  const handleDeleteBudget = async (categoryId) => {
    if (!window.confirm('Deseja realmente remover o teto orçamentário desta categoria?')) {
      return;
    }
    try {
      await api.deleteCategoryBudget(categoryId);
      await loadBudgetSummary();
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (err) {
      alert('Erro ao remover orçamento: ' + err.message);
    }
  };

  const items = budgetOverview?.items || [];
  
  // Filtering
  const filteredItems = items.filter(item => {
    const matchSearch = item.category_name.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;

    if (filterMode === 'budgeted') return item.is_budget_set;
    if (filterMode === 'warning') return item.is_budget_set && item.status === 'warning';
    if (filterMode === 'exceeded') return item.is_budget_set && item.status === 'exceeded';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Highlights */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-emerald-500" />
              Metas de Economia & Orçamento Teto
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Budgeting
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Defina limites máximos de gastos por categoria e acompanhe o consumo em tempo real para evitar estouros.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {budgetOverview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Budgeted */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">Orçamento Total Estipulado</span>
              <Target className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(budgetOverview.total_budgeted)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {budgetOverview.categories_with_budget} categorias com teto ativo
            </span>
          </div>

          {/* Total Spent in Budgeted */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">Consumido no Mês</span>
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(budgetOverview.total_spent_budgeted)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold mt-1">
              <span className={budgetOverview.overall_percentage >= 100 ? 'text-rose-600' : 'text-slate-500'}>
                {budgetOverview.overall_percentage}% do teto consumido
              </span>
            </div>
          </div>

          {/* Remaining Budget */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">Saldo Disponível / Economia</span>
              <TrendingUp className="w-4 h-4 text-teal-500" />
            </div>
            <div className={`text-xl font-bold ${budgetOverview.total_remaining_budgeted >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(budgetOverview.total_remaining_budgeted)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {budgetOverview.total_remaining_budgeted >= 0 ? 'Dentro do planejado' : 'Estouro orçamentário'}
            </span>
          </div>

          {/* Alerts Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium">Situação de Alertas</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              {budgetOverview.categories_exceeded > 0 ? (
                <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold">
                  {budgetOverview.categories_exceeded} estourada(s)
                </span>
              ) : null}
              {budgetOverview.categories_warning > 0 ? (
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
                  {budgetOverview.categories_warning} em atenção
                </span>
              ) : null}
              {budgetOverview.categories_exceeded === 0 && budgetOverview.categories_warning === 0 && (
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Controlado
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 mt-1.5 block">Monitoramento em tempo real</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar categoria..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Todas ({items.length})
          </button>
          <button
            onClick={() => setFilterMode('budgeted')}
            className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              filterMode === 'budgeted'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Com Teto ({items.filter(i => i.is_budget_set).length})
          </button>
          <button
            onClick={() => setFilterMode('warning')}
            className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              filterMode === 'warning'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Atenção ≥ 80% ({items.filter(i => i.status === 'warning').length})
          </button>
          <button
            onClick={() => setFilterMode('exceeded')}
            className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              filterMode === 'exceeded'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Estouradas ({items.filter(i => i.status === 'exceeded').length})
          </button>
        </div>
      </div>

      {/* Categories Budget Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Carregando tetos orçamentários...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhuma categoria encontrada</p>
          <p className="text-xs text-slate-400 mt-1">Ajuste os filtros ou adicione um teto orçamentário para suas categorias.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map(item => {
            const hasBudget = item.is_budget_set;
            const pct = item.percentage_used;
            const isExceeded = item.status === 'exceeded';
            const isWarning = item.status === 'warning';

            // Progress bar color dynamic classes
            let barColor = 'bg-emerald-500';
            let badgeBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
            let statusText = 'Normal';

            if (isExceeded) {
              barColor = 'bg-rose-500 animate-pulse';
              badgeBg = 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
              statusText = 'Estourado!';
            } else if (isWarning) {
              barColor = 'bg-amber-500';
              badgeBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
              statusText = 'Atenção';
            }

            return (
              <div 
                key={item.category_id}
                className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-150 ${
                  isExceeded 
                    ? 'border-rose-500/30 dark:border-rose-500/30 shadow-xs' 
                    : isWarning 
                    ? 'border-amber-500/30 dark:border-amber-500/30 shadow-xs' 
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-2.5">
                    <div 
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {item.category_name}
                        {item.is_essential && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            Essencial
                          </span>
                        )}
                      </h3>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {hasBudget ? `Teto mensal de ${formatCurrency(item.monthly_limit)}` : 'Sem teto definido'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      title={hasBudget ? "Alterar Teto" : "Definir Teto"}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {hasBudget && (
                      <button
                        onClick={() => handleDeleteBudget(item.category_id)}
                        title="Remover Teto"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {hasBudget ? (
                  <>
                    {/* Spending Metrics */}
                    <div className="flex items-baseline justify-between mb-2">
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                          {formatCurrency(item.current_spent)}
                        </span>
                        <span className="text-xs text-slate-400">
                          / {formatCurrency(item.monthly_limit)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeBg}`}>
                          {statusText} ({pct}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-2 relative">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>
                        {isExceeded ? (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            Excedido por {formatCurrency(Math.abs(item.remaining_amount))}
                          </span>
                        ) : (
                          <span>
                            Resta <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(item.remaining_amount)}</strong>
                          </span>
                        )}
                      </span>
                      <span>{pct}% utilizado</span>
                    </div>
                  </>
                ) : (
                  <div className="pt-2 pb-1 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Gasto atual no mês: <strong className="text-slate-600 dark:text-slate-300">{formatCurrency(item.current_spent)}</strong>
                    </span>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="flex items-center space-x-1 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Definir Teto</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit/Create Limit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" />
                Definir Limite de Gastos
              </h3>
              <button 
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Categoria: <strong className="text-slate-800 dark:text-slate-200">{editingCategory.category_name}</strong>
              </p>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Teto Máximo Mensal (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={inputLimit}
                  onChange={(e) => setInputLimit(e.target.value)}
                  placeholder="Ex: 800.00"
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                O FinFlow avisará visualmente caso os gastos atinjam 80% e 100% desse limite.
              </span>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveBudget}
                disabled={savingLimit}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
              >
                {savingLimit ? 'Salvando...' : 'Salvar Teto'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
