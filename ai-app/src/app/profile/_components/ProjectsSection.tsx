"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Code, Plus, X } from "lucide-react";
import type { Project } from "./types";
import { emptyProject } from "./types";

interface Props {
  projects: Project[];
  onChange: (projects: Project[]) => void;
}

export function ProjectsSection({ projects, onChange }: Props) {
  const add = () => onChange([...projects, { ...emptyProject }]);

  const update = (i: number, field: keyof Project, value: string | string[]) => {
    const updated = [...projects];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  const remove = (i: number) => onChange(projects.filter((_, idx) => idx !== i));

  return (
    <section className="bg-[#0d1b2e] border border-white/10 rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Code className="h-4 w-4 text-cyan-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Projects</h2>
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

      {projects.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Code className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No projects added yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((proj, i) => (
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
                  <label className="text-xs text-slate-400">Title *</label>
                  <Input
                    value={proj.title}
                    onChange={(e) => update(i, "title", e.target.value)}
                    placeholder="My Awesome Project"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">GitHub / Live Link</label>
                  <Input
                    value={proj.link || ""}
                    onChange={(e) => update(i, "link", e.target.value)}
                    placeholder="https://github.com/..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-9 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Description *</label>
                <Textarea
                  value={proj.description}
                  onChange={(e) => update(i, "description", e.target.value)}
                  placeholder="What this project does..."
                  className="text-sm h-20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Tech Stack (comma separated)</label>
                <Input
                  value={proj.techStack.join(", ")}
                  onChange={(e) =>
                    update(
                      i,
                      "techStack",
                      e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  placeholder="React, TypeScript, Node.js"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-9 text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
