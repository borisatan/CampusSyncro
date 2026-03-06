// import { ChevronLeft, ChevronRight, DollarSign } from "lucide-react";
// import { motion } from "motion/react";
// import { useState } from "react";

// interface OnboardingIncomeScreenProps {
//   onNext: (income: number) => void;
//   onBack: () => void;
//   currentStep: number;
//   totalSteps: number;
// }

// export function OnboardingIncomeScreen({
//   onNext,
//   onBack,
//   currentStep,
//   totalSteps,
// }: OnboardingIncomeScreenProps) {
//   const [amount, setAmount] = useState("");

//   const handleNumberClick = (num: string) => {
//     if (amount.length < 8) {
//       setAmount((prev) => prev + num);
//     }
//   };

//   const handleBackspace = () => {
//     setAmount((prev) => prev.slice(0, -1));
//   };

//   const handleNext = () => {
//     const income = parseFloat(amount);
//     if (income > 0) {
//       onNext(income);
//     }
//   };

//   const isValid = amount.length > 0 && parseFloat(amount) > 0;

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
//           <div className="text-center mb-8 space-y-3 pt-6">
//             <motion.div
//               initial={{ scale: 0.8, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               transition={{ delay: 0.2, duration: 0.6 }}
//               className="flex justify-center mb-4"
//             >
//               <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/20">
//                 <DollarSign className="w-8 h-8 text-white" />
//               </div>
//             </motion.div>

//             <motion.h1
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.3, duration: 0.6 }}
//               className="text-3xl text-white leading-tight"
//             >
//               What's your rough monthly{" "}
//               <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
//                 take-home pay
//               </span>
//               ?
//             </motion.h1>
//             <motion.p
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.4, duration: 0.6 }}
//               className="text-slate-400 text-sm px-4"
//             >
//               This helps us calculate your potential savings. Just a rough
//               estimate is fine.
//             </motion.p>
//           </div>

//           {/* Amount Display */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.5, duration: 0.6 }}
//             className={`bg-slate-900 border rounded-3xl p-6 mb-6 transition-all ${
//               isValid
//                 ? "border-emerald-500 bg-emerald-500/10"
//                 : "border-slate-800"
//             }`}
//           >
//             <div className="text-center">
//               <p className="text-sm text-slate-500 mb-2">Monthly Take-Home</p>
//               <div className="flex items-center justify-center gap-1">
//                 <span className="text-slate-500 text-4xl">$</span>
//                 <span className="text-white text-5xl font-light min-w-[160px] text-center">
//                   {amount || "0"}
//                 </span>
//               </div>
//             </div>
//           </motion.div>

//           {/* Quick Presets */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.6, duration: 0.6 }}
//             className="grid grid-cols-3 gap-3 mb-6"
//           >
//             {[2000, 3500, 5000].map((preset) => (
//               <button
//                 key={preset}
//                 onClick={() => setAmount(preset.toString())}
//                 className="bg-slate-900 border border-slate-800 rounded-2xl py-3 text-slate-300 text-sm hover:bg-slate-800 hover:border-slate-700 active:scale-95 transition-all"
//               >
//                 ${preset.toLocaleString()}
//               </button>
//             ))}
//           </motion.div>

//           {/* Numeric Keypad */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.7, duration: 0.6 }}
//             className="flex-1 grid grid-cols-3 gap-3 mb-4"
//           >
//             {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
//               <button
//                 key={num}
//                 onClick={() => handleNumberClick(num.toString())}
//                 className="bg-slate-900 border border-slate-800 rounded-2xl py-5 text-white text-2xl hover:bg-slate-800 active:scale-95 transition-all"
//               >
//                 {num}
//               </button>
//             ))}
//             <button
//               onClick={() => handleNumberClick("00")}
//               className="bg-slate-900 border border-slate-800 rounded-2xl py-5 text-white text-xl hover:bg-slate-800 active:scale-95 transition-all"
//             >
//               00
//             </button>
//             <button
//               onClick={() => handleNumberClick("0")}
//               className="bg-slate-900 border border-slate-800 rounded-2xl py-5 text-white text-2xl hover:bg-slate-800 active:scale-95 transition-all"
//             >
//               0
//             </button>
//             <button
//               onClick={handleBackspace}
//               className="bg-slate-900 border border-slate-800 rounded-2xl py-5 text-slate-400 text-xl hover:bg-slate-800 active:scale-95 transition-all"
//             >
//               ←
//             </button>
//           </motion.div>

//           {/* Continue Button */}
//           <motion.button
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.8, duration: 0.5 }}
//             onClick={handleNext}
//             disabled={!isValid}
//             className={`w-full py-4 rounded-3xl transition-all duration-300 ${
//               isValid
//                 ? "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/30"
//                 : "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed"
//             }`}
//           >
//             Continue
//           </motion.button>
//         </motion.div>
//       </div>
//     </div>
//   );
// }
