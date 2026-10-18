import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SummaryCards from './components/SummaryCards';
import ChartsSection from './components/ChartsSection';
import TransactionsView from './components/TransactionsView';
import TransactionModal from './components/TransactionModal';
import CategoriesView from './components/CategoriesView';
import InflationModule from './components/InflationModule';
import BudgetingView from './components/BudgetingView';
import EmergencyFundCalculator from './components/EmergencyFundCalculator';
import ImportStatementModal from './components/ImportStatementModal';
import { api } from './api';

export default function App() {
  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('finflow_dark_mode') === 'true' || 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for transactions tab
  const [txFilters, setTxFilters] = useState({
    search: '',
    type: '',
    sub_type: '',
    category_id: '',
    month: currentMonthStr,
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Apply dark mode class to <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('finflow_dark_mode', darkMode);
  }, [darkMode]);

  // Sync selectedMonth with txFilters.month
  useEffect(() => {
    setTxFilters(prev => ({ ...prev, month: selectedMonth }));
  }, [selectedMonth]);

  // Load Categories
  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  };

  // Load Dashboard Data
  const loadDashboardData = async () => {
    try {
      const data = await api.getDashboardOverview(selectedMonth);
      setDashboardData(data);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    }
  };

  // Load Transactions
  const loadTransactions = async () => {
    try {
      const data = await api.getTransactions(txFilters);
      setTransactions(data);
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadCategories(), loadDashboardData(), loadTransactions()]);
      setLoading(false);
    };
    init();
  }, []);

  // When month changes, reload dashboard and transactions
  useEffect(() => {
    loadDashboardData();
  }, [selectedMonth]);

  useEffect(() => {
    loadTransactions();
  }, [txFilters]);

  // When switching to Dashboard tab, ensure freshest dashboard overview
  useEffect(() => {
    if (currentTab === 'dashboard') {
      loadDashboardData();
    } else if (currentTab === 'transactions') {
      loadTransactions();
    }
  }, [currentTab]);

  // Handlers for Transaction CRUD
  const handleSaveTransaction = async (formData) => {
    try {
      if (editingTransaction) {
        await api.updateTransaction(editingTransaction.id, formData);
      } else {
        await api.createTransaction(formData);
      }
      await Promise.all([loadDashboardData(), loadTransactions()]);
    } catch (err) {
      console.error('Erro ao salvar transação:', err);
      throw err;
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await api.deleteTransaction(id);
      // Wait for both dashboard and transactions list to refresh with fresh DB state
      await Promise.all([loadDashboardData(), loadTransactions()]);
    } catch (err) {
      console.error('Erro ao excluir transação:', err);
      alert('Erro ao excluir: ' + (err.message || 'Verifique o servidor'));
    }
  };

  const handleClearAllTransactions = async () => {
    const confirmed = window.confirm(
      'Tem certeza de que deseja apagar todas as transações do banco de dados?\n\nO banco ficará completamente vazio para você importar seu extrato bancário.'
    );
    if (!confirmed) return;

    try {
      const res = await api.clearAllTransactions();
      await Promise.all([loadDashboardData(), loadTransactions()]);
      alert(res?.message || 'Banco de dados esvaziado com sucesso! Agora você pode importar seu extrato.');
    } catch (err) {
      console.error('Erro ao limpar banco de dados:', err);
      alert('Erro ao esvaziar banco de dados: ' + (err.message || 'Verifique o servidor'));
    }
  };

  const handleOpenEdit = (tx) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  // Handlers for Category CRUD
  const handleSaveCategory = async (formData, id) => {
    if (id) {
      await api.updateCategory(id, formData);
    } else {
      await api.createCategory(formData);
    }
    await Promise.all([loadCategories(), loadDashboardData(), loadTransactions()]);
  };

  const handleDeleteCategory = async (id) => {
    await api.deleteCategory(id);
    await Promise.all([loadCategories(), loadDashboardData(), loadTransactions()]);
  };

  const handleImportSuccess = async (result) => {
    await Promise.all([loadDashboardData(), loadTransactions()]);
    alert(result?.message || 'Extrato bancário importado com sucesso!');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Sticky Slim Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        onOpenNewTransaction={handleOpenNew}
        onOpenImport={() => setIsImportModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
            <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Carregando dados financeiros...</p>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <div className="space-y-6">
                <SummaryCards data={dashboardData} />
                <ChartsSection 
                  data={dashboardData} 
                  onSelectTab={setCurrentTab}
                  onEditTransaction={handleOpenEdit}
                />
              </div>
            )}

            {currentTab === 'transactions' && (
              <TransactionsView
                transactions={transactions}
                categories={categories}
                filters={txFilters}
                setFilters={setTxFilters}
                onEditTransaction={handleOpenEdit}
                onDeleteTransaction={handleDeleteTransaction}
                onClearAllTransactions={handleClearAllTransactions}
                onOpenNewTransaction={handleOpenNew}
                onOpenImport={() => setIsImportModalOpen(true)}
              />
            )}

            {currentTab === 'budgets' && (
              <BudgetingView 
                selectedMonth={selectedMonth}
                categories={categories}
                onRefreshNeeded={() => Promise.all([loadDashboardData(), loadTransactions()])}
              />
            )}

            {currentTab === 'categories' && (
              <CategoriesView
                categories={categories}
                onSaveCategory={handleSaveCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            )}

            {currentTab === 'projections' && (
              <InflationModule />
            )}

            {currentTab === 'emergency_fund' && (
              <EmergencyFundCalculator />
            )}
          </>
        )}
      </main>

      {/* Modal for Creating/Editing Transactions */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        categories={categories}
        editingTx={editingTransaction}
      />

      {/* Modal for Importing Bank Statements (OFX / CSV) */}
      <ImportStatementModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        categories={categories}
        onSuccess={handleImportSuccess}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200/60 dark:border-slate-800/60 py-4 text-center text-xs text-slate-400">
        <p>FinFlow • Sistema de Controle Financeiro Pessoal Local & Projeção Inflacionária (SQLite)</p>
      </footer>
    </div>
  );
}
