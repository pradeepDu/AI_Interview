"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Plus, X } from "lucide-react";
import type { Experience } from "./types";
import { emptyExperience } from "./types";

interface Props {
  experience: Experience[];
  onChange: (experience: Experience[]) => void;
}

export function ExperienceSection({ experience, onChange }: Props) {
  const add = () => onChange([...experience, { ...emptyExperience }]);

  const update = (i: number, field: keyof Experience, value: string | boolean) => {
    const updated = [...experience];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  const remove = (i: number) => onChange(experience.filter((_, idx) => idx !== i));

  return (
    <section className="bg-[#0d1b2e] border border-white/10 rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Briefcase className="h-4 w-4 text-orange-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Experience</h2>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-white/10 text-white bg-white/5 hover:bg-white/10 gap-1"
          onClick={add}
        >
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
      <Separator className="bg-white/5" />

      {experience.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No experience added yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {experience.map((exp, i) => (
            <div key={i} className="relative bg-white/5 rounded-lg p-4 border border-white/5 space-y-3">
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-3 right-3 text-slate-500 hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Company *</label>
                  <Input
                    value={exp.company}
                    onChange={(e) => update(i, "company", e.target.value)}
                    placeholder="Acme Corp"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Position *</label>
                  <Input
                    value={exp.position}
                    onChange={(e) => update(i, "position", e.target.value)}
                    placeholder="Software Engineer"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Duration *</label>
                  <Input
                    value={exp.duration}
                    onChange={(e) => update(i, "duration", e.target.value)}
                    placeholder="Jan 2022 – Present"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-9 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Description *</label>
                <Textarea
                  value={exp.description}
                  onChange={(e) => update(i, "description", e.target.value)}
                  placeholder="Describe your role and achievements..."
                  className="text-sm h-20"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
