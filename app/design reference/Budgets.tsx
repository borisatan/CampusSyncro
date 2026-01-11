// import { ArrowRightLeft, ChevronDown, ChevronUp, Edit2, Plus, Settings, Trash2 } from 'lucide-react';
// import { useState } from 'react';

// interface Category {
//   name: string;
//   icon: any;
//   color: string;
// }

// interface Budget {
//   id: number;
//   name: string;
//   color: string;
//   amountType: 'dollar' | 'percentage';
//   amount: number;
//   period: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
//   categories: string[];
//   spent: number;
// }

// const availableCategories: Category[] = [
//   { name: 'Food', icon: Settings, color: 'bg-orange-500/20 text-orange-400' },
//   { name: 'Shopping', icon: Settings, color: 'bg-pink-500/20 text-pink-400' },
//   { name: 'Transport', icon: Settings, color: 'bg-blue-500/20 text-blue-400' },
//   { name: 'Housing', icon: Settings, color: 'bg-indigo-500/20 text-indigo-400' },
//   { name: 'Bills', icon: Settings, color: 'bg-yellow-500/20 text-yellow-400' },
//   { name: 'Entertainment', icon: Settings, color: 'bg-purple-500/20 text-purple-400' },
//   { name: 'Health', icon: Settings, color: 'bg-rose-500/20 text-rose-400' },
//   { name: 'Other', icon: Settings, color: 'bg-slate-500/20 text-slate-400' },
// ];

// const supercategoryColors = [
//   { name: 'Blue', class: 'bg-blue-500', light: 'bg-blue-500/20' },
//   { name: 'Green', class: 'bg-emerald-500', light: 'bg-emerald-500/20' },
//   { name: 'Purple', class: 'bg-purple-500', light: 'bg-purple-500/20' },
//   { name: 'Orange', class: 'bg-orange-500', light: 'bg-orange-500/20' },
//   { name: 'Pink', class: 'bg-pink-500', light: 'bg-pink-500/20' },
//   { name: 'Yellow', class: 'bg-yellow-500', light: 'bg-yellow-500/20' },
//   { name: 'Red', class: 'bg-rose-500', light: 'bg-rose-500/20' },
//   { name: 'Indigo', class: 'bg-indigo-500', light: 'bg-indigo-500/20' },
// ];

// export function Budgets() {
//   const [budgets, setBudgets] = useState<Budget[]>([
//     {
//       id: 1,
//       name: 'Essential Living',
//       color: 'bg-blue-500',
//       amountType: 'percentage',
//       amount: 50,
//       period: 'monthly',
//       categories: ['Food', 'Housing', 'Bills'],
//       spent: 1850,
//     },
//     {
//       id: 2,
//       name: 'Lifestyle & Fun',
//       color: 'bg-purple-500',
//       amountType: 'dollar',
//       amount: 500,
//       period: 'monthly',
//       categories: ['Entertainment', 'Shopping'],
//       spent: 320,
//     },
//   ]);

//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
//   const [expandedBudget, setExpandedBudget] = useState<number | null>(null);

//   // New budget form state
//   const [newBudgetName, setNewBudgetName] = useState('');
//   const [newBudgetColor, setNewBudgetColor] = useState('bg-blue-500');
//   const [newBudgetAmountType, setNewBudgetAmountType] = useState<'dollar' | 'percentage'>('dollar');
//   const [newBudgetAmount, setNewBudgetAmount] = useState('');
//   const [newBudgetPeriod, setNewBudgetPeriod] = useState<'weekly' | 'biweekly' | 'monthly' | 'yearly'>('monthly');
//   const [newBudgetCategories, setNewBudgetCategories] = useState<string[]>([]);

//   const [totalIncome, setTotalIncome] = useState(5000); // Total income for percentage calculations
//   const [showIncomeModal, setShowIncomeModal] = useState(false);
//   const [newIncome, setNewIncome] = useState('');
  
//   // Transfer modal state
//   const [showTransferModal, setShowTransferModal] = useState(false);
//   const [transferFrom, setTransferFrom] = useState<number | null>(null);
//   const [transferTo, setTransferTo] = useState<number | null>(null);
//   const [transferAmount, setTransferAmount] = useState('');

//   const handleCreateBudget = () => {
//     setShowCreateModal(true);
//     setEditingBudget(null);
//     resetForm();
//   };

//   const handleEditBudget = (budget: Budget) => {
//     setEditingBudget(budget);
//     setNewBudgetName(budget.name);
//     setNewBudgetColor(budget.color);
//     setNewBudgetAmountType(budget.amountType);
//     setNewBudgetAmount(budget.amount.toString());
//     setNewBudgetPeriod(budget.period);
//     setNewBudgetCategories(budget.categories);
//     setShowCreateModal(true);
//   };

//   const resetForm = () => {
//     setNewBudgetName('');
//     setNewBudgetColor('bg-blue-500');
//     setNewBudgetAmountType('dollar');
//     setNewBudgetAmount('');
//     setNewBudgetPeriod('monthly');
//     setNewBudgetCategories([]);
//   };

//   const handleSaveBudget = () => {
//     if (!newBudgetName || !newBudgetAmount || newBudgetCategories.length === 0) return;

//     const budgetData: Budget = {
//       id: editingBudget ? editingBudget.id : Date.now(),
//       name: newBudgetName,
//       color: newBudgetColor,
//       amountType: newBudgetAmountType,
//       amount: parseFloat(newBudgetAmount),
//       period: newBudgetPeriod,
//       categories: newBudgetCategories,
//       spent: editingBudget ? editingBudget.spent : 0,
//     };

//     if (editingBudget) {
//       setBudgets(budgets.map(b => b.id === editingBudget.id ? budgetData : b));
//     } else {
//       setBudgets([...budgets, budgetData]);
//     }

//     setShowCreateModal(false);
//     resetForm();
//   };

//   const handleDeleteBudget = (id: number) => {
//     setBudgets(budgets.filter(b => b.id !== id));
//   };

//   const toggleCategory = (category: string) => {
//     if (newBudgetCategories.includes(category)) {
//       setNewBudgetCategories(newBudgetCategories.filter(c => c !== category));
//     } else {
//       setNewBudgetCategories([...newBudgetCategories, category]);
//     }
//   };

//   const getBudgetLimit = (budget: Budget) => {
//     if (budget.amountType === 'dollar') {
//       return budget.amount;
//     } else {
//       return (totalIncome * budget.amount) / 100;
//     }
//   };

//   const getBudgetPercentage = (budget: Budget) => {
//     const limit = getBudgetLimit(budget);
//     return (budget.spent / limit) * 100;
//   };

//   const getBudgetStatus = (percentage: number) => {
//     if (percentage >= 100) return 'over';
//     if (percentage >= 80) return 'warning';
//     return 'good';
//   };

//   // Get categories that aren't assigned to any budget
//   const getUnassignedCategories = () => {
//     const assignedCategories = budgets.flatMap(b => b.categories);
//     return availableCategories.filter(c => !assignedCategories.includes(c.name) || (editingBudget && editingBudget.categories.includes(c.name)));
//   };

//   const totalBudgetedPercentage = budgets
//     .filter(b => b.amountType === 'percentage')
//     .reduce((sum, b) => sum + b.amount, 0);

//   const handleEditIncome = () => {
//     setNewIncome(totalIncome.toString());
//     setShowIncomeModal(true);
//   };

//   const handleSaveIncome = () => {
//     if (newIncome && parseFloat(newIncome) > 0) {
//       setTotalIncome(parseFloat(newIncome));
//       setShowIncomeModal(false);
//       setNewIncome('');
//     }
//   };

//   const handleOpenTransferModal = () => {
//     setTransferFrom(null);
//     setTransferTo(null);
//     setTransferAmount('');
//     setShowTransferModal(true);
//   };

//   const handleTransfer = () => {
//     if (!transferFrom || !transferTo || !transferAmount || transferFrom === transferTo) return;
    
//     const amount = parseFloat(transferAmount);
//     if (amount <= 0) return;

//     setBudgets(budgets.map(b => {
//       if (b.id === transferFrom && b.amountType === 'dollar') {
//         return { ...b, amount: Math.max(0, b.amount - amount) };
//       }
//       if (b.id === transferTo && b.amountType === 'dollar') {
//         return { ...b, amount: b.amount + amount };
//       }
//       return b;
//     }));

//     setShowTransferModal(false);
//     setTransferFrom(null);
//     setTransferTo(null);
//     setTransferAmount('');
//   };

//   const dollarBudgets = budgets.filter(b => b.amountType === 'dollar');
//   const fromBudget = budgets.find(b => b.id === transferFrom);
//   const maxTransfer = fromBudget && fromBudget.amountType === 'dollar' ? fromBudget.amount : 0;

//   return (
//     <div className="p-6 space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-2xl text-white">Budgets</h2>
//           <p className="text-slate-400">Manage your spending limits</p>
//         </div>
//         <button
//           onClick={handleCreateBudget}
//           className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white hover:bg-indigo-700 transition-colors"
//         >
//           <Plus className="w-5 h-5" />
//         </button>
//       </div>

//       {/* Budget Summary */}
//       <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white">
//         <div className="flex items-center justify-between mb-1">
//           <p className="text-sm opacity-90">Total Monthly Income</p>
//           <button
//             onClick={handleEditIncome}
//             className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
//           >
//             <Edit2 className="w-4 h-4" />
//           </button>
//         </div>
//         <p className="text-3xl mb-3">${totalIncome.toLocaleString()}</p>
//         <div className="flex items-center gap-2 text-sm">
//           <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
//             <div 
//               className="h-full bg-white/40 rounded-full"
//               style={{ width: `${Math.min(totalBudgetedPercentage, 100)}%` }}
//             />
//           </div>
//           <span className="opacity-90">{totalBudgetedPercentage}% allocated</span>
//         </div>
//       </div>

//       {/* Transfer Button */}
//       {dollarBudgets.length >= 2 && (
//         <button
//           onClick={handleOpenTransferModal}
//           className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:bg-slate-800/50 transition-all flex items-center gap-3"
//         >
//           <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
//             <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
//           </div>
//           <div className="flex-1 text-left">
//             <p className="text-white">Transfer Between Budgets</p>
//             <p className="text-sm text-slate-400">Move funds between fixed amount budgets</p>
//           </div>
//         </button>
//       )}

//       {/* Budgets List */}
//       <div className="space-y-3">
//         {budgets.length === 0 ? (
//           <div className="text-center py-12">
//             <p className="text-slate-500 mb-3">No budgets created yet</p>
//             <button
//               onClick={handleCreateBudget}
//               className="text-indigo-400 hover:text-indigo-300 text-sm"
//             >
//               Create your first budget
//             </button>
//           </div>
//         ) : (
//           budgets.map((budget) => {
//             const limit = getBudgetLimit(budget);
//             const percentage = getBudgetPercentage(budget);
//             const status = getBudgetStatus(percentage);
//             const isExpanded = expandedBudget === budget.id;

//             return (
//               <div
//                 key={budget.id}
//                 className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
//               >
//                 <div className="p-4">
//                   {/* Budget Header */}
//                   <div className="flex items-center gap-3 mb-3">
//                     <div className={`w-3 h-3 rounded-full ${budget.color}`} />
//                     <h3 className="text-white flex-1">{budget.name}</h3>
//                     <div className="flex items-center gap-2">
//                       <button
//                         onClick={() => handleEditBudget(budget)}
//                         className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-300 transition-colors"
//                       >
//                         <Edit2 className="w-4 h-4" />
//                       </button>
//                       <button
//                         onClick={() => handleDeleteBudget(budget.id)}
//                         className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors"
//                       >
//                         <Trash2 className="w-4 h-4" />
//                       </button>
//                       <button
//                         onClick={() => setExpandedBudget(isExpanded ? null : budget.id)}
//                         className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-300 transition-colors"
//                       >
//                         {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
//                       </button>
//                     </div>
//                   </div>

//                   {/* Budget Amount */}
//                   <div className="flex items-baseline gap-2 mb-3">
//                     <span className={`text-2xl ${status === 'over' ? 'text-rose-400' : status === 'warning' ? 'text-yellow-400' : 'text-white'}`}>
//                       ${budget.spent.toLocaleString()}
//                     </span>
//                     <span className="text-slate-500">
//                       of ${limit.toLocaleString()} ({budget.period})
//                     </span>
//                   </div>

//                   {/* Progress Bar */}
//                   <div className="mb-3">
//                     <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
//                       <div 
//                         className={`h-full rounded-full transition-all ${
//                           status === 'over' ? 'bg-rose-500' : 
//                           status === 'warning' ? 'bg-yellow-500' : 
//                           budget.color
//                         }`}
//                         style={{ width: `${Math.min(percentage, 100)}%` }}
//                       />
//                     </div>
//                   </div>

//                   {/* Budget Details */}
//                   <div className="flex items-center gap-4 text-xs text-slate-500">
//                     <span>
//                       {budget.amountType === 'percentage' 
//                         ? `${budget.amount}% of income` 
//                         : `$${budget.amount}`
//                       }
//                     </span>
//                     <span>•</span>
//                     <span>{budget.categories.length} categories</span>
//                     <span>•</span>
//                     <span className={
//                       status === 'over' ? 'text-rose-400' : 
//                       status === 'warning' ? 'text-yellow-400' : 
//                       'text-emerald-400'
//                     }>
//                       {percentage.toFixed(0)}% used
//                     </span>
//                   </div>

//                   {/* Expanded Categories */}
//                   {isExpanded && (
//                     <div className="mt-4 pt-4 border-t border-slate-800">
//                       <p className="text-xs text-slate-400 mb-2">Included Categories:</p>
//                       <div className="flex flex-wrap gap-2">
//                         {budget.categories.map((category) => (
//                           <div
//                             key={category}
//                             className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300"
//                           >
//                             {category}
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             );
//           })
//         )}
//       </div>

//       {/* Create/Edit Budget Modal */}
//       {showCreateModal && (
//         <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
//           <div className="bg-slate-900 rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
//             <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
//               <h3 className="text-xl text-white">{editingBudget ? 'Edit Budget' : 'Create Budget'}</h3>
//               <button
//                 onClick={() => setShowCreateModal(false)}
//                 className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
//               >
//                 ×
//               </button>
//             </div>

//             <div className="p-6 space-y-5">
//               {/* Budget Name */}
//               <div>
//                 <label className="block text-sm text-slate-400 mb-2">Budget Name</label>
//                 <input
//                   type="text"
//                   value={newBudgetName}
//                   onChange={(e) => setNewBudgetName(e.target.value)}
//                   placeholder="e.g., Essential Living"
//                   className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-slate-600"
//                 />
//               </div>

//               {/* Color Selection */}
//               <div>
//                 <label className="block text-sm text-slate-400 mb-2">Color</label>
//                 <div className="grid grid-cols-4 gap-3">
//                   {supercategoryColors.map((color) => (
//                     <button
//                       key={color.name}
//                       type="button"
//                       onClick={() => setNewBudgetColor(color.class)}
//                       className={`h-12 rounded-xl transition-all ${color.class} ${
//                         newBudgetColor === color.class ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-50'
//                       }`}
//                     />
//                   ))}
//                 </div>
//               </div>

//               {/* Amount Type */}
//               <div>
//                 <label className="block text-sm text-slate-400 mb-2">Budget Type</label>
//                 <div className="bg-slate-800 rounded-xl p-1 flex">
//                   <button
//                     type="button"
//                     onClick={() => setNewBudgetAmountType('dollar')}
//                     className={`flex-1 py-2 rounded-lg transition-all ${
//                       newBudgetAmountType === 'dollar'
//                         ? 'bg-slate-900 text-white'
//                         : 'text-slate-400'
//                     }`}
//                   >
//                     Fixed Amount
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => setNewBudgetAmountType('percentage')}
//                     className={`flex-1 py-2 rounded-lg transition-all ${
//                       newBudgetAmountType === 'percentage'
//                         ? 'bg-slate-900 text-white'
//                         : 'text-slate-400'
//                     }`}
//                   >
//                     Percentage
//                   </button>
//                 </div>
//               </div>

//               {/* Amount */}
//               <div>
//                 <label className="block text-sm text-slate-400 mb-2">
//                   {newBudgetAmountType === 'dollar' ? 'Amount' : 'Percentage of Income'}
//                 </label>
//                 <div className="relative">
//                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
//                     {newBudgetAmountType === 'dollar' ? '$' : '%'}
//                   </span>
//                   <input
//                     type="number"
//                     step={newBudgetAmountType === 'dollar' ? '0.01' : '1'}
//                     value={newBudgetAmount}
//                     onChange={(e) => setNewBudgetAmount(e.target.value)}
//                     placeholder={newBudgetAmountType === 'dollar' ? '0.00' : '0'}
//                     className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-slate-600"
//                   />
//                 </div>
//                 {newBudgetAmountType === 'percentage' && newBudgetAmount && (
//                   <p className="text-xs text-slate-500 mt-1">
//                     ≈ ${((totalIncome * parseFloat(newBudgetAmount)) / 100).toLocaleString()}
//                   </p>
//                 )}
//               </div>

//               {/* Period */}
//               <div>
//                 <label className="block text-sm text-slate-400 mb-2">Time Period</label>
//                 <select
//                   value={newBudgetPeriod}
//                   onChange={(e) => setNewBudgetPeriod(e.target.value as any)}
//                   className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
//                 >
//                   <option value="weekly">Weekly</option>
//                   <option value="biweekly">Biweekly</option>
//                   <option value="monthly">Monthly</option>
//                   <option value="yearly">Yearly</option>
//                 </select>
//               </div>

//               {/* Categories */}
//               <div>
//                 <label className="block text-sm text-slate-400 mb-2">
//                   Assign Categories ({newBudgetCategories.length} selected)
//                 </label>
//                 <div className="grid grid-cols-2 gap-2">
//                   {getUnassignedCategories().map((category) => {
//                     const Icon = category.icon;
//                     const isSelected = newBudgetCategories.includes(category.name);
                    
//                     return (
//                       <button
//                         key={category.name}
//                         type="button"
//                         onClick={() => toggleCategory(category.name)}
//                         className={`flex items-center gap-2 p-3 rounded-xl transition-all border-2 ${
//                           isSelected
//                             ? 'border-indigo-500 bg-indigo-500/10'
//                             : 'border-slate-800 bg-slate-800 hover:border-slate-700'
//                         }`}
//                       >
//                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${category.color}`}>
//                           <Icon className="w-4 h-4" />
//                         </div>
//                         <span className={`text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>
//                           {category.name}
//                         </span>
//                       </button>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* Save Button */}
//               <button
//                 onClick={handleSaveBudget}
//                 disabled={!newBudgetName || !newBudgetAmount || newBudgetCategories.length === 0}
//                 className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {editingBudget ? 'Save Changes' : 'Create Budget'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Edit Income Modal */}
//       {showIncomeModal && (
//         <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
//           <div className="bg-slate-900 rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
//             <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
//               <h3 className="text-xl text-white">Edit Income</h3>
//               <button
//                 onClick={() => setShowIncomeModal(false)}
//                 className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
//               >
//                 ×
//               </button>
//             </div>

//             <div className="p-6 space-y-5">
//               {/* Income */}
//               <div>
//                 <label className="block text-sm text-slate-400 mb-2">Total Monthly Income</label>
//                 <div className="relative">
//                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
//                   <input
//                     type="number"
//                     step="0.01"
//                     value={newIncome}
//                     onChange={(e) => setNewIncome(e.target.value)}
//                     placeholder="0.00"
//                     className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-slate-600"
//                   />
//                 </div>
//               </div>

//               {/* Save Button */}
//               <button
//                 onClick={handleSaveIncome}
//                 disabled={!newIncome || parseFloat(newIncome) <= 0}
//                 className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 Save Changes
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Transfer Modal */}
//       {showTransferModal && (
//         <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
//           <div className="bg-slate-900 rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
//             <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
//               <h3 className="text-xl text-white">Transfer Amount</h3>
//               <button
//                 onClick={() => setShowTransferModal(false)}
//                 className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
//               >
//                 ×
//               </button>
//             </div>

//             <div className="p-6 space-y-5">
//               {/* From Budget */}
//               <div>
//                 <label className="block text-sm text-slate-400 mb-2">From Budget</label>
//                 <select
//                   value={transferFrom || ''}
//                   onChange={(e) => setTransferFrom(e.target.value ? parseInt(e.target.value) : null)}
//                   className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
//                 >
//                   <option value="">Select a budget</option>
//                   {dollarBudgets.map(budget => (
//                     <option key={budget.id} value={budget.id}>
//                       {budget.name} (${budget.amount.toLocaleString()})
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* To Budget */}
//               <div>
//                 <label className="block text-sm text-slate-400 mb-2">To Budget</label>
//                 <select
//                   value={transferTo || ''}
//                   onChange={(e) => setTransferTo(e.target.value ? parseInt(e.target.value) : null)}
//                   className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
//                 >
//                   <option value="">Select a budget</option>
//                   {dollarBudgets.map(budget => (
//                     <option key={budget.id} value={budget.id}>
//                       {budget.name} (${budget.amount.toLocaleString()})
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Amount */}
//               <div>
//                 <label className="block text-sm text-slate-400 mb-2">Amount</label>
//                 <div className="relative">
//                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
//                   <input
//                     type="number"
//                     step="0.01"
//                     value={transferAmount}
//                     onChange={(e) => setTransferAmount(e.target.value)}
//                     placeholder="0.00"
//                     className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-slate-600"
//                   />
//                 </div>
//                 {maxTransfer > 0 && (
//                   <p className="text-xs text-slate-500 mt-1">
//                     Max transfer: ${maxTransfer.toLocaleString()}
//                   </p>
//                 )}
//               </div>

//               {/* Transfer Button */}
//               <button
//                 onClick={handleTransfer}
//                 disabled={!transferFrom || !transferTo || !transferAmount || transferFrom === transferTo || parseFloat(transferAmount) <= 0 || parseFloat(transferAmount) > maxTransfer}
//                 className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 Transfer
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }