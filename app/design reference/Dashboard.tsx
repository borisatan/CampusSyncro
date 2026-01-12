// import { useState } from 'react';
// import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';

// const weekData = [
//   { day: 'Mon', amount: 145 },
//   { day: 'Tue', amount: 210 },
//   { day: 'Wed', amount: 180 },
//   { day: 'Thu', amount: 165 },
//   { day: 'Fri', amount: 220 },
//   { day: 'Sat', amount: 195 },
//   { day: 'Sun', amount: 175 },
// ];

// const monthData = [
//   { week: 'W1', amount: 1050 },
//   { week: 'W2', amount: 980 },
//   { week: 'W3', amount: 1150 },
//   { week: 'W4', amount: 1220 },
// ];

// const yearData = [
//   { month: 'Jan', amount: 4200 },
//   { month: 'Feb', amount: 3800 },
//   { month: 'Mar', amount: 4500 },
//   { month: 'Apr', amount: 4100 },
//   { month: 'May', amount: 4800 },
//   { month: 'Jun', amount: 5200 },
//   { month: 'Jul', amount: 4900 },
//   { month: 'Aug', amount: 5100 },
//   { month: 'Sep', amount: 4700 },
//   { month: 'Oct', amount: 5300 },
//   { month: 'Nov', amount: 4950 },
//   { month: 'Dec', amount: 5400 },
// ];

// const categoryData = [
//   { name: 'Food', value: 1200, color: '#6366f1' },
//   { name: 'Transport', value: 450, color: '#8b5cf6' },
//   { name: 'Shopping', value: 890, color: '#ec4899' },
//   { name: 'Bills', value: 1500, color: '#f59e0b' },
//   { name: 'Other', value: 360, color: '#10b981' },
// ];

// const recentTransactions = [
//   { id: 1, name: 'Grocery Store', amount: -85.50, category: 'Food', date: 'Today' },
//   { id: 2, name: 'Salary', amount: 3500, category: 'Income', date: 'Yesterday' },
//   { id: 3, name: 'Coffee Shop', amount: -12.30, category: 'Food', date: '2 days ago' },
//   { id: 4, name: 'Electric Bill', amount: -125, category: 'Bills', date: '3 days ago' },
// ];

// // Budget Health Data
// const budgetHealthData = [
//   { name: 'Essential Living', spent: 1850, limit: 2500, color: '#3b82f6' },
//   { name: 'Lifestyle & Fun', spent: 320, limit: 500, color: '#a855f7' },
//   { name: 'Transportation', spent: 280, limit: 300, color: '#10b981' },
// ];

// type TimeFrame = 'week' | 'month' | 'year';

// export function Dashboard() {
//   const [timeFrame, setTimeFrame] = useState<TimeFrame>('month');
  
//   const totalBalance = 12450.75;
//   const income = 5200;
//   const expenses = 4400;

//   const getChartData = () => {
//     switch (timeFrame) {
//       case 'week':
//         return weekData;
//       case 'month':
//         return monthData;
//       case 'year':
//         return yearData;
//     }
//   };

//   const getDataKey = () => {
//     switch (timeFrame) {
//       case 'week':
//         return 'day';
//       case 'month':
//         return 'week';
//       case 'year':
//         return 'month';
//     }
//   };

//   return (
//     <div className="p-6 space-y-6">
//       {/* Header */}
//       <div className="space-y-2">
//         <p className="text-slate-400">Total Balance</p>
//         <h1 className="text-4xl text-white">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h1>
//       </div>

//       {/* Income/Expense Cards */}
//       <div className="grid grid-cols-2 gap-4">
//         <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
//           <div className="flex items-center gap-2 mb-2">
//             <TrendingUp className="w-4 h-4" />
//             <span className="text-sm opacity-90">Income</span>
//           </div>
//           <p className="text-2xl">${income.toLocaleString()}</p>
//         </div>
//         <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-4 text-white">
//           <div className="flex items-center gap-2 mb-2">
//             <TrendingDown className="w-4 h-4" />
//             <span className="text-sm opacity-90">Expenses</span>
//           </div>
//           <p className="text-2xl">${expenses.toLocaleString()}</p>
//         </div>
//       </div>

//       {/* Time Frame Selector */}
//       <div className="flex gap-2">
//         <button
//           onClick={() => setTimeFrame('week')}
//           className={`flex-1 py-2 rounded-xl transition-all ${
//             timeFrame === 'week'
//               ? 'bg-indigo-600 text-white'
//               : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
//           }`}
//         >
//           Past Week
//         </button>
//         <button
//           onClick={() => setTimeFrame('month')}
//           className={`flex-1 py-2 rounded-xl transition-all ${
//             timeFrame === 'month'
//               ? 'bg-indigo-600 text-white'
//               : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
//           }`}
//         >
//           Past Month
//         </button>
//         <button
//           onClick={() => setTimeFrame('year')}
//           className={`flex-1 py-2 rounded-xl transition-all ${
//             timeFrame === 'year'
//               ? 'bg-indigo-600 text-white'
//               : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
//           }`}
//         >
//           Past Year
//         </button>
//       </div>

//       {/* Spending Chart */}
//       <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
//         <h3 className="text-white mb-4">Spending Trend</h3>
//         <ResponsiveContainer width="100%" height={180}>
//           <LineChart data={getChartData()}>
//             <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
//             <XAxis dataKey={getDataKey()} stroke="#94a3b8" style={{ fontSize: '12px' }} />
//             <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
//             <Tooltip 
//               contentStyle={{ 
//                 backgroundColor: '#1e293b', 
//                 border: '1px solid #334155',
//                 borderRadius: '8px',
//                 fontSize: '14px',
//                 color: '#fff'
//               }} 
//             />
//             <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 4 }} />
//           </LineChart>
//         </ResponsiveContainer>
//       </div>

//       {/* Budget Health - Multi-Stack Progress Bar */}
//       <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-white">Budget Health</h3>
//           <span className="text-xs text-slate-400">This Month</span>
//         </div>
//         <div className="space-y-4">
//           {budgetHealthData.map((budget, index) => {
//             const percentage = (budget.spent / budget.limit) * 100;
//             const isOver = percentage > 100;
//             const isWarning = percentage >= 80 && percentage < 100;
            
//             return (
//               <div key={index}>
//                 <div className="flex items-center justify-between mb-2">
//                   <div className="flex items-center gap-2">
//                     <div className="w-3 h-3 rounded-full" style={{ backgroundColor: budget.color }}></div>
//                     <span className="text-sm text-slate-300">{budget.name}</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <span className={`text-sm ${
//                       isOver ? 'text-rose-400' : isWarning ? 'text-yellow-400' : 'text-slate-400'
//                     }`}>
//                       ${budget.spent} / ${budget.limit}
//                     </span>
//                     {isOver && <AlertCircle className="w-4 h-4 text-rose-400" />}
//                     {isWarning && <AlertCircle className="w-4 h-4 text-yellow-400" />}
//                   </div>
//                 </div>
//                 <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
//                   <div 
//                     className="h-full rounded-full transition-all"
//                     style={{ 
//                       width: `${Math.min(percentage, 100)}%`,
//                       backgroundColor: isOver ? '#f43f5e' : isWarning ? '#eab308' : budget.color
//                     }}
//                   />
//                 </div>
//                 <div className="flex justify-between mt-1">
//                   <span className="text-xs text-slate-500">
//                     ${(budget.limit - budget.spent) > 0 ? (budget.limit - budget.spent).toLocaleString() : 0} left
//                   </span>
//                   <span className={`text-xs ${
//                     isOver ? 'text-rose-400' : isWarning ? 'text-yellow-400' : 'text-slate-500'
//                   }`}>
//                     {percentage.toFixed(0)}%
//                   </span>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//         {/* Total Progress Bar */}
//         <div className="mt-4 pt-4 border-t border-slate-800">
//           <div className="flex items-center justify-between mb-2">
//             <span className="text-sm text-white">Total Budget</span>
//             <span className="text-sm text-slate-400">
//               ${budgetHealthData.reduce((sum, b) => sum + b.spent, 0)} / ${budgetHealthData.reduce((sum, b) => sum + b.limit, 0)}
//             </span>
//           </div>
//           <div className="h-4 bg-slate-800 rounded-full overflow-hidden flex">
//             {budgetHealthData.map((budget, index) => {
//               const totalLimit = budgetHealthData.reduce((sum, b) => sum + b.limit, 0);
//               const widthPercentage = (budget.spent / totalLimit) * 100;
//               const isOver = budget.spent > budget.limit;
              
//               return (
//                 <div
//                   key={index}
//                   className="h-full transition-all"
//                   style={{ 
//                     width: `${widthPercentage}%`,
//                     backgroundColor: isOver ? '#f43f5e' : budget.color
//                   }}
//                 />
//               );
//             })}
//           </div>
//         </div>
//       </div>

//       {/* Category Breakdown */}
//       <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
//         <h3 className="text-white mb-4">Spending by Category</h3>
//         <div className="flex items-center justify-between">
//           <ResponsiveContainer width="45%" height={150}>
//             <PieChart>
//               <Pie
//                 data={categoryData}
//                 cx="50%"
//                 cy="50%"
//                 innerRadius={35}
//                 outerRadius={60}
//                 paddingAngle={5}
//                 dataKey="value"
//               >
//                 {categoryData.map((entry, index) => (
//                   <Cell key={`cell-${index}`} fill={entry.color} />
//                 ))}
//               </Pie>
//             </PieChart>
//           </ResponsiveContainer>
//           <div className="flex-1 space-y-2">
//             {categoryData.map((category, index) => (
//               <div key={index} className="flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
//                   <span className="text-sm text-slate-400">{category.name}</span>
//                 </div>
//                 <span className="text-sm text-white">${category.value}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Recent Transactions */}
//       <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
//         <h3 className="text-white mb-4">Recent Transactions</h3>
//         <div className="space-y-3">
//           {recentTransactions.map((transaction) => (
//             <div key={transaction.id} className="flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
//                   transaction.amount > 0 ? 'bg-emerald-500/20' : 'bg-slate-800'
//                 }`}>
//                   <DollarSign className={`w-5 h-5 ${
//                     transaction.amount > 0 ? 'text-emerald-400' : 'text-slate-400'
//                   }`} />
//                 </div>
//                 <div>
//                   <p className="text-white">{transaction.name}</p>
//                   <p className="text-xs text-slate-500">{transaction.date}</p>
//                 </div>
//               </div>
//               <p className={`${
//                 transaction.amount > 0 ? 'text-emerald-400' : 'text-white'
//               }`}>
//                 {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
//               </p>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }