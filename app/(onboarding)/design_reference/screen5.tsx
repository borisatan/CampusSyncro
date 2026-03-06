// import { Brain, ChevronLeft, ChevronRight, Hand, Zap } from "lucide-react";
// import { motion } from "motion/react";

// interface OnboardingScreen4Props {
//   onNext: () => void;
//   onBack: () => void;
//   currentStep: number;
//   totalSteps: number;
// }

// export function OnboardingScreen4({
//   onNext,
//   onBack,
//   currentStep,
//   totalSteps,
// }: OnboardingScreen4Props) {
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
//           <div className="text-center mb-8 space-y-3">
//             <motion.h1
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.2, duration: 0.6 }}
//               className="text-4xl text-white leading-tight"
//             >
//               Why{" "}
//               <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
//                 Manual
//               </span>
//               ?
//             </motion.h1>
//           </div>

//           {/* Philosophy Content */}
//           <div className="space-y-6 mb-8">
//             {/* Automation Card */}
//             <motion.div
//               initial={{ opacity: 0, x: -30 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ delay: 0.4, duration: 0.6 }}
//               className="bg-slate-900 border border-slate-800 rounded-3xl p-6"
//             >
//               <div className="flex gap-4">
//                 <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center flex-shrink-0">
//                   <Zap className="w-6 h-6 text-slate-500" />
//                 </div>
//                 <div>
//                   <h3 className="text-white mb-2">Automation is forgettable</h3>
//                   <p className="text-slate-400 text-sm leading-relaxed">
//                     When apps track purchases automatically, spending becomes
//                     invisible. You lose the connection between action and
//                     consequence.
//                   </p>
//                 </div>
//               </div>
//             </motion.div>

//             {/* Choice Point Card */}
//             <motion.div
//               initial={{ opacity: 0, x: 30 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ delay: 0.6, duration: 0.6 }}
//               className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/50 rounded-3xl p-6 relative overflow-hidden"
//             >
//               {/* Soft glow */}
//               <motion.div
//                 className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10"
//                 animate={{
//                   opacity: [0.3, 0.5, 0.3],
//                 }}
//                 transition={{
//                   duration: 3,
//                   repeat: Infinity,
//                   ease: "easeInOut",
//                 }}
//               />

//               <div className="relative flex gap-4">
//                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
//                   <Hand className="w-6 h-6 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-white mb-2">
//                     Typing creates a{" "}
//                     <span className="text-indigo-300">"Choice Point"</span>
//                   </h3>
//                   <p className="text-slate-300 text-sm leading-relaxed">
//                     A 3-second pause that changes your brain. Each manual entry
//                     builds awareness, making future spending more intentional.
//                   </p>
//                 </div>
//               </div>
//             </motion.div>

//             {/* Brain Science Card */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.8, duration: 0.6 }}
//               className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5"
//             >
//               <div className="flex items-start gap-3">
//                 <Brain className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
//                 <p className="text-slate-400 text-xs leading-relaxed">
//                   Research shows that the act of recording a transaction
//                   manually increases financial mindfulness by up to 43% compared
//                   to automated tracking.
//                 </p>
//               </div>
//             </motion.div>
//           </div>

//           {/* Continue Button */}
//           <motion.button
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 1, duration: 0.5 }}
//             onClick={onNext}
//             className="w-full py-4 rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-300 shadow-lg shadow-indigo-500/30"
//           >
//             Try a practice entry
//           </motion.button>
//         </motion.div>
//       </div>
//     </div>
//   );
// }
