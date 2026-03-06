// import { Calendar, Check, ChevronLeft, CreditCard, Mail } from "lucide-react";
// import { motion } from "motion/react";
// import { useState } from "react";

// interface OnboardingStep6Props {
//   onComplete: () => void;
//   onBack: () => void;
//   currentStep: number;
//   totalSteps: number;
// }

// export function OnboardingStep6({
//   onComplete,
//   onBack,
//   currentStep,
//   totalSteps,
// }: OnboardingStep6Props) {
//   const [isAnnual, setIsAnnual] = useState(true);

//   const monthlyPrice = 9.99;
//   const annualPrice = 79.99;
//   const annualMonthly = (annualPrice / 12).toFixed(2);

//   const timeline = [
//     { day: "Today", text: "Your conscious journey begins", icon: Calendar },
//     { day: "Day 12", text: "We'll send you a reminder email", icon: Mail },
//     {
//       day: "Day 14",
//       text: "Trial ends. Subscription begins.",
//       icon: CreditCard,
//     },
//   ];

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
//           <Check className="w-5 h-5 text-emerald-500" />
//         </div>
//         <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
//           <motion.div
//             initial={{ width: `${((currentStep - 1) / totalSteps) * 100}%` }}
//             animate={{ width: "100%" }}
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
//           <div className="text-center mb-8 space-y-3 pt-8">
//             <motion.h1
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.2, duration: 0.6 }}
//               className="text-3xl text-white leading-relaxed"
//             >
//               Start your journey to financial peace.
//             </motion.h1>
//             <motion.p
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.3, duration: 0.6 }}
//               className="text-slate-400"
//             >
//               14 days of full access. Zero stress.
//             </motion.p>
//           </div>

//           {/* Timeline */}
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ delay: 0.4, duration: 0.6 }}
//             className="mb-8 space-y-4"
//           >
//             {timeline.map((item, index) => {
//               const Icon = item.icon;
//               return (
//                 <motion.div
//                   key={item.day}
//                   initial={{ opacity: 0, x: -20 }}
//                   animate={{ opacity: 1, x: 0 }}
//                   transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
//                   className="flex gap-4"
//                 >
//                   <div className="flex flex-col items-center">
//                     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
//                       <Icon className="w-5 h-5 text-white" />
//                     </div>
//                     {index < timeline.length - 1 && (
//                       <div className="w-0.5 h-12 bg-gradient-to-b from-indigo-500/50 to-purple-500/20 my-1" />
//                     )}
//                   </div>
//                   <div className="flex-1 pt-1">
//                     <p className="text-indigo-400 text-sm">{item.day}</p>
//                     <p className="text-slate-300">{item.text}</p>
//                   </div>
//                 </motion.div>
//               );
//             })}
//           </motion.div>

//           {/* Pricing Toggle */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.8, duration: 0.5 }}
//             className="mb-6"
//           >
//             <div className="p-1 bg-slate-900/50 rounded-3xl border border-slate-800 flex">
//               <button
//                 onClick={() => setIsAnnual(false)}
//                 className={`
//                   flex-1 py-3 rounded-3xl transition-all duration-300
//                   ${
//                     !isAnnual
//                       ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
//                       : "text-slate-400"
//                   }
//                 `}
//               >
//                 Monthly
//               </button>
//               <button
//                 onClick={() => setIsAnnual(true)}
//                 className={`
//                   flex-1 py-3 rounded-3xl transition-all duration-300 relative
//                   ${
//                     isAnnual
//                       ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
//                       : "text-slate-400"
//                   }
//                 `}
//               >
//                 Annual
//                 {isAnnual && (
//                   <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
//                     Save 33%
//                   </span>
//                 )}
//               </button>
//             </div>

//             {/* Pricing Display */}
//             <motion.div
//               key={isAnnual ? "annual" : "monthly"}
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="mt-6 p-6 rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700 text-center"
//             >
//               {isAnnual ? (
//                 <>
//                   <p className="text-slate-400 text-sm mb-2">Billed annually</p>
//                   <p className="text-white text-4xl mb-1">
//                     ${annualMonthly}
//                     <span className="text-xl text-slate-400">/mo</span>
//                   </p>
//                   <p className="text-slate-500 text-sm">${annualPrice}/year</p>
//                 </>
//               ) : (
//                 <>
//                   <p className="text-slate-400 text-sm mb-2">Billed monthly</p>
//                   <p className="text-white text-4xl mb-1">
//                     ${monthlyPrice}
//                     <span className="text-xl text-slate-400">/mo</span>
//                   </p>
//                 </>
//               )}
//             </motion.div>
//           </motion.div>

//           {/* CTA Button */}
//           <motion.button
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 1, duration: 0.5 }}
//             onClick={onComplete}
//             className="w-full py-5 rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-lg transition-all duration-300 shadow-lg shadow-indigo-500/30 mb-4"
//           >
//             Begin 14-Day Free Trial
//           </motion.button>

//           {/* Footer */}
//           <motion.p
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ delay: 1.2, duration: 0.5 }}
//             className="text-center text-slate-500 text-sm"
//           >
//             Cancel anytime. No hidden fees.
//           </motion.p>
//         </motion.div>
//       </div>
//     </div>
//   );
// }
