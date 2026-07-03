export interface QuizQuestion {
  question_id: string;
  level: number;
  area: string;
  question_text: string;
  choices: Record<string, string>;
  user_level: number;
}

export interface QuizCheckResponse {
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
  difficulty: number;
  level: number;
}