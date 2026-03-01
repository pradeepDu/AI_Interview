"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useRole } from "@/hooks/useRole";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Plus,
  X,
  Briefcase,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface JobFormData {
  title: string;
  description: string;
  requiredSkills: string[];
  department: string;
  experienceLevel: "entry" | "mid" | "senior";
  salaryMin: string;
  salaryMax: string;
  deadline: string;
}

export default function CreateJobPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const [submitting, setSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [form, setForm] = useState<JobFormData>({
    title: "",
    description: "",
    requiredSkills: [],
    department: "",
    experienceLevel: "entry",
    salaryMin: "",
    salaryMax: "",
    deadline: "",
  });

  const update = (field: keyof JobFormData, value: string | string[]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !form.requiredSkills.includes(trimmed)) {
      update("requiredSkills", [...form.requiredSkills, trimmed]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) =>
    update("requiredSkills", form.requiredSkills.filter((s) => s !== skill));

  const validate = (): string | null => {
    if (!form.title.trim()) return "Title is required";
    if (form.description.length < 50) return "Description must be at least 50 characters";
    if (form.requiredSkills.length === 0) return "Add at least one required skill";
    if (!form.department.trim()) return "Department is required";
    if (!form.salaryMin || !form.salaryMax) return "Salary range is required";
    if (Number(form.salaryMin) > Number(form.salaryMax)) return "Min salary must be less than max";
    if (!form.deadline) return "Deadline is required";
    // Compare date strings directly to avoid UTC vs local timezone issues
    const todayStr = new Date().toLocaleDateString("en-CA"); // "YYYY-MM-DD" in local time
    if (form.deadline < todayStr) return "Deadline must be today or in the future";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    try {
      setSubmitting(true);
      const token = await user!.getIdToken();
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          requiredSkills: form.requiredSkills,
          department: form.department,
          experienceLevel: form.experienceLevel,
          salaryRange: {
            min: Number(form.salaryMin),
            max: Number(form.salaryMax),
          },
          deadline: new Date(form.deadline).toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create job");
      }
      toast.success("Job posted successfully!");
      router.push("/admin/dashboard");
    } catch (e: any) {
      toast.error(e.message || "Failed to create job");
    } finally {
      setSubmitting(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-[#060d18] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (role !== "hr") {
    return (
      <div className="min-h-screen bg-[#060d18] pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 font-medium">Access denied — HR only</p>
          <Button
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => router.push("/")}
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060d18] pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push("/admin/jobs")}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Jobs
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Post a New Job</h1>
            <p className="text-slate-400 text-sm">Fill in the details below</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Basic Info */}
          <section className="bg-[#0d1b2e] border border-white/10 rounded-xl p-6 space-y-5">
            <h2 className="text-base font-semibold text-white">Basic Information</h2>
            <Separator className="bg-white/5" />
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-slate-400">Job Title *</label>
                <Input
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="e.g. Senior React Developer"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-400">Department *</label>
                  <Input
                    value={form.department}
                    onChange={(e) => update("department", e.target.value)}
                    placeholder="e.g. Engineering"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-slate-400">Experience Level *</label>
                  <div className="flex gap-2">
                    {(["entry", "mid", "senior"] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => update("experienceLevel", l)}
                        className={`flex-1 text-xs py-2 rounded-lg border transition-colors capitalize ${
                          form.experienceLevel === l
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-white/10 text-slate-400 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-slate-400">Job Description * (min 50 chars)</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Describe the role, responsibilities, and what you're looking for..."
                  className="h-36"
                />
                <p className="text-xs text-slate-500 text-right">{form.description.length} chars</p>
              </div>
            </div>
          </section>

          {/* Skills */}
          <section className="bg-[#0d1b2e] border border-white/10 rounded-xl p-6 space-y-5">
            <h2 className="text-base font-semibold text-white">Required Skills</h2>
            <Separator className="bg-white/5" />
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Type a skill and press Enter or +"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />
              <Button
                type="button"
                variant="outline"
                className="border-white/10 text-white bg-white/5 hover:bg-white/10"
                onClick={addSkill}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.requiredSkills.map((skill) => (
                <Badge
                  key={skill}
                  className="bg-blue-500/20 text-blue-300 border border-blue-500/30 pl-2 pr-1 gap-1"
                >
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)}>
                    <X className="h-3 w-3 hover:text-red-400" />
                  </button>
                </Badge>
              ))}
            </div>
          </section>

          {/* Salary & Deadline */}
          <section className="bg-[#0d1b2e] border border-white/10 rounded-xl p-6 space-y-5">
            <h2 className="text-base font-semibold text-white">Compensation & Timeline</h2>
            <Separator className="bg-white/5" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm text-slate-400">Min Salary (USD) *</label>
                <Input
                  type="number"
                  value={form.salaryMin}
                  onChange={(e) => update("salaryMin", e.target.value)}
                  placeholder="60000"
                  min="0"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-slate-400">Max Salary (USD) *</label>
                <Input
                  type="number"
                  value={form.salaryMax}
                  onChange={(e) => update("salaryMax", e.target.value)}
                  placeholder="120000"
                  min="0"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-slate-400">Application Deadline *</label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => update("deadline", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </section>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Post Job
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
