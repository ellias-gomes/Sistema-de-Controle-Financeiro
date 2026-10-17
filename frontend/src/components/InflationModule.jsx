import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip,
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  ShieldCheck, 
  Sliders, 
  DollarSign, 
  AlertCircle, 
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { api } from '../api';

export default function InflationModule() {
  const [annualRate, setAnnualRate] = useState(4.5);
  const [monthsAhead, setMonthsAhead] = useState(12);
  const [lookbackMonths, setLookbackMonths] = useState(3);
  const [includeDiscretionary, setIncludeDiscretionary] = useState(false); // Default to essential living cost!
  const [excludeCurrentMonth, setExcludeCurrentMonth] = useState(false);

  const [loading, setLoading] = useState(false);
  const [projectionData, setProjectionData] = useState(null);
  const [error, setError] = useState(null);

  const fetchProjection = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getInflationProjection({
        annualRate,
        monthsAhead,
        lookbackMonths,
        includeDiscretionary,
        excludeCurrentMonth,
      });
      setProjectionData(res);
    } catch (err) {
      console.error(err);
      setError('Não foi possível calcular a projeção. Verifique a conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjection();
  }, [annualRate, monthsAhead, lookbackMonths, includeDiscretionary, excludeCurrentMonth]);

  const presetRates = [3.5, 4.5, 5.5, 7.0];

  // Tooltip for projection chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 dark:bg-slate-800/90 text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs backdrop-blur-sm">
          <p className="font-bold text-slate-200 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="font-medium">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
          {payload[0]?.payload?.inflation_impact > 0 && (
            <p className="text-amber-400 font-semibold mt-1 pt-1 border-t border-slate-700">
              Impacto da inflação: +{formatCurrency(payload[0].payload.inflation_impact)}/mês
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const baselineCost = projectionData 
    ? (includeDiscretionary ? projectionData.baseline_total_avg : projectionData.baseline_essential_avg)
    : 0;

  const finalMonthObj = projectionData?.projected_months?.[projectionData.projected_months.length - 1];
  const finalProjectedCost = finalMonthObj 
    ? (includeDiscretionary ? finalMonthObj.projected_total_cost : finalMonthObj.projected_essential_cost)
    : 0;

  const totalMonthlyIncrease = finalProjectedCost - baselineCost;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800 shadow-soft dark:shadow-soft-dark flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Simulador de Custo de Vida & Inflação Futura
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Projete o impacto do aumento de preços sobre seus gastos essenciais e custo de vida nos próximos meses
          </p>
        </div>

        {/* Essential Switch */}
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl">
          <button
            onClick={() => setIncludeDiscretionary(false)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !includeDiscretionary
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Apenas Essenciais</span>
          </button>
          <button
            onClick={() => setIncludeDiscretionary(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              includeDiscretionary
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <span>Todos os Gastos</span>
          </button>
        </div>
      </div>

      {/* Simulator Control Inputs */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800 shadow-soft dark:shadow-soft-dark">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Rate Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Taxa de Inflação Anual Estimada (%)
            </label>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={annualRate}
                  onChange={(e) => setAnnualRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-bold rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                  % a.a.
                </span>
              </div>
            </div>
            {/* Presets */}
            <div className="flex items-center space-x-1.5 mt-2">
              <span className="text-[11px] text-slate-400">Exemplos:</span>
              {presetRates.map((rate) => (
                <button
                  key={rate}
                  onClick={() => setAnnualRate(rate)}
                  className={`text-[11px] px-2 py-0.5 rounded-md border font-medium transition-colors ${
                    annualRate === rate
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
          </div>

          {/* Horizon Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Horizonte da Projeção
              </label>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {monthsAhead} meses
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="24"
              step="3"
              value={monthsAhead}
              onChange={(e) => setMonthsAhead(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>3 meses</span>
              <span>6 meses</span>
              <span>12 meses (1 ano)</span>
              <span>24 meses (2 anos)</span>
            </div>
          </div>

          {/* Lookback Average Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Base de Histórico Real
            </label>
            <select
              value={lookbackMonths}
              onChange={(e) => setLookbackMonths(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value={1}>Último mês registrado</option>
              <option value={3}>Média dos últimos 3 meses (Recomendado)</option>
              <option value={6}>Média dos últimos 6 meses</option>
              <option value={12}>Média dos últimos 12 meses</option>
              <option value={0}>Todo o histórico registrado</option>
            </select>
            <div className="mt-2 flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer select-none text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={excludeCurrentMonth}
                  onChange={(e) => setExcludeCurrentMonth(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Excluir mês atual incompleto</span>
              </label>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Média mensal calculada pela soma das transações por categoria.
            </p>
          </div>
        </div>

        {/* Historical Months Badge */}
        {projectionData?.months_analyzed?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
            <div className="flex items-center space-x-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span>
                <strong>Meses analisados:</strong> {projectionData.months_analyzed.join(', ')} ({projectionData.months_count} {projectionData.months_count === 1 ? 'mês' : 'meses'}).
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-1 rounded-lg">
              Média mensal = soma das transações de cada categoria ÷ {projectionData.months_count} {projectionData.months_count === 1 ? 'mês' : 'meses'}
            </span>
          </div>
        )}
      </div>

      {/* KPI Projection Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Baseline Cost */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 shadow-soft dark:shadow-soft-dark">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Custo Atual Médio
          </span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(baselineCost)}
            <span className="text-xs font-normal text-slate-400">/mês</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {includeDiscretionary ? 'Todas as despesas' : 'Apenas gastos essenciais'}
          </p>
        </div>

        {/* Projected Future Cost */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 shadow-soft dark:shadow-soft-dark">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Custo Projetado em {monthsAhead}m
          </span>
          <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(finalProjectedCost)}
            <span className="text-xs font-normal text-slate-400">/mês</span>
          </h3>
          <p className="text-[11px] text-rose-500/80 mt-0.5">
            +{formatCurrency(totalMonthlyIncrease)} a mais por mês (+{formatPercent((totalMonthlyIncrease / (baselineCost || 1)) * 100)})
          </p>
        </div>

        {/* Inflation Monthly Compounding */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 shadow-soft dark:shadow-soft-dark">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Inflação Efetiva Mensal
          </span>
          <h3 className="text-xl font-bold text-amber-500 mt-1">
            {projectionData ? `${projectionData.monthly_effective_rate}%` : '0.0%'}
            <span className="text-xs font-normal text-slate-400">/mês</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Equivalente composto a {annualRate}% ao ano
          </p>
        </div>

        {/* Total Extra Out-of-pocket */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 shadow-soft dark:shadow-soft-dark">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Impacto Acumulado no Período
          </span>
          <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            +{formatCurrency(projectionData?.total_extra_cost_period || 0)}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Total desembolsado a mais nos {monthsAhead} meses
          </p>
        </div>
      </div>

      {/* Projection Chart */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 sm:p-6 border border-slate-200/70 dark:border-slate-800 shadow-soft dark:shadow-soft-dark">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Curva de Custo de Vida Projetada
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evolução mensal estimada do orçamento com base na taxa de inflação de {annualRate}% a.a.
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          {projectionData?.projected_months?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={projectionData.projected_months}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorEssential" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis 
                  dataKey="month_label" 
                  stroke="#94A3B8" 
                  fontSize={11} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#94A3B8" 
                  fontSize={11} 
                  tickLine={false} 
                  tickFormatter={(val) => `R$${val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}`} 
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="projected_essential_cost" 
                  name="Custo Essencial" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorEssential)" 
                />
                {includeDiscretionary && (
                  <Area 
                    type="monotone" 
                    dataKey="projected_total_cost" 
                    name="Custo Total de Vida" 
                    stroke="#6366F1" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              {loading ? 'Calculando projeções...' : 'Nenhum dado disponível'}
            </div>
          )}
        </div>
      </div>

      {/* Categories Impact Breakdown Table */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-soft dark:shadow-soft-dark overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Impacto da Inflação por Categoria
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comparativo entre a média mensal (soma das transações ÷ {projectionData?.months_count || 1} {projectionData?.months_count === 1 ? 'mês' : 'meses'}) e o custo projetado ao término de {monthsAhead} meses
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Classificação</th>
                {projectionData?.months_count > 1 && (
                  <th className="py-3 px-4 text-right">Total Período ({projectionData.months_count}m)</th>
                )}
                <th className="py-3 px-4 text-right">Média Mensal Base</th>
                <th className="py-3 px-4 text-right">Custo Projetado ({monthsAhead}m)</th>
                <th className="py-3 px-4 text-right">Aumento Estimado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {projectionData?.categories_projections?.map((cat, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span>{cat.category_name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    {cat.is_essential ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold text-[11px]">
                        <ShieldCheck className="w-3 h-3 text-amber-500" />
                        Essencial
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Estilo de Vida</span>
                    )}
                  </td>
                  {projectionData?.months_count > 1 && (
                    <td className="py-3.5 px-4 text-right text-slate-500 dark:text-slate-400 text-xs">
                      {formatCurrency(cat.total_period_amount || 0)}
                    </td>
                  )}
                  <td className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-200 font-medium">
                    {formatCurrency(cat.baseline_average)}
                    <span className="text-[10px] text-slate-400 block font-normal">/mês</span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                    {formatCurrency(cat.projected_final_cost)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-rose-600 dark:text-rose-400 text-xs">
                    +{formatCurrency(cat.increase_amount)} (+{cat.increase_percentage}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
