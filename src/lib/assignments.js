import { base44 } from "@/api/base44Client";

export function modeLabel(m) {
  return { flashcards: "Flashcards", quiz: "Quiz", type: "Type", test: "Test" }[m] || m;
}

export function goalLabel(a) {
  const v = a?.goal_value || 0;
  if (a?.goal_type === "num_questions") return `Complete ${v} question${v === 1 ? "" : "s"}`;
  if (a?.goal_type === "num_correct") return `Get ${v} correct`;
  if (a?.goal_type === "study_minutes") return `Study for ${v} minute${v === 1 ? "" : "s"}`;
  return "";
}

export function goalShort(a) {
  const v = a?.goal_value || 0;
  if (a?.goal_type === "num_questions") return `${v} questions`;
  if (a?.goal_type === "num_correct") return `${v} correct`;
  if (a?.goal_type === "study_minutes") return `${v} min`;
  return "";
}

export function progressText(a, c) {
  const v = a?.goal_value || 0;
  if (a?.goal_type === "num_questions") return `${c?.questions_done || 0} / ${v} questions`;
  if (a?.goal_type === "num_correct") return `${c?.questions_correct || 0} / ${v} correct`;
  if (a?.goal_type === "study_minutes")
    return `${Math.round((c?.minutes_studied || 0) * 10) / 10} / ${v} min`;
  return "";
}

export function isCompleted(c) {
  return c?.status === "completed";
}

export function goalMet(a, c) {
  const v = a?.goal_value || 0;
  if (a?.goal_type === "num_questions") return (c?.questions_done || 0) >= v;
  if (a?.goal_type === "num_correct") return (c?.questions_correct || 0) >= v;
  if (a?.goal_type === "study_minutes") return (c?.minutes_studied || 0) >= v;
  return false;
}

export async function recordAssignmentProgress(assignment, user, stats, minutes) {
  if (!assignment || !user) return null;
  const sessionQuestions = stats?.cards_studied ?? 0;
  const sessionCorrect = stats?.score ?? 0;
  const sessionMinutes = Math.max(0, minutes || 0);

  const existing = await base44.entities.AssignmentCompletion.filter({
    assignment_id: assignment.id,
    student_email: user.email,
  }).catch(() => []);
  const comp = existing[0];

  const questions_done = (comp?.questions_done || 0) + sessionQuestions;
  const questions_correct = (comp?.questions_correct || 0) + sessionCorrect;
  const minutes_studied = Math.round(((comp?.minutes_studied || 0) + sessionMinutes) * 10) / 10;
  const met = goalMet(assignment, { questions_done, questions_correct, minutes_studied });
  const now = new Date().toISOString();

  const payload = {
    assignment_id: assignment.id,
    student_email: user.email,
    user_id: user.id,
    teacher_id: assignment.created_by_id,
    classroom_id: assignment.classroom_id,
    questions_done,
    questions_correct,
    minutes_studied,
    last_attempt_date: now,
    status: met ? "completed" : "in_progress",
  };
  if (met) payload.completed_date = comp?.completed_date || now;

  if (comp) {
    return await base44.entities.AssignmentCompletion.update(comp.id, payload);
  }
  return await base44.entities.AssignmentCompletion.create(payload);
}