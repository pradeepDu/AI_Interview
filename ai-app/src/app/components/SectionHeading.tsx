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

export function SectionHeading({ title, sub, badge }: { title: string, sub: string, badge?: string }) {
    return (
        <div className="flex flex-col items-center text-center mb-16">
            {badge && (
                <span className="inline-block py-1 px-3 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider border border-indigo-500/20 mb-6">
                    {badge}
                </span>
            )}
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6 max-w-3xl">
                {title}
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
                {sub}
            </p>
        </div>
    );
}