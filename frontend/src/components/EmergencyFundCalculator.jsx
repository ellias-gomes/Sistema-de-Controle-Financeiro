import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Coins, 
  Layers, 
  Sliders, 
  ArrowRight,
  Info
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { api } from '../api';

export default function EmergencyFundCalculator() {
  const [lookbackMonths, setLookbackMonths] = useState(3);
  const [annualRate, setAnnualRate] = useState(4.5);
  const [customAssets, setCustomAssets] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useCustomAssets, setUseCustomAssets] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const parsedAssets = useCustomAssets && customAssets !== '' ? parseFloat(customAssets) : null;
      const res = await api.getEmergencyFundOverview({
        lookbackMonths,
        annualRate,
        customLiquidAssets: parsedAssets
      });
      setData(res);
      if (!useCustomAssets && res.current_liquid_assets !== undefined) {
        setCustomAssets(String(res.current_liquid_assets));
      }
    } catch (err) {
      console.error('Erro ao calcular reserva:', err);
      setError(err.message || 'Falha ao calcular reserva de emergência.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [lookbackMonths, annualRate, useCustomAssets]);

  const handleApplyCustomAssets = (e) => {
    e.preventDefault();
    loadData();
  };

  const getStatusBadge = (monthsCovered) => {
    if (monthsCovered >= 12) {
      return {
        label: 'Fortaleza Financeira',
        color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        icon: ShieldCheck,
        desc: 'Excelente! Você tem mais de 1 ano de custos essenciais totalmente cobertos.'
      };
    }
    if (monthsCovered >= 6) {
      return {
        label: 'Padrão Ouro de Segurança',
        color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        icon: ShieldCheck,
        desc: 'Parabéns! Sua reserva cobre confortavelmente o período recomendado para imprevistos.'
      };
    }
    if (monthsCovered >= 3) {
      return {
        label: 'Estabilidade Básica',
        color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
        icon: Clock,
        desc: 'Bom início. Você suporta 3 meses de despesas essenciais, mas buscar 6 meses traz maior tranquilidade.'
      };
    }
    return {
      label: 'Abaixo do Recomendado',
      color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
      icon: ShieldAlert,
      desc: 'Atenção: seu saldo atual cobre menos de 3 meses de despesas básicas. Priorize a formação da reserva.'
    };
  };

  const status = data ? getStatusBadge(data.months_covered_essential) : null;
  const StatusIcon = status?.icon || ShieldCheck;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              Calculadora de Reserva de Emergência Dinâmica
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Segurança Patrimonial
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dimensiona sua reserva com base no seu custo de vida essencial real e projeta o poder de compra futuro frente à inflação.
          </p>
        </div>
      </div>

      {/* Control Panel: Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        
        {/* Lookback selection */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Histórico Base de Despesas</span>
            <span className="text-[11px] text-slate-400 font-semibold">{lookbackMonths} meses</span>
          </label>
          <select
            value={lookbackMonths}
            onChange={(e) => setLookbackMonths(Number(e.target.value))}
            className="w-full text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            <option value={1}>Último mês disponível</option>
            <option value={3}>Média dos últimos 3 meses (Recomendado)</option>
            <option value={6}>Média dos últimos 6 meses</option>
            <option value={12}>Média dos últimos 12 meses (Ano completo)</option>
          </select>
        </div>

        {/* Inflation rate */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Inflação Anual Projetada</span>
            <span className="text-[11px] text-slate-400 font-semibold">{annualRate}% a.a.</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={annualRate}
              onChange={(e) => setAnnualRate(parseFloat(e.target.value) || 0)}
              className="w-full text-xs py-2 pl-3 pr-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
          </div>
        </div>

        {/* Custom liquid assets simulator */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Patrimônio Líquido para Reserva</span>
            <button
              type="button"
              onClick={() => {
                const nextVal = !useCustomAssets;
                setUseCustomAssets(nextVal);
              }}
              className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {useCustomAssets ? 'Usar saldo do app' : 'Simular outro valor'}
            </button>
          </label>
          <form onSubmit={handleApplyCustomAssets} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">R$</span>
              <input
                type="number"
                step="0.01"
                disabled={!useCustomAssets}
                value={customAssets}
                onChange={(e) => setCustomAssets(e.target.value)}
                placeholder="0.00"
                className={`w-full text-xs py-2 pl-8 pr-2 rounded-xl border focus:outline-none font-semibold ${
                  useCustomAssets
                    ? 'bg-slate-50 dark:bg-slate-800 border-emerald-500 text-slate-900 dark:text-white'
                    : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-500'
                }`}
              />
            </div>
            {useCustomAssets && (
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                Aplicar
              </button>
            )}
          </form>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Calculando dimensões da reserva...</p>
        </div>
      ) : data ? (
        <>
          {/* Main Hero Card: Coverage Diagnostic */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              
              <div className="space-y-3 max-w-xl">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  <span>{status.label}</span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    Seu patrimônio cobre{' '}
                    <span className="text-emerald-600 dark:text-emerald-400 underline decoration-emerald-500/40 decoration-4">
                      {data.months_covered_essential} meses
                    </span>{' '}
                    de custos essenciais
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {status.desc} (Ou {data.months_covered_total} meses considerando seu estilo de vida integral com lazer).
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Patrimônio Líquido Atual:</span>
                    <strong className="text-slate-900 dark:text-white font-bold text-sm">
                      {formatCurrency(data.current_liquid_assets)}
                    </strong>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Custo Essencial Mensal:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      {formatCurrency(data.monthly_essential_avg)}/mês
                    </strong>
                  </div>
                </div>
              </div>

              {/* Visual Gauge Bar */}
              <div className="w-full lg:w-80 p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-center">
                <div className="flex items-center justify-between text-xs font-semibold mb-2 text-slate-700 dark:text-slate-200">
                  <span>Progresso da Cobertura</span>
                  <span>{data.months_covered_essential} de 6 meses</span>
                </div>

                <div className="w-full h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden relative">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      data.months_covered_essential >= 6 ? 'bg-emerald-500' : data.months_covered_essential >= 3 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min((data.months_covered_essential / 6) * 100, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
                  <span>0 meses</span>
                  <span className="text-amber-500 font-semibold">3m (Básico)</span>
                  <span className="text-emerald-500 font-semibold">6m (Meta Ouro)</span>
                </div>
              </div>

            </div>
          </div>

          {/* 3 Target Profile Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.targets.map(target => {
              const isReached = target.is_reached;
              return (
                <div 
                  key={target.months}
                  className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-150 flex flex-col justify-between ${
                    isReached 
                      ? 'border-emerald-500/40 shadow-xs' 
                      : 'border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {target.months} Meses de Cobertura
                      </span>
                      {isReached ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Atingido!
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Em construção
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {formatCurrency(target.target_amount)}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {target.profile_label}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      {isReached ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Patrimônio líquido suficiente para este alvo
                        </span>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Faltam para a meta:</span>
                          <strong className="text-rose-600 dark:text-rose-400 font-bold">
                            {formatCurrency(target.coverage_gap)}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Future inflation impact on this target */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/30 p-2.5 rounded-xl space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      Evolução com Inflação (+{annualRate}% a.a.):
                    </span>
                    <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300">
                      <span>Em 12 meses: <strong>{formatCurrency(target.projected_12m)}</strong></span>
                      <span>Em 24 meses: <strong>{formatCurrency(target.projected_24m)}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Educational & Practical Context Card */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-slate-600 dark:text-slate-300 flex items-start space-x-3">
            <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-slate-900 dark:text-white block font-semibold">
                Como funciona o cálculo dinâmico da Reserva de Emergência?
              </strong>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                A reserva de emergência é calculada com base estritamente nas despesas das suas categorias marcadas como 
                <strong> Essenciais</strong> (como Moradia, Alimentação Básica, Contas e Saúde). Em momentos de crise ou desemprego,
                gastos discricionários (como viagens, bares e compras supérfluas) são cortados, permitindo que cada real guardado 
                renda significativamente mais meses de tranquilidade para você e sua família.
              </p>
            </div>
          </div>
        </>
      ) : null}

    </div>
  );
}
