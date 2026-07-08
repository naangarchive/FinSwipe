import { useState, useEffect, useRef } from "react";
import { track } from "../../lib/analytics/ga";
import type { QuizQuestion, QuizCheckResponse } from "../../types/quiz";

interface QuizCardProps {
  quiz: QuizQuestion;
  onComplete: () => void;
  position?: number;   // 피드 내 퀴즈 삽입 위치 (CardDeck에서 전달)
}

export function QuizCard({ quiz, onComplete, position }: QuizCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<QuizCheckResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const shownAt = useRef<number>(Date.now());

  // 퀴즈 노출 (문제 바뀔 때마다 타이머 리셋 + impression)
  useEffect(() => {
    shownAt.current = Date.now();
    track("quiz_card_impression", {
      topic: quiz.area,
      difficulty: String(quiz.level),
      position: position ?? -1,
    });
  }, [quiz.question_id]);

  const handleSelect = async (key: string) => {
    if (selected || isSubmitting) return;
    setSelected(key);
    setIsSubmitting(true);

    try {
      const accessToken = localStorage.getItem('accessToken');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/quiz/single/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ question_id: quiz.question_id, answer: key }),
      });
      if (!res.ok) throw new Error();
      const data: QuizCheckResponse = await res.json();
      setResult(data);

      // 풀었을 때 → answer (is_skipped: false)
      track("quiz_card_answer", {
        topic: quiz.area,
        difficulty: String(quiz.level),
        correct: data.is_correct,
        answer_ms: Date.now() - shownAt.current,
        is_skipped: false,
      });
    } catch {
      console.error('퀴즈 답안 제출 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 스킵 → answer(is_skipped: true) + quiz_card_skip 둘 다
  const handleSkip = () => {
    if (selected || isSubmitting) return;
    const dwell_ms = Date.now() - shownAt.current;

    track("quiz_card_answer", {
      topic: quiz.area,
      difficulty: String(quiz.level),
      correct: false,
      answer_ms: dwell_ms,
      is_skipped: true,
    });
    track("quiz_card_skip", {
      topic: quiz.area,
      position: position ?? -1,
      dwell_ms,
    });

    onComplete();   // 다음 카드로 (카운트는 노출 시 이미 증가됨)
  };

  const getChoiceStyle = (key: string) => {
    if (!result) {
      return selected === key
        ? 'border-blue-400 bg-blue-50 text-blue-700'
        : 'border-gray-200 bg-white text-gray-700';
    }
    if (key === result.correct_answer) return 'border-emerald-400 bg-emerald-50 text-emerald-700';
    if (key === selected && !result.is_correct) return 'border-rose-400 bg-rose-50 text-rose-700';
    return 'border-gray-100 bg-gray-50 text-gray-400';
  };

  return (
    <div className="absolute left-0 w-full inset-x-4 top-0 bottom-4 rounded-[28px] overflow-hidden flex flex-col bg-white border border-gray-100 shadow-sm">
      {/* 상단 포인트 바 */}
      <div className="h-1 shrink-0 bg-blue-500" />

      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-gray-900">투자 퀴즈</p>
        </div>
      </div>

      {/* 문제 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        <p className="text-base font-semibold text-gray-900 leading-relaxed">
          {quiz.question_text}
        </p>

        {/* 선택지 */}
        <div className="flex flex-col gap-2">
          {Object.entries(quiz.choices).map(([key, value]) => (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              disabled={!!selected}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${getChoiceStyle(key)}`}
            >
              <span className="w-6 h-6 rounded-full border shrink-0 flex items-center justify-center text-xs font-black"
                style={{
                  borderColor: !result ? 'currentColor' : key === result.correct_answer ? '#059669' : key === selected && !result.is_correct ? '#e11d48' : '#d1d5db',
                }}>
                {key}
              </span>
              <span className="text-sm leading-relaxed">{value}</span>
            </button>
          ))}
        </div>

        {/* 건너뛰기 (결과 나오기 전에만) */}
        {!result && (
          <button
            onClick={handleSkip}
            disabled={!!selected}
            className="self-center text-xs text-gray-400 underline underline-offset-2 disabled:opacity-40"
          >
            이 퀴즈 건너뛰기
          </button>
        )}

        {/* 결과 */}
        {result && (
          <div className={`rounded-2xl p-4 ${result.is_correct ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
            <div className="flex items-center gap-2 mb-2">              
              <p className={`text-sm font-bold ${result.is_correct ? 'text-emerald-700' : 'text-rose-700'}`}>
                {result.is_correct ? '정답이에요!' : `오답이에요. 정답은 ${result.correct_answer}예요.`}
              </p>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{result.explanation}</p>
          </div>
        )}

        {/* 다음 카드로 버튼 */}
        {result && (
          <button
            onClick={onComplete}
            className="w-full py-3 rounded-[14px] bg-blue-600 text-white text-sm font-semibold"
          >
            다음 카드로 →
          </button>
        )}
      </div>
    </div>
  );
}