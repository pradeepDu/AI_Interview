export interface Experience {
  company: string;
  position: string;
  duration: string;
  description: string;
  current?: boolean;
}

export interface Project {
  title: string;
  description: string;
  techStack: string[];
  link?: string;
}

export interface ProfileData {
  name: string;
  phone: string;
  // Job-seeker fields
  skills: string[];
  experience: Experience[];
  projects: Project[];
  extracurriculars: string;
  resumeUrl?: string;
  profilePictureUrl?: string;
  // HR fields
  company?: string;
  designation?: string;
  department?: string;
}

export const emptyExperience: Experience = {
  company: "",
  position: "",
  duration: "",
  description: "",
  current: false,
};

export const emptyProject: Project = {
  title: "",
  description: "",
  techStack: [],
  link: "",
};
