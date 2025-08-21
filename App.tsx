
import React, { useState, useMemo, useCallback } from 'react';
import { Transaction, Debt, TransactionType } from './types';
import { analyzeFinancials } from './services/geminiService';
import { PlusIcon, ArrowDownIcon, ArrowUpIcon, BanknotesIcon, SparklesIcon, LoadingSpinner } from './components/icons';

// --- Reusable UI Components (No change here) ---

const Header = () => (
    <header className="mb-8">
        <h1 className="text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Asisten Keuangan AI
        </h1>
        <p className="text-center text-slate-400 mt-2">
            Catat, Lacak, dan Analisis Keuangan Anda dengan Bantuan AI
        </p>
    </header>
);

interface DashboardCardProps {
    title: string;
    amount: number;
    color: string;
    children?: React.ReactNode;
}
const DashboardCard: React.FC<DashboardCardProps> = ({ title, amount, color, children }) => (
    <div className="bg-slate-800 p-4 rounded-lg shadow-lg">
        <div className="flex items-center">
            {children}
            <h3 className="text-sm font-medium text-slate-400 ml-3">{title}</h3>
        </div>
        <p className={`text-2xl font-semibold mt-2 ${color}`}>
            Rp {amount.toLocaleString('id-ID')}
        </p>
    </div>
);


// --- Form & List Components ---

interface TransactionFormProps {
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}
const TransactionForm: React.FC<TransactionFormProps> = ({ addTransaction }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || !amount || !category) return;
        addTransaction({ date, description, type, category, amount: parseFloat(amount) });
        setDescription('');
        setAmount('');
        setCategory('');
    };
    
    return (
        <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-xl font-bold mb-4">Tambah Transaksi Baru</h2>
            <input type="text" placeholder="Deskripsi" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-700 p-2 rounded mb-3" required />
            <div className="grid grid-cols-2 gap-3 mb-3">
                <input type="number" placeholder="Jumlah" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-slate-700 p-2 rounded" required />
                <input type="text" placeholder="Kategori" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-700 p-2 rounded" required />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
                <select value={type} onChange={e => setType(e.target.value as TransactionType)} className="w-full bg-slate-700 p-2 rounded">
                    <option value={TransactionType.EXPENSE}>Pengeluaran</option>
                    <option value={TransactionType.INCOME}>Pemasukan</option>
                </select>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-700 p-2 rounded text-slate-400" />
            </div>
            <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition-colors"><PlusIcon /></button>
        </form>
    );
};

interface DebtFormProps {
    addDebt: (debt: Omit<Debt, 'id'>) => void;
}
const DebtForm: React.FC<DebtFormProps> = ({ addDebt }) => {
    const [creditor, setCreditor] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [amountPaid, setAmountPaid] = useState('0');
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!creditor || !totalAmount) return;
        addDebt({ creditor, totalAmount: parseFloat(totalAmount), amountPaid: parseFloat(amountPaid), dueDate });
        setCreditor('');
        setTotalAmount('');
        setAmountPaid('0');
    };

    return (
        <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-xl font-bold mb-4">Tambah Hutang Baru</h2>
            <input type="text" placeholder="Pemberi Hutang" value={creditor} onChange={e => setCreditor(e.target.value)} className="w-full bg-slate-700 p-2 rounded mb-3" required />
            <div className="grid grid-cols-2 gap-3 mb-3">
                <input type="number" placeholder="Total Hutang" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} className="w-full bg-slate-700 p-2 rounded" required />
                <input type="number" placeholder="Sudah Dibayar" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} className="w-full bg-slate-700 p-2 rounded" />
            </div>
            <div className="mb-4">
                 <label htmlFor="dueDate" className="text-sm text-slate-400">Jatuh Tempo</label>
                 <input id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-slate-700 p-2 rounded text-slate-400" />
            </div>
            <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition-colors"><PlusIcon /></button>
        </form>
    );
};

const TransactionList: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => (
    <div className="bg-slate-800/50 p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-4">Riwayat Transaksi</h2>
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
             {[...transactions].reverse().map(t => (
                <div key={t.id} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-md">
                    <div>
                        <p className="font-semibold">{t.description}</p>
                        <p className="text-sm text-slate-400">{t.category} - {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <p className={`font-bold text-sm whitespace-nowrap ${t.type === TransactionType.INCOME ? 'text-green-400' : 'text-red-400'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'}Rp {t.amount.toLocaleString('id-ID')}
                    </p>
                </div>
            ))}
        </div>
    </div>
);

const DebtList: React.FC<{ debts: Debt[] }> = ({ debts }) => (
    <div className="bg-slate-800/50 p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-4">Daftar Hutang</h2>
        <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
            {debts.map(d => {
                const percentage = d.totalAmount > 0 ? (d.amountPaid / d.totalAmount) * 100 : 0;
                return (
                    <div key={d.id} className="bg-slate-700/50 p-3 rounded-md">
                        <div className="flex justify-between items-center mb-2">
                            <p className="font-semibold">{d.creditor}</p>
                            <p className="text-sm text-slate-400">Jatuh Tempo: {new Date(d.dueDate).toLocaleDateString('id-ID')}</p>
                        </div>
                        <div className="text-sm">
                           Rp {d.amountPaid.toLocaleString('id-ID')} / <span className="font-bold">Rp {d.totalAmount.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2.5 mt-2">
                            <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);


// --- New Layout Components ---

const Sidebar: React.FC<{ transactions: Transaction[], debts: Debt[], dashboardData: any }> = ({ transactions, debts, dashboardData }) => (
    <aside className="w-full lg:w-1/3 xl:w-1/4 bg-slate-900 p-6 flex flex-col gap-6 border-b lg:border-b-0 lg:border-r border-slate-800">
        <h2 className="text-2xl font-bold text-slate-200">Ringkasan Keuangan</h2>
        <div className="flex flex-col gap-4">
            <DashboardCard title="Saldo Saat Ini" amount={dashboardData.balance} color="text-sky-400">
                <BanknotesIcon/>
            </DashboardCard>
            <DashboardCard title="Total Pemasukan" amount={dashboardData.totalIncome} color="text-green-400">
                <ArrowUpIcon/>
            </DashboardCard>
            <DashboardCard title="Total Pengeluaran" amount={dashboardData.totalExpense} color="text-red-400">
                <ArrowDownIcon/>
            </DashboardCard>
        </div>
        <div className="flex-grow flex flex-col gap-6 overflow-y-auto">
             <DebtList debts={debts} />
             <TransactionList transactions={transactions} />
        </div>
    </aside>
);


const MainContent: React.FC<{
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    addDebt: (debt: Omit<Debt, 'id'>) => void;
    handleAnalysis: () => void;
    isLoading: boolean;
    analysis: string;
}> = ({ addTransaction, addDebt, handleAnalysis, isLoading, analysis }) => (
    <main className="w-full lg:w-2/3 xl:w-3/4 p-6 sm:p-8 lg:p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
            <Header />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <TransactionForm addTransaction={addTransaction} />
                <DebtForm addDebt={addDebt} />
            </div>

            <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
                <h2 className="text-xl font-bold mb-4">Analisis AI</h2>
                <button
                    onClick={handleAnalysis}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Jalankan Analisis Keuangan"
                >
                    {isLoading ? <LoadingSpinner/> : <SparklesIcon />}
                    <span className="ml-2">{isLoading ? 'Menganalisis...' : 'Jalankan Analisis Keuangan'}</span>
                </button>
                {analysis && (
                     <div
                        className="prose prose-invert prose-sm max-w-none mt-6 p-4 bg-slate-900/50 rounded-lg text-slate-300 overflow-x-auto"
                        dangerouslySetInnerHTML={{ __html: analysis.replace(/```markdown\n/g, '').replace(/```/g, '') }}
                      />
                )}
            </div>
        </div>
    </main>
);

// --- Main App Component ---

const App: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([
        { id: '1', date: '2024-07-15', description: 'Gaji Bulanan', type: TransactionType.INCOME, category: 'Gaji', amount: 8000000 },
        { id: '2', date: '2024-07-16', description: 'Belanja Bulanan', type: TransactionType.EXPENSE, category: 'Kebutuhan Pokok', amount: 1500000 },
        { id: '3', date: '2024-07-17', description: 'Makan Siang', type: TransactionType.EXPENSE, category: 'Makanan', amount: 50000 },
    ]);
    const [debts, setDebts] = useState<Debt[]>([
        { id: 'd1', creditor: 'Bank ABC', totalAmount: 5000000, amountPaid: 1000000, dueDate: '2025-01-01' },
    ]);
    const [analysis, setAnalysis] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const dashboardData = useMemo(() => {
        const totalIncome = transactions
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = transactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + t.amount, 0);
        const totalDebt = debts.reduce((sum, d) => sum + d.totalAmount, 0);
        const totalPaid = debts.reduce((sum, d) => sum + d.amountPaid, 0);
        const remainingDebt = totalDebt - totalPaid;
        return {
            balance: totalIncome - totalExpense,
            totalIncome,
            totalExpense,
            remainingDebt,
        };
    }, [transactions, debts]);

    const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
        setTransactions(prev => [...prev, { ...transaction, id: new Date().toISOString() }]);
    };



    const addDebt = (debt: Omit<Debt, 'id'>) => {
        setDebts(prev => [...prev, { ...debt, id: new Date().toISOString() }]);
    };
    
    const handleAnalysis = useCallback(async () => {
        setIsLoading(true);
        setAnalysis('');
        const result = await analyzeFinancials(transactions, debts);
        // Simple markdown to HTML conversion
        const htmlResult = result
            .replace(/### (.*)/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
            .replace(/## (.*)/g, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\* (.*)/g, '<li class="ml-4">$1</li>')
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
            .replace(/<\/ul>\n<ul>/g, ''); // Fix multiple lists

        setAnalysis(htmlResult);
        setIsLoading(false);
    }, [transactions, debts]);


    return (
       <div className="flex flex-col lg:flex-row h-screen bg-slate-900 text-white">
            <Sidebar transactions={transactions} debts={debts} dashboardData={dashboardData} />
            <MainContent
                addTransaction={addTransaction}
                addDebt={addDebt}
                handleAnalysis={handleAnalysis}
                isLoading={isLoading}
                analysis={analysis}
            />
        </div>
    );
};

export default App;
