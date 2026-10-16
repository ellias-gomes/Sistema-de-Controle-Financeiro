import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { ArrowUpRight, ArrowDownLeft, ShieldCheck, Tag } from 'lucide-react';

export default function ChartsSection({ data, onSelectTab, onEditTransaction }) {
  if (!data) return null;

  const categoryData = data.categories_breakdown || [];
  const trendData = data.monthly_trend || [];
  const recentTransactions = data.recent_transactions || [];

  // Custom tooltip for Pie Chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900/90 dark:bg-slate-800/90 text-white p-2.5 rounded-xl shadow-lg border border-slate-700 text-xs backdrop-blur-sm">
          <p className="font-semibold">{item.category_name}</p>
          <p className="text-emerald-400 font-bold">{formatCurrency(item.total_amount)}</p>
          <p className="text-slate-300">{item.percentage}% do total</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for Bar Chart
  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 dark:bg-slate-800/90 text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs backdrop-blur-sm">
          <p className="font-semibold mb-1 text-slate-300">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="font-medium">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico 1: Evolução Mensal (Receitas vs Despesas) - 7 cols */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1E293B] rounded-2xl p-5 sm:p-6 border border-slate-200/70 dark:border-slate-800 shadow-soft dark:shadow-soft-dark">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Evolução Mensal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparativo de Receitas vs Despesas nos últimos meses
              </p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#94A3B8" 
                    fontSize={11} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#94A3B8" 
                    fontSize={11} 
                    tickLine={false} 
                    tickFormatter={(val) => `R$${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`} 
                  />
                  <RechartsTooltip content={<CustomBarTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle" 
                    wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} 
                  />
                  <Bar dataKey="income" name="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="expense" name="Despesas" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Nenhum dado histórico registrado
              </div>
            )}
          </div>
        </div>

        {/* Gráfico 2: Despesas por Categoria (Donut) - 5 cols */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1E293B] rounded-2xl p-5 sm:p-6 border border-slate-200/70 dark:border-slate-800 shadow-soft dark:shadow-soft-dark flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Despesas por Categoria
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribuição percentual dos gastos no mês selecionado
            </p>
          </div>

          <div className="h-56 sm:h-60 w-full my-auto flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <RechartsTooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={categoryData}
                    dataKey="total_amount"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#6366F1'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs text-center py-10">
                Nenhuma despesa registrada neste mês
              </div>
            )}
          </div>

          {/* Categorias Legend list */}
          <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 mt-2">
            {categoryData.slice(0, 5).map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                    {cat.category_name}
                  </span>
                  {cat.is_essential && (
                    <ShieldCheck className="w-3 h-3 text-amber-500 flex-shrink-0" title="Despesa Essencial" />
                  )}
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-slate-500 dark:text-slate-400">{cat.percentage}%</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(cat.total_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de Transações Recentes */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 sm:p-6 border border-slate-200/70 dark:border-slate-800 shadow-soft dark:shadow-soft-dark">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Transações Recentes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Últimas movimentações financeiras inseridas
            </p>
          </div>
          <button
            onClick={() => onSelectTab('transactions')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Ver todas →
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentTransactions.map((tx) => {
            const isIncome = tx.type === 'INCOME';
            return (
              <div 
                key={tx.id} 
                onClick={() => onEditTransaction && onEditTransaction(tx)}
                className="py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-xl px-2.5 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isIncome 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}>
                    {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {tx.description}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{formatDateBR(tx.date)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {tx.category ? tx.category.name : 'Sem Categoria'}
                      </span>
                      {tx.payment_method && (
                        <>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                            {tx.payment_method}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-4">
                  <p className={`text-sm font-bold ${
                    isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                  {isIncome && tx.sub_type !== 'REGULAR' && (
                    <span className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-300">
                      {tx.sub_type === 'SALARY' ? 'Salário' : tx.sub_type === 'ADVANCE' ? 'Adiantamento' : 'Renda Extra'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
