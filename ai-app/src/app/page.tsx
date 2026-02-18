"use client";
import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import {
    Zap,
    Github,
    LayoutGrid,
    MessageSquare,
    Video,
    FileText,
    CheckCircle2,
    Command,
    GitPullRequest,
    Users,
    ArrowRight,
    Search,
    Layers
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { NavBar, HeroDashboard, SectionHeading, SpotLightCard } from "@/app/components/index";

export default function HulyPage() {
    return (
        <div className="min-h-screen bg-[#030712] text-gray-200 font-sans selection:bg-indigo-500/30">
            <NavBar />

            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-125 bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-200 h-150 bg-teal-600/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tighter mb-8 leading-[1.1]">
                            Everything App <br />
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-cyan-400">
                                for your team.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                            OrbitFlow replaces Jira, Slack, Notion, and Zoom. <br className="hidden md:block" />
                            The operating system for high-velocity engineering teams.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                            <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-semibold text-lg transition-all shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)]">
                                Start Building Free
                            </button>
                            <button className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full font-semibold text-lg transition-all flex items-center gap-2">
                                <Video size={18} /> See in Action
                            </button>
                        </div>
                    </motion.div>

                    {/* 3D Dashboard Visual */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                    >
                        <HeroDashboard />
                    </motion.div>
                </div>
            </section>

            {/* PRODUCTIVITY SECTION */}
            <section className="py-24 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <SectionHeading
                        badge="Productivity 2.0"
                        title="Unmatched Speed."
                        sub="Engineered for flow state. Keyboard-first navigation, instant page loads, and features designed to keep you coding, not managing."
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <SpotLightCard className="col-span-1 md:col-span-2 p-8">
                            <div className="flex justify-between items-start mb-8">
                                <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400"><LayoutGrid /></div>
                                <div className="px-3 py-1 rounded bg-white/5 text-xs text-gray-400 font-mono">CMD + K</div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Linear-style Planning</h3>
                            <p className="text-gray-400 mb-8">Cycles, projects, and roadmaps visualized automatically.</p>
                            <div className="w-full bg-gray-950 rounded-lg border border-white/5 p-4 font-mono text-xs text-gray-500">
                                <div className="flex gap-4 border-b border-white/5 pb-2 mb-2">
                                    <span className="text-white">Backlog</span>
                                    <span>Todo</span>
                                    <span>In Progress</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="bg-gray-900 p-2 rounded border-l-2 border-yellow-500">Fix API Latency</div>
                                    <div className="bg-gray-900 p-2 rounded border-l-2 border-purple-500">Design System V2</div>
                                </div>
                            </div>
                        </SpotLightCard>

                        <SpotLightCard className="p-8 flex flex-col justify-center">
                            <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400 w-fit mb-6"><Zap /></div>
                            <h3 className="text-xl font-bold text-white mb-2">Time Boxing</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Drag tasks directly into your calendar. Block time for deep work instantly.
                            </p>
                            <div className="mt-6 flex-1 bg-gray-950 rounded border border-white/5 relative overflow-hidden">
                                <div className="absolute top-4 left-4 right-4 h-8 bg-indigo-600/20 border border-indigo-500/30 rounded flex items-center px-2 text-[10px] text-indigo-300">
                                    Deep Work
                                </div>
                            </div>
                        </SpotLightCard>
                    </div>
                </div>
            </section>

            {/* VIRTUAL OFFICE */}
            <section className="py-24 bg-linear-to-b from-transparent to-indigo-950/20 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-block p-3 rounded-xl bg-teal-500/10 text-teal-400 mb-6">
                            <Users size={32} />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Work together,<br /> like in the office.</h2>
                        <p className="text-xl text-gray-400 mb-8">
                            Hop into audio rooms, share screens in 4K, and see who's around. Spontaneous collaboration without the scheduling tag.
                        </p>
                        <ul className="space-y-4 text-gray-300">
                            {['Spatial Audio', 'Instant Screen Sharing', 'Guest Access', 'Record & Transcribe'].map(item => (
                                <li key={item} className="flex items-center gap-3">
                                    <CheckCircle2 className="text-teal-400 w-5 h-5" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative">
                        {/* Abstract Office Representation */}
                        <div className="aspect-square bg-gray-900/50 rounded-3xl border border-white/10 p-6 relative overflow-hidden backdrop-blur-sm">
                            <div className="grid grid-cols-2 gap-4 h-full">
                                <div className="bg-gray-800/40 rounded-2xl border border-white/5 p-4 relative group">
                                    <span className="text-xs text-gray-500 uppercase font-bold">Lobby</span>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="flex -space-x-3">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-10 h-10 rounded-full border-2 border-gray-800 bg-linear-to-br from-indigo-500 to-purple-600" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-indigo-900/20 rounded-2xl border border-indigo-500/30 p-4 relative">
                                    <span className="text-xs text-indigo-400 uppercase font-bold flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Design Room
                                    </span>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto mb-2 overflow-hidden">
                                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                                            </div>
                                            <span className="text-xs font-mono text-indigo-200">Talking...</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2 bg-gray-800/40 rounded-2xl border border-white/5 p-4">
                                    <span className="text-xs text-gray-500 uppercase font-bold">Quiet Zone</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* GITHUB SYNC & SECOND BRAIN */}
            <section className="py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <SectionHeading title="Sync with Reality." sub="Two-way binding with GitHub. Your issues and PRs live in harmony with your project management." />

                    <div className="w-full h-32 relative mb-24 flex items-center justify-center">
                        {/* Connection Line */}
                        <div className="absolute inset-x-0 top-1/2 h-px bg-linear-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

                        <div className="flex justify-between w-full max-w-2xl relative z-10">
                            <div className="w-20 h-20 bg-[#0d1117] border border-gray-700 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                <Github size={40} className="text-white" />
                            </div>

                            {/* Flow Particles */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2">
                                {[1, 2, 3].map(i => (
                                    <motion.div
                                        key={i}
                                        className="w-2 h-2 bg-indigo-400 rounded-full"
                                        animate={{ x: [-50, 50], opacity: [0, 1, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                    />
                                ))}
                            </div>

                            <div className="w-20 h-20 bg-indigo-950 border border-indigo-500/50 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                                <Layers size={40} className="text-indigo-400" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SpotLightCard className="p-8">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Command className="text-purple-400" /> MetaBrain
                            </h3>
                            <p className="text-gray-400 mb-6">
                                Connect tasks, docs, and chats. Mention any object anywhere. OrbitFlow creates a knowledge graph of your company.
                            </p>
                            <div className="text-sm text-gray-300 font-mono bg-black/40 p-4 rounded-lg border border-white/5">
                                <span className="text-gray-500">@</span><span className="text-blue-400">feature-login</span> blocked by <span className="text-purple-400">#design-specs</span>
                            </div>
                        </SpotLightCard>

                        <SpotLightCard className="p-8">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <FileText className="text-yellow-400" /> Live Docs
                            </h3>
                            <p className="text-gray-400 mb-6">
                                Multi-player editing with code blocks, mermaid diagrams, and embedded live app views.
                            </p>
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border border-gray-900 bg-gray-700 flex items-center justify-center text-[10px] text-white">
                                        U{i}
                                    </div>
                                ))}
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-400">+5</div>
                            </div>
                        </SpotLightCard>
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-900/10" />
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tighter mb-8">
                        Stop switching apps. <br /> Start flowing.
                    </h2>
                    <p className="text-xl text-gray-400 mb-10">
                        Join 4,000+ teams moving faster with OrbitFlow.
                    </p>
                    <button className="px-10 py-5 bg-white text-black text-xl font-bold rounded-full hover:bg-gray-200 transition-transform hover:scale-105 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                        Get Started for Free
                    </button>
                    <div className="mt-8 text-sm text-gray-500">
                        No credit card required • Unlimited seats on Free plan
                    </div>
                </div>
            </section>

            <footer className="border-t border-white/5 bg-gray-950 py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 opacity-50">
                        <Layers className="w-5 h-5" />
                        <span className="font-bold">OrbitFlow</span>
                    </div>
                    <div className="text-gray-600 text-sm">
                        © 2024 OrbitFlow Inc. Inspired by Huly.
                    </div>
                    <div className="flex gap-6 text-gray-500">
                        <Github className="w-5 h-5 hover:text-white cursor-pointer" />
                        <div className="w-5 h-5 bg-current rounded-full hover:text-white cursor-pointer" />
                        <div className="w-5 h-5 bg-current rounded-full hover:text-white cursor-pointer" />
                    </div>
                </div>
            </footer>
        </div>
    );
}