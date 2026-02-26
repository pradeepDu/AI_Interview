"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Layers, UserCircle, Briefcase, ArrowRight, Loader2, Phone, User } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type Role = 'job_seeker' | 'hr';
type Step = 'role' | 'details';

interface FirebaseUserData {
  uid: string;
  email: string;
  displayName: string | null;
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('role');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUserData | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignup = async () => {
    if (!selectedRole) {
      toast.error('Please select a role first');
      return;
    }
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      // Check if this Google account already has a MongoDB profile
      const token = await fbUser.getIdToken();
      const checkRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (checkRes.ok) {
        // Existing user — skip onboarding, redirect based on role
        const existing = await checkRes.json();
        toast.success('Welcome back!');
        router.push(existing.role === 'hr' ? '/admin/dashboard' : '/jobs');
        return;
      }

      // New user — show onboarding form
      setFirebaseUser({
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName,
      });
      setName(fbUser.displayName || '');
      setStep('details');
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (!firebaseUser) return;
    try {
      setLoading(true);
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email,
          role: selectedRole,
          name: name.trim(),
          phone: phone.trim(),
          company: company.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create profile');
      toast.success('Account created! Welcome to CareerFlow.');
      router.push(data.redirectTo);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
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

      {/* Right Side */}
      <div className="flex-1 flex items-center justify-center bg-gray-950 px-8 py-12">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {step === 'role' ? (
              <motion.div
                key="role"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h2 className="text-4xl font-bold text-white mb-2">Get Started</h2>
                  <p className="text-gray-400">
                    Already have an account?{' '}
                    <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
                      Sign in
                    </Link>
                  </p>
                </div>

                {/* Role Cards */}
                <p className="text-sm text-gray-400 mb-3">I am joining as a</p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {(['job_seeker', 'hr'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        selectedRole === role
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      {role === 'job_seeker' ? (
                        <UserCircle className={`mb-3 ${ selectedRole === role ? 'text-indigo-400' : 'text-gray-400' }`} size={32} />
                      ) : (
                        <Briefcase className={`mb-3 ${ selectedRole === role ? 'text-indigo-400' : 'text-gray-400' }`} size={32} />
                      )}
                      <div className="text-white font-semibold mb-1">
                        {role === 'job_seeker' ? 'Job Seeker' : 'HR / Recruiter'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {role === 'job_seeker' ? 'Looking for opportunities' : 'Post jobs & hire talent'}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Google Button */}
                <button
                  onClick={handleGoogleSignup}
                  disabled={loading || !selectedRole}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  {loading ? 'Signing in...' : 'Continue with Google'}
                </button>

                {!selectedRole && (
                  <p className="text-center text-xs text-gray-500 mt-3">Select a role above to continue</p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      {selectedRole === 'hr' ? (
                        <Briefcase className="h-5 w-5 text-indigo-400" />
                      ) : (
                        <UserCircle className="h-5 w-5 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Joining as</p>
                      <p className="text-white font-semibold">{selectedRole === 'hr' ? 'HR / Recruiter' : 'Job Seeker'}</p>
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-1">One last step</h2>
                  <p className="text-gray-400 text-sm">Signed in as <span className="text-white">{firebaseUser?.email}</span></p>
                </div>

                <form onSubmit={handleDetailsSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm text-gray-400 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" /> Full Name *
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm text-gray-400 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> Phone Number <span className="text-gray-600">(optional)</span>
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 234 567 8900"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>

                  {selectedRole === 'hr' && (
                    <div className="space-y-1.5">
                      <label className="text-sm text-gray-400 flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" /> Company Name
                      </label>
                      <Input
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Acme Corp"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-base font-semibold mt-2"
                  >
                    {loading ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Setting up profile...</>
                    ) : (
                      <>Finish Setup <ArrowRight className="ml-2 h-5 w-5" /></>
                    )}
                  </Button>
                </form>

                <button
                  onClick={() => setStep('role')}
                  className="mt-4 w-full text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  ← Change role or account
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
