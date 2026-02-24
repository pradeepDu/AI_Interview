"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Layers, UserCircle, Briefcase, ArrowRight, Loader2 } from 'lucide-react';
import { signupSchema, type SignupInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SignupPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'job_seeker' | 'hr' | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupInput) => {
    try {
      setLoading(true);

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Signup failed');
      }

      toast.success('Account created successfully!');
      router.push(result.redirectTo);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (role: 'job_seeker' | 'hr') => {
    setSelectedRole(role);
    setValue('role', role);
  };

  return (
    <div className="min-h-screen flex bg-[#030712]">
      {/* Left Side - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-[#0a1929] via-[#132f4c] to-[#0a1929] relative overflow-hidden">
        <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-white/5"
              style={{
                width: `${300 + i * 200}px`,
                height: `${300 + i * 200}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 20 + i * 5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link href="/" className="flex items-center gap-3 mb-12">
              <Layers size={48} className="text-white" />
              <span className="text-3xl font-bold">CareerFlow</span>
            </Link>
            <h1 className="text-5xl font-bold mb-4 leading-tight">
              Join the Future of Hiring
            </h1>
            <p className="text-xl text-gray-300">
              AI-powered interviews that save time and find the perfect fit
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="absolute bottom-12 left-16 text-sm text-gray-400"
          >
            TRUSTED BY TOP UNIVERSITIES AND COMPANIES
          </motion.div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-950 px-8 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Role Selection */}
            <div>
              <Label className="text-white mb-3 block">I am a</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => selectRole('job_seeker')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    selectedRole === 'job_seeker'
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <UserCircle
                    className={`mx-auto mb-3 ${
                      selectedRole === 'job_seeker' ? 'text-indigo-400' : 'text-gray-400'
                    }`}
                    size={32}
                  />
                  <div className="text-white font-semibold mb-1">Job Seeker</div>
                  <div className="text-xs text-gray-400">Looking for opportunities</div>
                </button>

                <button
                  type="button"
                  onClick={() => selectRole('hr')}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    selectedRole === 'hr'
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <Briefcase
                    className={`mx-auto mb-3 ${
                      selectedRole === 'hr' ? 'text-indigo-400' : 'text-gray-400'
                    }`}
                    size={32}
                  />
                  <div className="text-white font-semibold mb-1">HR / Recruiter</div>
                  <div className="text-xs text-gray-400">Post jobs & hire</div>
                </button>
              </div>
              {errors.role && (
                <p className="text-red-500 text-sm mt-2">{errors.role.message}</p>
              )}
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-white">Full Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="John Doe"
                className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john@example.com"
                className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="text-white">Phone (Optional)</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+1234567890"
                className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                At least 8 characters, 1 uppercase, 1 number
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !selectedRole}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-lg font-semibold text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            By signing up, you agree to our{' '}
            <a href="#" className="text-indigo-400 hover:underline">
              Terms
            </a>{' '}
            and{' '}
            <a href="#" className="text-indigo-400 hover:underline">
              Privacy Policy
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
