// import {
//     Check,
//     ChevronLeft,
//     ChevronRight,
//     Coffee,
//     Sparkles,
// } from "lucide-react";
// import { AnimatePresence, motion } from "motion/react";
// import { useState } from "react";

// interface OnboardingScreen5Props {
//   onNext: () => void;
//   onBack: () => void;
//   currentStep: number;
//   totalSteps: number;
// }

// export function OnboardingScreen5({
//   onNext,
//   onBack,
//   currentStep,
//   totalSteps,
// }: OnboardingScreen5Props) {
//   const [amount, setAmount] = useState("");
//   const [showSuccess, setShowSuccess] = useState(false);

//   const handleNumberClick = (num: string) => {
//     if (amount.length < 6) {
//       setAmount((prev) => prev + num);
//     }
//   };

//   const handleDecimal = () => {
//     if (!amount.includes(".") && amount.length > 0) {
//       setAmount((prev) => prev + ".");
//     }
//   };

//   const handleBackspace = () => {
//     setAmount((prev) => prev.slice(0, -1));
//   };

//   const handleSubmit = () => {
//     if (amount === "5" || amount === "5.00" || amount === "5.0") {
//       setShowSuccess(true);
//       setTimeout(() => {
//         onNext();
//       }, 2000);
//     }
//   };

//   const isComplete = amount === "5" || amount === "5.00" || amount === "5.0";

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
//           {/* Task */}
//           <div className="text-center mb-6">
//             <motion.p
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.2, duration: 0.6 }}
//               className="text-slate-400 text-sm mb-2"
//             >
//               Practice Entry
//             </motion.p>
//             <motion.h1
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.3, duration: 0.6 }}
//               className="text-2xl text-white"
//             >
//               Log a{" "}
//               <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
//                 $5.00 Coffee
//               </span>
//             </motion.h1>
//           </div>

//           {/* Category Preview */}
//           <motion.div
//             initial={{ opacity: 0, scale: 0.95 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ delay: 0.4, duration: 0.6 }}
//             className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6"
//           >
//             <div className="flex items-center gap-3">
//               <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
//                 <Coffee className="w-7 h-7 text-white" />
//               </div>
//               <div className="flex-1">
//                 <p className="text-sm text-slate-500">Category</p>
//                 <h3 className="text-white text-lg">Dining Out</h3>
//               </div>
//             </div>
//           </motion.div>

//           {/* Amount Display */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.5, duration: 0.6 }}
//             className={`bg-slate-900 border rounded-3xl p-6 mb-6 transition-all ${
//               showSuccess
//                 ? "border-emerald-500 bg-emerald-500/10"
//                 : isComplete
//                   ? "border-indigo-500 bg-indigo-500/10"
//                   : "border-slate-800"
//             }`}
//           >
//             <AnimatePresence mode="wait">
//               {!showSuccess ? (
//                 <motion.div
//                   key="amount"
//                   initial={{ opacity: 1 }}
//                   exit={{ opacity: 0, scale: 0.95 }}
//                   className="text-center"
//                 >
//                   <p className="text-sm text-slate-500 mb-2">Amount</p>
//                   <div className="flex items-center justify-center gap-1">
//                     <span className="text-slate-500 text-3xl">$</span>
//                     <span className="text-white text-5xl font-light min-w-[120px] text-center">
//                       {amount || "0"}
//                     </span>
//                   </div>
//                 </motion.div>
//               ) : (
//                 <motion.div
//                   key="success"
//                   initial={{ opacity: 0, scale: 0.8 }}
//                   animate={{ opacity: 1, scale: 1 }}
//                   className="text-center py-3"
//                 >
//                   <motion.div
//                     initial={{ scale: 0 }}
//                     animate={{ scale: 1 }}
//                     transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
//                     className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center"
//                   >
//                     <Check className="w-8 h-8 text-white" />
//                   </motion.div>
//                   <motion.div
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: 0.4 }}
//                     className="flex items-center justify-center gap-2"
//                   >
//                     <Sparkles className="w-5 h-5 text-emerald-400" />
//                     <h3 className="text-2xl bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
//                       Clarity +1
//                     </h3>
//                     <Sparkles className="w-5 h-5 text-emerald-400" />
//                   </motion.div>
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </motion.div>

//           {/* Numeric Keypad */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.6, duration: 0.6 }}
//             className="flex-1 grid grid-cols-3 gap-3 mb-4"
//           >
//             {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
//               <button
//                 key={num}
//                 onClick={() => handleNumberClick(num.toString())}
//                 disabled={showSuccess}
//                 className="bg-slate-900 border border-slate-800 rounded-2xl py-5 text-white text-2xl hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
//               >
//                 {num}
//               </button>
//             ))}
//             <button
//               onClick={handleDecimal}
//               disabled={showSuccess}
//               className="bg-slate-900 border border-slate-800 rounded-2xl py-5 text-white text-2xl hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
//             >
//               .
//             </button>
//             <button
//               onClick={() => handleNumberClick("0")}
//               disabled={showSuccess}
//               className="bg-slate-900 border border-slate-800 rounded-2xl py-5 text-white text-2xl hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
//             >
//               0
//             </button>
//             <button
//               onClick={handleBackspace}
//               disabled={showSuccess}
//               className="bg-slate-900 border border-slate-800 rounded-2xl py-5 text-slate-400 text-xl hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
//             >
//               ←
//             </button>
//           </motion.div>

//           {/* Submit Button */}
//           <motion.button
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.7, duration: 0.5 }}
//             onClick={handleSubmit}
//             disabled={!isComplete || showSuccess}
//             className={`w-full py-4 rounded-3xl transition-all duration-300 ${
//               isComplete && !showSuccess
//                 ? "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/30"
//                 : "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed"
//             }`}
//           >
//             {showSuccess ? "Moving on..." : "Log Purchase"}
//           </motion.button>
//         </motion.div>
//       </div>
//     </div>
//   );
// }
