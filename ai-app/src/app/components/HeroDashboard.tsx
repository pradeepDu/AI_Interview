import React from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import {
    Github,
    MessageSquare,
    Video,
    CheckCircle2,
    GitPullRequest,
    Search,
    Layers
} from 'lucide-react';
import { cn } from "@/lib/utils";

export function HeroDashboard() {
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 500], [0, 100]);
    const rotateX = useTransform(scrollY, [0, 500], [20, 0]);

    return (
        <div className="relative w-full h-150 perspective-[2000px] flex items-center justify-center overflow-visible">
            <motion.div
                style={{ rotateX: 20, y }}
                animate={{
                    rotateY: [-5, 5, -5],
                    rotateZ: [-2, 2, -2]
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="relative w-[90%] max-w-250px h-150 preserve-3d"
            >
                {/* Main Base Layer - The OS Desktop */}
                <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    {/* Fake Browser/App Header */}
                    <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-white/5">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/50" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                            <div className="w-3 h-3 rounded-full bg-green-500/50" />
                        </div>
                        <div className="ml-4 px-3 py-1 bg-black/40 rounded-md text-xs text-gray-400 flex items-center gap-2 border border-white/5">
                            <Search className="w-3 h-3" />
                            Search CareerFlow... (Cmd+K)
                        </div>
                    </div>

                    {/* App Content Layout */}
                    <div className="flex-1 flex">
                        {/* Sidebar */}
                        <div className="w-16 border-r border-white/5 flex flex-col items-center py-4 gap-6 bg-white/2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white"><Layers size={18} /></div>
                            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400"><MessageSquare size={18} /></div>
                            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400"><CheckCircle2 size={18} /></div>
                        </div>

                        {/* Kanban Board Area */}
                        <div className="flex-1 p-6 grid grid-cols-3 gap-4">
                            {['To Do', 'In Progress', 'Done'].map((col, i) => (
                                <div key={col} className="flex flex-col gap-3">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{col}</div>
                                    {[1, 2].map(card => (
                                        <div key={card} className="bg-gray-800/50 border border-white/5 p-3 rounded-lg shadow-sm">
                                            <div className="w-12 h-2 rounded-full bg-gray-700 mb-2" />
                                            <div className="w-full h-3 rounded bg-gray-700/50 mb-1" />
                                            <div className="w-2/3 h-3 rounded bg-gray-700/50" />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Floating Elements (Z-Index Layers) */}

                {/* Layer 1: Video Call Widget */}
                <motion.div
                    className="absolute -right-12 top-20 w-64 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    style={{ translateZ: 80 }}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-teal-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" /> Live
                        </span>
                        <Video size={14} className="text-gray-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="avatar" className="w-full h-full object-cover opacity-70" />
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Layer 2: Code/GitHub Widget */}
                <motion.div
                    className="absolute -left-12 bottom-24 w-72 bg-[#0d1117]/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] font-mono text-xs"
                    style={{ translateZ: 120 }}
                    animate={{ y: [0, 15, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                >
                    <div className="flex items-center gap-2 text-gray-400 mb-3 border-b border-white/5 pb-2">
                        <Github size={14} />
                        <span>careerflow/core</span>
                    </div>
                    <div className="space-y-2 text-gray-500">
                        <div className="flex gap-2">
                            <span className="text-purple-400">const</span>
                            <span className="text-blue-400">syncEngine</span> = <span className="text-yellow-300">await</span> init();
                        </div>
                        <div className="flex gap-2 pl-4">
                            <span className="text-purple-400">return</span>
                            <span className="text-green-400">syncEngine.connect</span>(nodes);
                        </div>
                        <div className="mt-3 flex items-center gap-2 bg-green-500/10 text-green-400 p-2 rounded">
                            <GitPullRequest size={12} />
                            <span>Merged PR #402</span>
                        </div>
                    </div>
                </motion.div>

                {/* Layer 3: Notification/Chat */}
                <motion.div
                    className="absolute right-20 -bottom-10 w-60 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    style={{ translateZ: 150 }}
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-linear-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">JD</div>
                        <div>
                            <div className="text-xs font-bold text-white">Jane Doe</div>
                            <div className="text-[10px] text-gray-400">Just uploaded the roadmap 🚀</div>
                        </div>
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
};
