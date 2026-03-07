// import { motion } from 'motion/react';
// import { ArrowRight, Sparkles, Stars, Zap } from 'lucide-react';

// interface OnboardingScreen1Props {
//   onNext: () => void;
//   currentStep: number;
//   totalSteps: number;
// }

// export function OnboardingScreen1({ onNext, currentStep, totalSteps }: OnboardingScreen1Props) {
//   return (
//     <div className="min-h-full bg-slate-950 flex flex-col relative overflow-hidden">
//       {/* Animated Background Gradients */}
//       <motion.div
//         className="absolute inset-0 opacity-30"
//         animate={{
//           background: [
//             'radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.3) 0%, transparent 50%)',
//             'radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)',
//             'radial-gradient(circle at 40% 80%, rgba(99, 102, 241, 0.3) 0%, transparent 50%)',
//           ],
//         }}
//         transition={{
//           duration: 8,
//           repeat: Infinity,
//           repeatType: "reverse",
//         }}
//       />

//       {/* Floating Particles */}
//       {[...Array(20)].map((_, i) => (
//         <motion.div
//           key={i}
//           className="absolute w-1 h-1 bg-indigo-400 rounded-full"
//           style={{
//             left: `${Math.random() * 100}%`,
//             top: `${Math.random() * 100}%`,
//           }}
//           animate={{
//             y: [0, -30, 0],
//             opacity: [0, 1, 0],
//             scale: [0, 1.5, 0],
//           }}
//           transition={{
//             duration: 3 + Math.random() * 2,
//             repeat: Infinity,
//             delay: Math.random() * 2,
//           }}
//         />
//       ))}

//       {/* Progress Bar */}
//       <div className="px-8 pt-6 pb-4 relative z-10">
//         <div className="flex items-center justify-between mb-2">
//           <span className="text-slate-400 text-sm font-medium">Step {currentStep} of {totalSteps}</span>
//           <motion.div
//             animate={{ rotate: 360 }}
//             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
//           >
//             <Sparkles className="w-5 h-5 text-indigo-400" />
//           </motion.div>
//         </div>
//         <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden shadow-inner">
//           <motion.div
//             initial={{ width: 0 }}
//             animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
//             transition={{ duration: 0.8, ease: 'easeOut' }}
//             className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/50"
//           />
//         </div>
//       </div>

//       <div className="flex-1 p-8 pt-4 flex flex-col justify-center relative z-10">
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ duration: 0.8 }}
//           className="text-center space-y-8"
//         >
//           {/* Floating Stars */}
//           <div className="relative h-32 mb-4">
//             <motion.div
//               animate={{
//                 y: [0, -20, 0],
//                 rotate: [0, 5, 0],
//               }}
//               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
//               className="absolute left-1/4 top-0"
//             >
//               <Stars className="w-6 h-6 text-purple-400 opacity-60" />
//             </motion.div>
//             <motion.div
//               animate={{
//                 y: [0, -15, 0],
//                 rotate: [0, -5, 0],
//               }}
//               transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
//               className="absolute right-1/4 top-4"
//             >
//               <Zap className="w-5 h-5 text-indigo-400 opacity-60" />
//             </motion.div>

//             {/* Central Icon */}
//             <motion.div
//               initial={{ scale: 0.8, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
//               className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
//             >
//               <motion.div
//                 animate={{
//                   boxShadow: [
//                     '0 0 20px rgba(99, 102, 241, 0.3)',
//                     '0 0 60px rgba(168, 85, 247, 0.5)',
//                     '0 0 20px rgba(99, 102, 241, 0.3)',
//                   ],
//                 }}
//                 transition={{ duration: 3, repeat: Infinity }}
//                 className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center relative"
//               >
//                 <motion.div
//                   animate={{ rotate: 360 }}
//                   transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
//                   className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/20 to-transparent"
//                 />
//                 <Sparkles className="w-12 h-12 text-white relative z-10" />
//               </motion.div>
//             </motion.div>
//           </div>

//           {/* Headline with Gradient Animation */}
//           <motion.div
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.4, duration: 0.8 }}
//             className="space-y-4 px-2"
//           >
//             <h1 className="text-4xl text-white leading-tight font-light">
//               Stop watching your money{' '}
//               <motion.span
//                 className="bg-gradient-to-r from-rose-400 via-red-400 to-orange-400 bg-clip-text text-transparent"
//                 animate={{
//                   backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
//                 }}
//                 transition={{ duration: 5, repeat: Infinity }}
//                 style={{ backgroundSize: '200% 200%' }}
//               >
//                 leave
//               </motion.span>
//               .
//             </h1>
//             <h1 className="text-4xl text-white leading-tight font-light">
//               Start deciding where it{' '}
//               <motion.span
//                 className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent"
//                 animate={{
//                   backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
//                 }}
//                 transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
//                 style={{ backgroundSize: '200% 200%' }}
//               >
//                 goes
//               </motion.span>
//               .
//             </h1>
//           </motion.div>

//           {/* Sub-headline with glow */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.6, duration: 0.8 }}
//             className="relative"
//           >
//             <motion.div
//               animate={{
//                 opacity: [0.3, 0.6, 0.3],
//               }}
//               transition={{ duration: 3, repeat: Infinity }}
//               className="absolute inset-0 blur-xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-30"
//             />
//             <p className="text-slate-300 text-lg italic px-6 relative z-10">
//               Mastery begins with awareness.
//             </p>
//           </motion.div>

//           {/* Decorative element with animation */}
//           <motion.div
//             initial={{ opacity: 0, scale: 0.8 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ delay: 0.8, duration: 0.8 }}
//             className="flex justify-center gap-2"
//           >
//             {[...Array(3)].map((_, i) => (
//               <motion.div
//                 key={i}
//                 animate={{
//                   scale: [1, 1.5, 1],
//                   opacity: [0.5, 1, 0.5],
//                 }}
//                 transition={{
//                   duration: 2,
//                   repeat: Infinity,
//                   delay: i * 0.3,
//                 }}
//                 className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
//               />
//             ))}
//           </motion.div>

//           {/* Primary Button with enhanced effects */}
//           <motion.button
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 1, duration: 0.6 }}
//             onClick={onNext}
//             className="relative w-full py-5 rounded-3xl overflow-hidden text-white text-lg group mt-8"
//           >
//             {/* Animated gradient background */}
//             <motion.div
//               className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"
//               animate={{
//                 backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
//               }}
//               transition={{ duration: 3, repeat: Infinity }}
//               style={{ backgroundSize: '200% 200%' }}
//             />

//             {/* Shimmer effect */}
//             <motion.div
//               className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
//               animate={{
//                 x: ['-200%', '200%'],
//               }}
//               transition={{
//                 duration: 2,
//                 repeat: Infinity,
//                 repeatDelay: 1,
//               }}
//             />

//             {/* Glow effect */}
//             <motion.div
//               className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
//               style={{
//                 boxShadow: '0 0 40px rgba(168, 85, 247, 0.6), inset 0 0 40px rgba(168, 85, 247, 0.3)',
//               }}
//             />

//             <span className="relative z-10 flex items-center justify-center gap-2 font-medium">
//               Begin your journey
//               <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
//             </span>
//           </motion.button>

//           {/* Bottom decorative text */}
//           <motion.p
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ delay: 1.2, duration: 0.8 }}
//             className="text-slate-500 text-xs tracking-wider uppercase"
//           >
//             A mindful approach to money
//           </motion.p>
//         </motion.div>
//       </div>
//     </div>
//   );
// }
