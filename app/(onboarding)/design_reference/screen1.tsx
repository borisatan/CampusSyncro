// import { ArrowRight, Sparkles } from "lucide-react";
// import { motion } from "motion/react";

// interface OnboardingScreen1Props {
//   onNext: () => void;
//   currentStep: number;
//   totalSteps: number;
// }

// export function OnboardingScreen1({
//   onNext,
//   currentStep,
//   totalSteps,
// }: OnboardingScreen1Props) {
//   return (
//     <div className="min-h-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col">
//       {/* Progress Bar */}
//       <div className="px-8 pt-6 pb-4">
//         <div className="flex items-center justify-between mb-2">
//           <span className="text-slate-400 text-sm">
//             Step {currentStep} of {totalSteps}
//           </span>
//           <Sparkles className="w-5 h-5 text-slate-600" />
//         </div>
//         <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
//           <motion.div
//             initial={{ width: 0 }}
//             animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
//             transition={{ duration: 0.5, ease: "easeOut" }}
//             className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
//           />
//         </div>
//       </div>

//       <div className="flex-1 p-8 pt-4 flex flex-col justify-center">
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ duration: 0.8 }}
//           className="text-center space-y-8"
//         >
//           {/* Icon/Logo Area */}
//           <motion.div
//             initial={{ scale: 0.8, opacity: 0 }}
//             animate={{ scale: 1, opacity: 1 }}
//             transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
//             className="flex justify-center"
//           >
//             <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
//               <Sparkles className="w-10 h-10 text-white" />
//             </div>
//           </motion.div>

//           {/* Headline */}
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.4, duration: 0.8 }}
//             className="space-y-4 px-2"
//           >
//             <h1 className="text-4xl text-white leading-tight">
//               Stop watching your money{" "}
//               <span className="bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
//                 leave
//               </span>
//               .
//             </h1>
//             <h1 className="text-4xl text-white leading-tight">
//               Start deciding where it{" "}
//               <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
//                 goes
//               </span>
//               .
//             </h1>
//           </motion.div>

//           {/* Sub-headline */}
//           <motion.p
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.6, duration: 0.8 }}
//             className="text-slate-400 text-lg italic px-6"
//           >
//             Mastery begins with awareness.
//           </motion.p>

//           {/* Decorative element */}
//           <motion.div
//             initial={{ opacity: 0, scale: 0.8 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ delay: 0.8, duration: 0.8 }}
//             className="flex justify-center"
//           >
//             <div className="h-1 w-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
//           </motion.div>

//           {/* Primary Button */}
//           <motion.button
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 1, duration: 0.6 }}
//             onClick={onNext}
//             className="w-full py-5 rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-lg transition-all duration-300 shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 group"
//           >
//             Begin your journey
//             <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
//           </motion.button>
//         </motion.div>
//       </div>
//     </div>
//   );
// }
