import React, { useState, useMemo, useCallback } from 'react';
import { Transaction, Debt, TransactionType } from './types';
import { analyzeFinancials } from './services/geminiService';
import { PlusIcon, ArrowDownIcon, ArrowUpIcon, BanknotesIcon, SparklesIcon, LoadingSpinner, ListBulletIcon, CreditCardIcon } from './components/icons';

type ActiveTab = 'transaction' | 'debt';

// --- Reusable UI Components ---

const Header = () => (
    <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 pb-2">
            Asisten Keuangan AI
        </h1>
        <p className="text-slate-400 mt-1">
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
    <div className="bg-slate-800 p-4 rounded-xl shadow-lg flex items-center">
        <div className="p-3 bg-slate-700 rounded-lg mr-4">
            {children}
        </div>
        <div>
            <h3 className="text-sm font-medium text-slate-400">{title}</h3>
            <p className={`text-2xl font-semibold ${color}`}>
                Rp {amount.toLocaleString('id-ID')}
            </p>
        </div>
    </div>
);

// --- Form Components ---
const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.id} className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
        <input {...props} id={props.id} className="w-full bg-slate-700 p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition" />
    </div>
);

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
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="Deskripsi" id="desc" type="text" placeholder="Gaji, Belanja, dll." value={description} onChange={e => setDescription(e.target.value)} required />
            <div className="grid grid-cols-2 gap-4">
                 <FormInput label="Jumlah (Rp)" id="amount" type="number" placeholder="50000" value={amount} onChange={e => setAmount(e.target.value)} required />
                 <FormInput label="Kategori" id="category" type="text" placeholder="Makanan, Transportasi" value={category} onChange={e => setCategory(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="type" className="block text-sm font-medium text-slate-400 mb-1">Tipe</label>
                    <select id="type" value={type} onChange={e => setType(e.target.value as TransactionType)} className="w-full bg-slate-700 p-2 rounded-md border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition">
                        <option value={TransactionType.EXPENSE}>Pengeluaran</option>
                        <option value={TransactionType.INCOME}>Pemasukan</option>
                    </select>
                </div>
                <FormInput label="Tanggal" id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors"><PlusIcon /></button>
        </form>
    );
};

interface DebtFormProps {
    addDebt: (debt: Omit<Debt, 'id'>) => void;
}
const DebtForm: React.FC<DebtFormProps> = ({ addDebt }) => {
    const [creditor, setCreditor] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [monthlyInstallment, setMonthlyInstallment] = useState('');
    const [totalInstallmentMonths, setTotalInstallmentMonths] = useState('');
    const [monthsPaid, setMonthsPaid] = useState('0');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!creditor || !totalAmount || !monthlyInstallment || !totalInstallmentMonths) return;
        addDebt({ 
            creditor, 
            totalAmount: parseFloat(totalAmount), 
            monthlyInstallment: parseFloat(monthlyInstallment),
            totalInstallmentMonths: parseInt(totalInstallmentMonths),
            monthsPaid: parseInt(monthsPaid),
            startDate 
        });
        setCreditor('');
        setTotalAmount('');
        setMonthlyInstallment('');
        setTotalInstallmentMonths('');
        setMonthsPaid('0');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="Kreditur / Pemberi Hutang" id="creditor" type="text" placeholder="Bank, Teman, dll." value={creditor} onChange={e => setCreditor(e.target.value)} required />
            <div className="grid grid-cols-2 gap-4">
                <FormInput label="Total Hutang (Rp)" id="totalAmount" type="number" placeholder="10000000" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} required />
                <FormInput label="Cicilan per Bulan (Rp)" id="monthlyInstallment" type="number" placeholder="500000" value={monthlyInstallment} onChange={e => setMonthlyInstallment(e.target.value)} required />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <FormInput label="Total Bulan Cicilan" id="totalMonths" type="number" placeholder="24" value={totalInstallmentMonths} onChange={e => setTotalInstallmentMonths(e.target.value)} required />
                <FormInput label="Sudah Dicicil (Bulan)" id="monthsPaid" type="number" value={monthsPaid} onChange={e => setMonthsPaid(e.target.value)} required />
            </div>
            <FormInput label="Tanggal Mulai Hutang" id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors"><PlusIcon /></button>
        </form>
    );
};

// --- List Components ---

const TransactionList: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => (
    <div className="bg-slate-800/50 p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-4 text-slate-300">Riwayat Transaksi</h2>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
             {[...transactions].reverse().map(t => (
                <div key={t.id} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-md hover:bg-slate-700 transition-colors">
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
        <h2 className="text-lg font-bold mb-4 text-slate-300">Daftar Hutang</h2>
        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
            {debts.map(d => {
                const percentage = d.totalInstallmentMonths > 0 ? (d.monthsPaid / d.totalInstallmentMonths) * 100 : 0;
                const remainingMonths = d.totalInstallmentMonths - d.monthsPaid;
                const remainingDebt = remainingMonths * d.monthlyInstallment;
                return (
                    <div key={d.id} className="bg-slate-700/50 p-3 rounded-md">
                        <div className="flex justify-between items-center mb-2">
                            <p className="font-semibold">{d.creditor}</p>
                            <p className="text-xs text-slate-400">Sisa {remainingMonths} bulan</p>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2.5 mt-2">
                            <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                         <div className="text-sm mt-2 flex justify-between">
                           <span className="text-slate-400">Sisa Hutang:</span>
                           <span className="font-bold">Rp {remainingDebt.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

// --- Layout Components ---

const Sidebar: React.FC<{ transactions: Transaction[], debts: Debt[], dashboardData: any }> = ({ transactions, debts, dashboardData }) => (
    <aside className="w-full lg:w-1/3 xl:w-1/4 bg-slate-900/70 backdrop-blur-sm p-6 flex flex-col gap-6 border-b lg:border-b-0 lg:border-r border-slate-800">
        <h2 className="text-2xl font-bold text-slate-200">Dashboard</h2>
        <div className="flex flex-col gap-4">
            <DashboardCard title="Saldo Saat Ini" amount={dashboardData.balance} color="text-sky-400"><BanknotesIcon/></DashboardCard>
            <DashboardCard title="Total Pemasukan" amount={dashboardData.totalIncome} color="text-green-400"><ArrowUpIcon/></DashboardCard>
            <DashboardCard title="Total Pengeluaran" amount={dashboardData.totalExpense} color="text-red-400"><ArrowDownIcon/></DashboardCard>
        </div>
        <div className="flex-grow flex flex-col gap-6 overflow-hidden">
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
}> = ({ addTransaction, addDebt, handleAnalysis, isLoading, analysis }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('transaction');
    
    const renderTabButton = (tab: ActiveTab, icon: React.ReactNode, label: string) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`w-full flex items-center justify-center gap-2 p-3 font-semibold rounded-t-lg border-b-2 transition-colors ${
                activeTab === tab 
                ? 'text-sky-400 border-sky-400' 
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
        >
            {icon} {label}
        </button>
    );
    
    return (
        <main className="w-full lg:w-2/3 xl:w-3/4 p-6 sm:p-8 lg:p-10 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <Header />
                <div className="bg-slate-800 p-6 rounded-xl shadow-xl mb-8">
                    <div className="flex border-b border-slate-700 mb-6">
                        {renderTabButton('transaction', <ListBulletIcon/>, 'Transaksi')}
                        {renderTabButton('debt', <CreditCardIcon/>, 'Hutang')}
                    </div>
                     {activeTab === 'transaction' && <TransactionForm addTransaction={addTransaction} />}
                     {activeTab === 'debt' && <DebtForm addDebt={addDebt} />}
                </div>

                <div className="bg-slate-800 p-6 rounded-xl shadow-xl">
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
                            dangerouslySetInnerHTML={{ __html: analysis }}
                          />
                    )}
                </div>
            </div>
        </main>
    );
};

// --- Main App Component ---

const App: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([
        { id: '1', date: '2024-07-20', description: 'Gaji Bulanan', type: TransactionType.INCOME, category: 'Gaji', amount: 8000000 },
        { id: '2', date: '2024-07-20', description: 'Belanja Bulanan', type: TransactionType.EXPENSE, category: 'Kebutuhan Pokok', amount: 1500000 },
        { id: '3', date: '2024-07-21', description: 'Makan Siang', type: TransactionType.EXPENSE, category: 'Makanan', amount: 50000 },
    ]);
    const [debts, setDebts] = useState<Debt[]>([
        { id: 'd1', creditor: 'KPR Bank ABC', totalAmount: 300000000, monthlyInstallment: 2500000, totalInstallmentMonths: 120, monthsPaid: 12, startDate: '2023-07-01'},
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
        return {
            balance: totalIncome - totalExpense,
            totalIncome,
            totalExpense,
        };
    }, [transactions]);

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
            .replace(/\n\* (.*)/g, '<ul><li class="ml-4">$1</li></ul>')
            .replace(/<\/ul><ul>/g, '');


        setAnalysis(htmlResult);
        setIsLoading(false);
    }, [transactions, debts]);


    return (
       <div className="flex flex-col lg:flex-row h-screen bg-slate-900 text-white font-sans">
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
