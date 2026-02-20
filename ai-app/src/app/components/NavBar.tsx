"use client";
import React from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import {
    Github,
    MessageSquare,
    Video,
    CheckCircle2,
    GitPullRequest,
    Search,
    Layers,
    LogOut
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useAuth } from '@/lib/authContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function NavBar() {
    const { user } = useAuth();

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-gray-950/50 backdrop-blur-lg">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                        <Layers className="text-white w-5 h-5" />
                    </div>
                    <span className="text-white font-bold text-xl tracking-tight">CareerFlow</span>
                </Link>
                <div className="hidden md:flex items-center gap-8 text-sm text-gray-400 font-medium">
                    <a href="#" className="hover:text-white transition-colors">Overview</a>
                    <a href="#" className="hover:text-white transition-colors">For job seekers</a>
                    <a href="#" className="hover:text-white transition-colors">For companies</a>
                </div>
                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <span className="text-gray-300 text-sm font-medium hidden sm:block">
                                {user.email || user.displayName}
                            </span>
                            <button 
                                onClick={handleLogout}
                                className="text-gray-300 hover:text-white text-sm font-medium hidden sm:flex items-center gap-2"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <Link href="/login" className="text-gray-300 hover:text-white text-sm font-medium hidden sm:block">
                            Sign In
                        </Link>
                    )}
                    <Link href="/login" className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors">
                        Get Started
                    </Link>
                </div>
            </div>
        </nav>
    );
}