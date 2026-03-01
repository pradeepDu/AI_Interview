"use client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProfileData } from "./types";

export function ProfileCompletion({ profile }: { profile: ProfileData }) {
  const checks = [
    { label: "Name", done: !!profile.name },
    { label: "Phone", done: !!profile.phone },
    { label: "Resume", done: !!profile.resumeUrl },
    { label: "Skills", done: profile.skills.length > 0 },
    { label: "Experience", done: profile.experience.length > 0 },
    { label: "Projects", done: profile.projects.length > 0 },
  ];
  const completed = checks.filter((c) => c.done).length;
  const pct = Math.round((completed / checks.length) * 100);

  return (
    <Card className="p-5 bg-[#0d1b2e] border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-white">Profile Completion</span>
        <span className="text-sm font-bold text-blue-400">{pct}%</span>
      </div>
      <Progress value={pct} className="h-2 bg-white/10" />
      <div className="flex flex-wrap gap-2 mt-3">
        {checks.map((c) => (
          <span
            key={c.label}
            className={`text-xs px-2 py-0.5 rounded-full ${
              c.done
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/5 text-slate-400 border border-white/10"
            }`}
          >
            {c.done ? "✓" : "○"} {c.label}
          </span>
        ))}
      </div>
    </Card>
  );
}
