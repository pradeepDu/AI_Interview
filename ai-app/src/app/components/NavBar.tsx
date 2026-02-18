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
export function NavBar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-gray-950/50 backdrop-blur-lg">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                        <Layers className="text-white w-5 h-5" />
                    </div>
                    <span className="text-white font-bold text-xl tracking-tight">OrbitFlow</span>
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm text-gray-400 font-medium">
                    <a href="#" className="hover:text-white transition-colors">Product</a>
                    <a href="#" className="hover:text-white transition-colors">Solutions</a>
                    <a href="#" className="hover:text-white transition-colors">Pricing</a>
                    <a href="#" className="hover:text-white transition-colors">Docs</a>
                </div>
                <div className="flex items-center gap-4">
                    <button className="text-gray-300 hover:text-white text-sm font-medium hidden sm:block">Sign In</button>
                    <button className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors">Get Started</button>
                </div>
            </div>
        </nav>
    );
}