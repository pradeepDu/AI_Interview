import Groq from 'groq-sdk';
import type { InterviewQuestion, QuestionEvaluation } from '@/types';

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

/** ------------ Question Generation ------------ */

interface GenerateQuestionsInput {
  jobTitle: string;
  jobDescription: string;
  requiredSkills: string[];
  experienceLevel: string;
  candidateName: string;
  candidateSkills: string[];
  candidateExperience: Array<{
    company: string;
    position: string;
    duration: string;
    description: string;
  }>;
}

interface RawQuestion {
  id: string;
  text: string;
  type: 'technical' | 'behavioral' | 'scenario';
  prepTime: number;
  answerTime: number;
}

export async function generateInterviewQuestions(
  input: GenerateQuestionsInput
): Promise<InterviewQuestion[]> {
  const systemPrompt = `You are an expert technical recruiter and interview coach. 
Generate structured interview questions for a candidate applying to a role.
Respond ONLY with a valid JSON array — no markdown, no explanation, just raw JSON.`;

  const userPrompt = `
Role: ${input.jobTitle} (${input.experienceLevel} level)
Job Description: ${input.jobDescription}
Required Skills: ${input.requiredSkills.join(', ')}

Candidate: ${input.candidateName}
Candidate Skills: ${input.candidateSkills.join(', ')}
Candidate Experience: ${input.candidateExperience
    .map((e) => `${e.position} at ${e.company} (${e.duration}): ${e.description}`)
    .join('\n')}

Generate exactly 5 interview questions as a JSON array with this shape:
[
  {
    "id": "q1",
    "text": "...",
    "type": "technical" | "behavioral" | "scenario",
    "prepTime": <seconds to prepare, 5–10>,
    "answerTime": <seconds to answer, 30–60>
  }
]
Mix: 2 technical, 2 behavioral, 1 scenario. Tailor to the candidate's background.
Only return the JSON array.`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  const raw = completion.choices[0]?.message?.content ?? '[]';
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
  const parsed: RawQuestion[] = JSON.parse(cleaned);

  return parsed.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    prepTime: Math.min(q.prepTime ?? 10, 10),   // cap at 10s
    answerTime: Math.min(q.answerTime ?? 60, 60), // cap at 60s
  }));
}

/** ------------ Answer Evaluation ------------ */

interface EvaluateAnswerInput {
  questionText: string;
  questionType: string;
  transcript: string;
  jobTitle: string;
  requiredSkills: string[];
}

export async function evaluateAnswer(
  input: EvaluateAnswerInput
): Promise<QuestionEvaluation> {
  const systemPrompt = `You are a precise technical recruiter evaluating a candidate's interview answer.
Respond ONLY with a valid JSON object — no markdown, no explanation.`;

  const userPrompt = `
Job: ${input.jobTitle}
Required Skills: ${input.requiredSkills.join(', ')}
Question (${input.questionType}): ${input.questionText}
Candidate Answer: ${input.transcript || '(No answer provided)'}

Evaluate the answer and return ONLY this JSON:
{
  "score": <0–10 integer>,
  "feedback": "<2–3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 600,
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
  return JSON.parse(cleaned) as QuestionEvaluation;
}

/** ------------ Overall AI Summary ------------ */

interface GenerateSummaryInput {
  jobTitle: string;
  candidateName: string;
  questions: Array<{
    text: string;
    type: string;
    evaluation?: QuestionEvaluation;
  }>;
}

interface AISummary {
  overallScore: number;
  strengths: string[];
  concerns: string[];
}

export async function generateInterviewSummary(
  input: GenerateSummaryInput
): Promise<AISummary> {
  const evaluated = input.questions.filter((q) => q.evaluation);
  const avgScore =
    evaluated.length === 0
      ? 0
      : Math.round(
          evaluated.reduce((sum, q) => sum + (q.evaluation?.score ?? 0), 0) /
            evaluated.length
        );

  const qSummaries = evaluated
    .map(
      (q) =>
        `Q (${q.type}): "${q.text}" → score ${q.evaluation?.score}/10. ${q.evaluation?.feedback}`
    )
    .join('\n');

  const systemPrompt = `You are a senior recruiter summarising a completed AI interview.
Respond ONLY with a valid JSON object — no markdown, no explanation.`;

  const userPrompt = `
Candidate: ${input.candidateName}
Job: ${input.jobTitle}
Per-question results:
${qSummaries}
Average Score: ${avgScore}/10

Produce a concise hiring summary as ONLY this JSON:
{
  "overallScore": ${avgScore},
  "strengths": ["<top strength 1>", "<top strength 2>", "<top strength 3>"],
  "concerns": ["<concern 1>", "<concern 2>"]
}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
  const parsed = JSON.parse(cleaned) as AISummary;
  return { ...parsed, overallScore: avgScore };
}
