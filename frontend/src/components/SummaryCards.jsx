import React from 'react';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  PiggyBank, 
  ShieldCheck, 
  Sparkles,
  Briefcase,
  Coins
} from 'lucide-react';

export default function SummaryCards({ data }) {
  if (!data) return null;

  const isNetPositive = data.month_net >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
      {/* 1. Saldo Geral Acumulado */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800 shadow-soft dark:shadow-soft-dark transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Saldo Total Acumulado
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className={`text-2xl font-bold tracking-tight ${data.total_balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(data.total_balance)}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Total em conta considerando todo histórico
          </p>
        </div>
      </div>

      {/* 2. Entradas do Mês + Detalhamento (Salário, Adiantamento, Extra) */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800 shadow-soft dark:shadow-soft-dark transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Receitas do Mês
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(data.month_income)}
          </h3>
          {/* Subtypes breakdown */}
          <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
            {data.income_breakdown?.salary > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium">
                <Briefcase className="w-3 h-3" />
                Sal: {formatCurrency(data.income_breakdown.salary)}
              </span>
            )}
            {data.income_breakdown?.advance > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-medium">
                <Coins className="w-3 h-3" />
                Adiant: {formatCurrency(data.income_breakdown.advance)}
              </span>
            )}
            {data.income_breakdown?.extra > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium">
                <Sparkles className="w-3 h-3" />
                Extra: {formatCurrency(data.income_breakdown.extra)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Despesas do Mês + Essenciais vs Estilo de Vida */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800 shadow-soft dark:shadow-soft-dark transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Despesas do Mês
          </span>
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            -{formatCurrency(data.month_expense)}
          </h3>
          {/* Essential vs Discretionary */}
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-500" />
              Essenciais: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(data.essential_expense_total)}</strong>
            </span>
            <span>
              Lazer/Outros: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(data.lifestyle_expense_total)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 4. Resultado Líquido & Taxa de Poupança */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800 shadow-soft dark:shadow-soft-dark transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Resultado do Mês
          </span>
          <div className={`w-8 h-8 rounded-xl ${isNetPositive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'} flex items-center justify-center`}>
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline space-x-2">
            <h3 className={`text-2xl font-bold tracking-tight ${isNetPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isNetPositive ? '+' : ''}{formatCurrency(data.month_net)}
            </h3>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isNetPositive 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
            }`}>
              {formatPercent(data.savings_rate)} salvo
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isNetPositive ? 'Superávit financeiro mensal' : 'Atenção: despesas excederam receitas'}
          </p>
        </div>
      </div>
    </div>
  );
}
