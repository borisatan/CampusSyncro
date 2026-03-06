// import {
//     ChevronLeft,
//     ChevronRight,
//     CloudRain,
//     Eye,
//     EyeOff,
//     Sun,
//     TrendingUp,
// } from "lucide-react";
// import { motion } from "motion/react";

// interface OnboardingRevealScreenProps {
//   selectedCategories: string[];
//   monthlyIncome: number;
//   onNext: () => void;
//   onBack: () => void;
//   currentStep: number;
//   totalSteps: number;
// }

// export function OnboardingRevealScreen({
//   monthlyIncome,
//   onNext,
//   onBack,
//   currentStep,
//   totalSteps,
// }: OnboardingRevealScreenProps) {
//   // Calculate 15% of monthly income as the mindfulness margin
//   const projectedRetention = Math.round(monthlyIncome * 0.15);

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
//           className="flex-1 flex flex-col justify-center"
//         >
//           {/* Headline */}
//           <div className="text-center mb-10 space-y-4">
//             <motion.div
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.2, duration: 0.7 }}
//             >
//               <h1 className="text-4xl text-white leading-tight mb-3">
//                 The Cost of
//               </h1>
//               <h1 className="text-4xl bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent leading-tight">
//                 Inattention
//               </h1>
//             </motion.div>
//           </div>

//           {/* Comparison Cards */}
//           <div className="space-y-4 mb-6">
//             {/* Without Monelo Card */}
//             <motion.div
//               initial={{ opacity: 0, x: -30 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{
//                 delay: 0.5,
//                 duration: 0.7,
//                 type: "spring",
//                 stiffness: 100,
//               }}
//               className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden"
//             >
//               {/* Background gradient */}
//               <div className="absolute inset-0 bg-gradient-to-br from-slate-800/30 to-slate-900/30" />

//               <div className="relative">
//                 {/* Icon & Title */}
//                 <div className="flex items-center gap-3 mb-4">
//                   <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
//                     <EyeOff className="w-6 h-6 text-slate-500" />
//                   </div>
//                   <div>
//                     <h3 className="text-white text-lg">Without Monelo</h3>
//                   </div>
//                 </div>

//                 {/* Stats Grid */}
//                 <div className="space-y-4 pl-1">
//                   <div>
//                     <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
//                       Monthly Retention
//                     </p>
//                     <div className="flex items-baseline gap-2">
//                       <motion.p
//                         initial={{ opacity: 0, scale: 0.5 }}
//                         animate={{ opacity: 1, scale: 1 }}
//                         transition={{ delay: 0.7, duration: 0.5 }}
//                         className="text-3xl text-slate-400"
//                       >
//                         $0
//                       </motion.p>
//                       <motion.div
//                         initial={{ opacity: 0 }}
//                         animate={{ opacity: 1 }}
//                         transition={{ delay: 0.9, duration: 0.5 }}
//                       >
//                         <TrendingUp className="w-5 h-5 text-slate-600 rotate-180" />
//                       </motion.div>
//                     </div>
//                   </div>

//                   <div className="border-t border-slate-800 pt-4">
//                     <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
//                       Status
//                     </p>
//                     <div className="flex items-center gap-2">
//                       <CloudRain className="w-5 h-5 text-slate-600" />
//                       <p className="text-slate-400">Foggy</p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>

//             {/* With Monelo Card */}
//             <motion.div
//               initial={{ opacity: 0, x: 30 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{
//                 delay: 0.7,
//                 duration: 0.7,
//                 type: "spring",
//                 stiffness: 100,
//               }}
//               className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/50 rounded-3xl p-6 relative overflow-hidden"
//             >
//               {/* Animated glow */}
//               <motion.div
//                 className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10"
//                 animate={{
//                   opacity: [0.3, 0.6, 0.3],
//                 }}
//                 transition={{
//                   duration: 3,
//                   repeat: Infinity,
//                   ease: "easeInOut",
//                 }}
//               />

//               <div className="relative">
//                 {/* Icon & Title */}
//                 <div className="flex items-center gap-3 mb-4">
//                   <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
//                     <Eye className="w-6 h-6 text-white" />
//                   </div>
//                   <div>
//                     <h3 className="text-white text-lg">With Monelo</h3>
//                   </div>
//                 </div>

//                 {/* Stats Grid */}
//                 <div className="space-y-4 pl-1">
//                   <div>
//                     <p className="text-xs text-indigo-300/70 uppercase tracking-wider mb-1">
//                       Monthly Retention
//                     </p>
//                     <div className="flex items-baseline gap-2">
//                       <motion.p
//                         initial={{ opacity: 0, scale: 0.5 }}
//                         animate={{ opacity: 1, scale: 1 }}
//                         transition={{ delay: 0.9, duration: 0.5 }}
//                         className="text-3xl text-white"
//                       >
//                         ${projectedRetention.toLocaleString()}
//                       </motion.p>
//                       <motion.div
//                         initial={{ opacity: 0, y: 5 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         transition={{ delay: 1.1, duration: 0.5 }}
//                       >
//                         <TrendingUp className="w-5 h-5 text-emerald-400" />
//                       </motion.div>
//                     </div>
//                   </div>

//                   <div className="border-t border-indigo-500/30 pt-4">
//                     <p className="text-xs text-indigo-300/70 uppercase tracking-wider mb-2">
//                       Status
//                     </p>
//                     <div className="flex items-center gap-2">
//                       <Sun className="w-5 h-5 text-amber-400" />
//                       <p className="text-white">Intentional</p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           </div>

//           {/* Footnote */}
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ delay: 1.3, duration: 0.7 }}
//             className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-6"
//           >
//             <p className="text-xs text-slate-400 text-center leading-relaxed">
//               Based on the{" "}
//               <span className="text-indigo-400 font-medium">
//                 15% Mindfulness Margin
//               </span>{" "}
//               regained through manual tracking
//             </p>
//           </motion.div>

//           {/* Continue Button */}
//           <motion.button
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 1.5, duration: 0.5 }}
//             onClick={onNext}
//             className="w-full py-4 rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-300 shadow-lg shadow-indigo-500/30"
//           >
//             Secure my clarity
//           </motion.button>
//         </motion.div>
//       </div>
//     </div>
//   );
// }
