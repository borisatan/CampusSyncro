// import {
//     Check,
//     ChevronLeft,
//     ChevronRight,
//     Coffee,
//     CreditCard,
//     ShoppingBag,
//     ShoppingCart,
//     Tv,
// } from "lucide-react";
// import { motion } from "motion/react";
// import { useState } from "react";

// interface OnboardingScreen2Props {
//   onNext: (categories: string[]) => void;
//   onBack: () => void;
//   currentStep: number;
//   totalSteps: number;
// }

// const categories = [
//   {
//     id: "dining",
//     label: "Dining Out",
//     icon: Coffee,
//     color: "from-orange-500 to-amber-500",
//   },
//   {
//     id: "impulse",
//     label: "Impulse Buys",
//     icon: ShoppingCart,
//     color: "from-pink-500 to-rose-500",
//   },
//   {
//     id: "subscriptions",
//     label: "Subscriptions",
//     icon: CreditCard,
//     color: "from-purple-500 to-indigo-500",
//   },
//   {
//     id: "grocery",
//     label: "Grocery Runs",
//     icon: ShoppingBag,
//     color: "from-emerald-500 to-teal-500",
//   },
//   {
//     id: "digital",
//     label: "Digital Entertainment",
//     icon: Tv,
//     color: "from-blue-500 to-cyan-500",
//   },
// ];

// export function OnboardingScreen2({
//   onNext,
//   onBack,
//   currentStep,
//   totalSteps,
// }: OnboardingScreen2Props) {
//   const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

//   const toggleCategory = (id: string) => {
//     setSelectedCategories((prev) =>
//       prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
//     );
//   };

//   const handleNext = () => {
//     if (selectedCategories.length > 0) {
//       onNext(selectedCategories);
//     }
//   };

//   return (
//     <div className="min-h-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col">
//       {/* Progress Bar */}
//       <div className="px-8 pt-6 pb-4">
//         <div className="flex items-center justify-between mb-2">
//           <button
//             onClick={onBack}
//             className="flex items-center gap-1 text-slate-400 hover:text-slate-300 transition-colors"
//           >
//             <ChevronLeft className="w-5 h-5" />
//             <span className="text-sm">Back</span>
//           </button>
//           <span className="text-slate-400 text-sm">
//             Step {currentStep} of {totalSteps}
//           </span>
//           <ChevronRight className="w-5 h-5 text-slate-600" />
//         </div>
//         <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
//           <motion.div
//             initial={{ width: `${((currentStep - 1) / totalSteps) * 100}%` }}
//             animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
//             transition={{ duration: 0.5, ease: "easeOut" }}
//             className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
//           />
//         </div>
//       </div>

//       <div className="flex-1 p-8 pt-4 flex flex-col">
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ duration: 0.6 }}
//           className="flex-1 flex flex-col"
//         >
//           {/* Header */}
//           <div className="text-center mb-10 space-y-3 pt-6">
//             <motion.h1
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.2, duration: 0.6 }}
//               className="text-3xl text-white leading-tight"
//             >
//               Where does your spending feel{" "}
//               <span className="bg-gradient-to-r from-slate-400 to-slate-500 bg-clip-text text-transparent">
//                 "on autopilot"
//               </span>
//               ?
//             </motion.h1>
//             <motion.p
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.3, duration: 0.6 }}
//               className="text-slate-400 text-sm"
//             >
//               Select all that apply
//             </motion.p>
//           </div>

//           {/* Category Chips */}
//           <div className="flex-1 space-y-3 mb-6">
//             {categories.map((category, index) => {
//               const Icon = category.icon;
//               const isSelected = selectedCategories.includes(category.id);

//               return (
//                 <motion.button
//                   key={category.id}
//                   initial={{ opacity: 0, x: -20 }}
//                   animate={{ opacity: 1, x: 0 }}
//                   transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
//                   onClick={() => toggleCategory(category.id)}
//                   className={`w-full rounded-2xl p-5 transition-all text-left relative overflow-hidden ${
//                     isSelected
//                       ? "bg-slate-900 border-2 border-indigo-500"
//                       : "bg-slate-900 border border-slate-800 hover:border-slate-700"
//                   }`}
//                 >
//                   {/* Background gradient when selected */}
//                   {isSelected && (
//                     <motion.div
//                       initial={{ opacity: 0 }}
//                       animate={{ opacity: 1 }}
//                       className={`absolute inset-0 bg-gradient-to-r ${category.color} opacity-10`}
//                     />
//                   )}

//                   <div className="relative flex items-center gap-4">
//                     {/* Icon */}
//                     <div
//                       className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg ${isSelected ? "shadow-indigo-500/20" : ""}`}
//                     >
//                       <Icon className="w-7 h-7 text-white" />
//                     </div>

//                     {/* Label */}
//                     <div className="flex-1">
//                       <h3 className="text-white text-lg">{category.label}</h3>
//                     </div>

//                     {/* Checkmark */}
//                     {isSelected && (
//                       <motion.div
//                         initial={{ scale: 0 }}
//                         animate={{ scale: 1 }}
//                         className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center"
//                       >
//                         <Check className="w-4 h-4 text-white" />
//                       </motion.div>
//                     )}
//                   </div>
//                 </motion.button>
//               );
//             })}
//           </div>

//           {/* Continue Button */}
//           <motion.button
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.9, duration: 0.5 }}
//             onClick={handleNext}
//             disabled={selectedCategories.length === 0}
//             className="w-full py-4 rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-300 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
//           >
//             Calculate my margin
//           </motion.button>
//         </motion.div>
//       </div>
//     </div>
//   );
// }
