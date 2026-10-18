import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckSquare, 
  Square,
  Sparkles,
  Info
} from 'lucide-react';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { api } from '../api';

export default function ImportStatementModal({ isOpen, onClose, categories, onSuccess }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (selectedFile) => {
    const name = selectedFile.name.toLowerCase();
    if (!name.endsWith('.ofx') && !name.endsWith('.csv')) {
      setError('Formato não suportado. Por favor, envie arquivos no formato .ofx ou .csv.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setParsing(true);

    try {
      const result = await api.parseStatement(selectedFile);
      setParsedData(result);
    } catch (err) {
      setError(err.message || 'Falha ao processar o extrato. Verifique se o formato é válido.');
      setParsedData(null);
    } finally {
      setParsing(false);
    }
  };

  const handleToggleSelect = (index) => {
    if (!parsedData) return;
    const updated = [...parsedData.transactions];
    updated[index].selected = !updated[index].selected;
    setParsedData({ ...parsedData, transactions: updated });
  };

  const handleSelectAll = (select) => {
    if (!parsedData) return;
    const updated = parsedData.transactions.map(t => ({
      ...t,
      selected: select ? true : false
    }));
    setParsedData({ ...parsedData, transactions: updated });
  };

  const handleDeselectDuplicates = () => {
    if (!parsedData) return;
    const updated = parsedData.transactions.map(t => ({
      ...t,
      selected: t.is_duplicate ? false : t.selected
    }));
    setParsedData({ ...parsedData, transactions: updated });
  };

  const handleClearAllCategories = () => {
    if (!parsedData) return;
    const updated = parsedData.transactions.map(t => ({
      ...t,
      category_id: null,
      category_name: 'Sem categoria',
      category_color: '#94A3B8'
    }));
    setParsedData({ ...parsedData, transactions: updated });
  };

  const handleCategoryChange = (index, categoryId) => {
    if (!parsedData) return;
    const updated = [...parsedData.transactions];
    const cat = categories.find(c => c.id === Number(categoryId));
    updated[index].category_id = cat ? cat.id : null;
    updated[index].category_name = cat ? cat.name : 'Sem categoria';
    updated[index].category_color = cat ? cat.color : '#94A3B8';
    setParsedData({ ...parsedData, transactions: updated });
  };

  const handleDescriptionChange = (index, value) => {
    if (!parsedData) return;
    const updated = [...parsedData.transactions];
    updated[index].description = value;
    setParsedData({ ...parsedData, transactions: updated });
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;
    const selectedTxs = parsedData.transactions.filter(t => t.selected);
    if (selectedTxs.length === 0) {
      alert('Nenhuma transação selecionada para importar.');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const payload = selectedTxs.map(t => ({
        date: t.date,
        description: t.description,
        amount: Number(t.amount),
        type: t.type,
        sub_type: t.sub_type || 'REGULAR',
        category_id: t.category_id || null,
        payment_method: t.payment_method || 'PIX',
        notes: `Importado de ${parsedData.filename || 'extrato'}`
      }));

      const res = await api.confirmImport(payload);
      if (onSuccess) {
        await onSuccess(res);
      }
      handleReset();
      onClose();
    } catch (err) {
      setError(err.message || 'Erro ao salvar transações no banco.');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Calculations for stats
  const transactions = parsedData?.transactions || [];
  const selectedCount = transactions.filter(t => t.selected).length;
  const duplicateCount = transactions.filter(t => t.is_duplicate).length;
  const totalIncomeSelected = transactions
    .filter(t => t.selected && t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalExpenseSelected = transactions
    .filter(t => t.selected && t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Importação Inteligente de Extratos
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  OFX & CSV
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Suporte nativo para Nubank, Inter, Itaú, Bradesco, BB, Santander e outros bancos
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!parsedData ? (
            /* Upload State */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                isDragging 
                  ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 scale-[0.99]' 
                  : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".ofx,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
                {parsing ? 'Processando e categorizando extrato...' : 'Arraste seu extrato bancário aqui'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                ou clique para selecionar do seu computador. Aceitamos arquivos <strong>.OFX</strong> ou <strong>.CSV</strong>.
              </p>
              
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Categorização automática instantânea por palavras-chave
              </div>

              {parsing && (
                <div className="mt-6 flex items-center space-x-2 text-xs text-slate-500">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span>Lendo registros, aplicando regras e verificando duplicidades...</span>
                </div>
              )}
            </div>
          ) : (
            /* Parsed Review Table */
            <div className="space-y-4">
              {/* Summary Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Arquivo</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block" title={parsedData.filename}>
                    {parsedData.filename}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{parsedData.total_found} transações</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Entradas Selecionadas
                  </span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {formatCurrency(totalIncomeSelected)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20">
                  <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <ArrowDownLeft className="w-3.5 h-3.5" /> Saídas Selecionadas
                  </span>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5 block">
                    {formatCurrency(totalExpenseSelected)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Possíveis Duplicadas
                  </span>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                    {duplicateCount} detectada(s)
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-1">
                <div className="flex items-center space-x-2 text-xs">
                  <button
                    onClick={() => handleSelectAll(true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                  >
                    Selecionar Todas
                  </button>
                  <button
                    onClick={() => handleSelectAll(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                  >
                    Desmarcar Todas
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllCategories}
                    title="Remover sugestões de categoria para preencher manualmente"
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                  >
                    Deixar Categorias Vazias
                  </button>
                  {duplicateCount > 0 && (
                    <button
                      onClick={handleDeselectDuplicates}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-medium transition-colors"
                    >
                      Desmarcar Duplicadas ({duplicateCount})
                    </button>
                  )}
                </div>

                <button
                  onClick={handleReset}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
                >
                  Carregar outro arquivo
                </button>
              </div>

              {/* Transactions Review Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-[46vh] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">Sel.</th>
                      <th className="py-2.5 px-3 w-24">Data</th>
                      <th className="py-2.5 px-3">Descrição da Transação</th>
                      <th className="py-2.5 px-3 w-28">Tipo</th>
                      <th className="py-2.5 px-3 w-52">Categoria Sugerida</th>
                      <th className="py-2.5 px-3 text-right w-28">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {transactions.map((tx, idx) => {
                      const isExpense = tx.type === 'EXPENSE';
                      const relevantCategories = categories.filter(c => c.type === tx.type);

                      return (
                        <tr 
                          key={tx.id || idx}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                            tx.is_duplicate ? 'bg-amber-500/5' : ''
                          } ${!tx.selected ? 'opacity-50' : ''}`}
                        >
                          {/* Checkbox */}
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSelect(idx)}
                              className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                            >
                              {tx.selected ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </td>

                          {/* Date */}
                          <td className="py-2 px-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {formatDateBR(tx.date)}
                          </td>

                          {/* Description */}
                          <td className="py-2 px-3">
                            <div className="flex flex-col">
                              <input
                                type="text"
                                value={tx.description}
                                onChange={(e) => handleDescriptionChange(idx, e.target.value)}
                                className="w-full bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 focus:outline-none text-slate-800 dark:text-slate-200 py-0.5 text-xs font-medium"
                              />
                              {tx.is_duplicate && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                                  <AlertTriangle className="w-3 h-3" /> Possível duplicata já existente
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Type */}
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isExpense 
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {isExpense ? 'Despesa' : 'Receita'}
                            </span>
                          </td>

                          {/* Category Selector with Auto-suggestion */}
                          <td className="py-2 px-3">
                            <select
                              value={tx.category_id || ''}
                              onChange={(e) => handleCategoryChange(idx, e.target.value)}
                              className="w-full text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="">Selecione categoria...</option>
                              {relevantCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Amount */}
                          <td className="py-2 px-3 text-right font-bold whitespace-nowrap">
                            <span className={isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                              {isExpense ? '-' : '+'}{formatCurrency(tx.amount)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {parsedData && (
              <span>
                <strong>{selectedCount}</strong> de {parsedData.total_found} transações selecionadas
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              disabled={importing}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            {parsedData && (
              <button
                onClick={handleConfirmImport}
                disabled={importing || selectedCount === 0}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all ${
                  importing || selectedCount === 0
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 active:scale-[0.98]'
                }`}
              >
                {importing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Importando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Importar {selectedCount} Transações</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
