"use client";
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers, LogOut, Briefcase, User, LayoutDashboard, Plus,
  Settings, ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useUser } from '@/hooks/useUser';
import { useRole } from '@/hooks/useRole';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/** Renders initials avatar or profile picture */
function Avatar({ name, src }: { name: string; src?: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-9 h-9 rounded-full object-cover border border-white/20"
      />
    );
  }

  return (
    <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold border border-white/20 select-none">
      {initials || <User className="w-4 h-4" />}
    </div>
  );
}

export function NavBar() {
  const { user: firebaseUser } = useAuth();
  const { user: dbUser } = useUser();
  const { role } = useRole();
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await signOut(auth);
    router.push('/login');
  };

  const displayName = dbUser?.profile?.name || firebaseUser?.displayName || firebaseUser?.email || 'User';
  const avatarSrc = dbUser?.profile?.profilePictureUrl || undefined;

  const navLinks = firebaseUser
    ? role === 'hr'
      ? [
          { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
          { href: '/admin/jobs/create', label: 'Post Job', icon: <Plus className="h-4 w-4" /> },
          { href: '/jobs', label: 'Browse Jobs', icon: <Briefcase className="h-4 w-4" /> },
        ]
      : [
          { href: '/jobs', label: 'Browse Jobs', icon: <Briefcase className="h-4 w-4" /> },
        ]
    : [
        { href: '/jobs', label: 'Browse Jobs', icon: null },
        { href: '/#features', label: 'Features', icon: null },
      ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-gray-950/70 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Layers className="text-white w-5 h-5" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">CareerFlow</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-1.5 font-medium transition-colors',
                pathname === link.href ? 'text-white' : 'text-gray-400 hover:text-white'
              )}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {firebaseUser ? (
            <div ref={menuRef} className="relative">
              {/* Avatar button */}
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-white/10 transition-colors"
              >
                <Avatar name={displayName} src={avatarSrc} />
                <span className="hidden sm:block text-sm font-medium text-white max-w-35 truncate">
                  {displayName}
                </span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-gray-400 transition-transform',
                    menuOpen && 'rotate-180'
                  )}
                />
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl border border-white/10 bg-gray-900 shadow-xl py-1 z-50">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{firebaseUser.email}</p>
                    {role && (
                      <span className="mt-1.5 inline-block text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 capitalize">
                        {role === 'hr' ? 'HR / Recruiter' : 'Job Seeker'}
                      </span>
                    )}
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      onClick={() => { setMenuOpen(false); router.push('/profile'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      My Profile
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); router.push('/profile?tab=settings'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      Settings
                    </button>
                  </div>

                  <div className="border-t border-white/10 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-gray-300 hover:text-white text-sm font-medium hidden sm:block transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}