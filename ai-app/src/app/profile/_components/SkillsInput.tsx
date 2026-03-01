"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

interface Props {
  skills: string[];
  onChange: (skills: string[]) => void;
}

export function SkillsInput({ skills, onChange }: Props) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
      setInput("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Type a skill and press Enter"
          className="bg-white/5 border-white/10 text-white placeholder:text-slate-400"
        />
        <Button
          type="button"
          variant="outline"
          className="border-white/10 text-white bg-white/5 hover:bg-white/10"
          onClick={add}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <Badge
            key={skill}
            className="bg-blue-500/20 text-blue-300 border border-blue-500/30 pl-2 pr-1 gap-1"
          >
            {skill}
            <button
              type="button"
              onClick={() => onChange(skills.filter((s) => s !== skill))}
              className="ml-1 hover:text-red-400"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
