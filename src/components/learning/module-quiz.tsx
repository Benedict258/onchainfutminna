import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiQuerySingle, apiSubmitQuiz } from "@/lib/api-client";
import { toast } from "sonner";

export function getModuleQuizId(module: any): string | null {
  const quiz = Array.isArray(module.quizzes) ? module.quizzes[0] : module.quizzes;
  return typeof quiz?.id === "string" ? quiz.id : null;
}

export function ModuleQuiz({ quizId }: { quizId: string }) {
  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () =>
      apiQuerySingle("quizzes", {
        filters: { id: quizId },
        select: "id,pass_mark,quiz_questions(id,question_text,order,quiz_options(id,option_text))",
      }),
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return <p className="mt-6 text-sm text-muted-foreground">Loading quiz...</p>;
  if (!quiz?.quiz_questions?.length) return null;

  const questions = [...quiz.quiz_questions].sort((a: any, b: any) => a.order - b.order);
  async function submit() {
    if (Object.keys(answers).length !== questions.length) {
      toast.error("Answer every question before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const next = await apiSubmitQuiz(
        quizId,
        Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId })),
      );
      setResult(next);
      setShowAnswers(false);
      setAnswers({});
      toast.success(
        next.passed
          ? `Quiz passed! +${next.attempt?.points_awarded || 0} points`
          : `Score: ${next.score}%. Attempt ${next.attemptNumber} of 3.`,
      );
    } catch (error: any) {
      if (error.exhausted) setResult(error);
      else toast.error(error.message || "Quiz submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8 rounded-lg border border-border bg-surface-low p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-headline-sm">Module quiz</h3>
        <Badge variant="outline" className="w-fit">Pass: {quiz.pass_mark}% · 3 attempts</Badge>
      </div>
      {result?.passed && (
        <p className="mt-3 text-sm text-emerald-500">Passed with {result.score}%.</p>
      )}
      {!result?.passed && !result?.exhausted && (
        <div className="mt-5 space-y-5">
          {questions.map((question: any, index: number) => (
            <fieldset key={question.id} className="space-y-2">
              <legend className="text-sm font-medium">{index + 1}. {question.question_text}</legend>
              {question.quiz_options.map((option: any) => (
                <label key={option.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id] === option.id}
                    onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                    className="mt-1 shrink-0"
                  />
                  <span>{option.option_text}</span>
                </label>
              ))}
            </fieldset>
          ))}
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit quiz"}
          </Button>
        </div>
      )}
      {result?.exhausted && (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-amber-600">You have used all three attempts. Reveal the correct answers and explanations below.</p>
          <Button variant="outline" onClick={() => setShowAnswers(true)} disabled={showAnswers}>
            {showAnswers ? "Answers shown" : "Show answers"}
          </Button>
          {showAnswers && result.questions?.map((question: any, index: number) => (
            <div key={question.id} className="border-t border-border pt-3 text-sm">
              <p className="font-medium">{index + 1}. {question.question_text}</p>
              <p className="mt-1 text-emerald-500">
                Answer: {question.quiz_options?.find((option: any) => option.is_correct)?.option_text}
              </p>
              {question.explanation && <p className="mt-1 text-muted-foreground">{question.explanation}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
