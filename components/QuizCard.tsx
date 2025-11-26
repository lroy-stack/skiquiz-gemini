import React, { useEffect } from 'react';
import { Question } from '../types';

interface QuizCardProps {
  question: Question;
  timeLeft: number;
  totalTime: number;
  onAnswer: (option: string) => void;
  questionIndex: number;
  totalQuestions: number;
}

const QuizCard: React.FC<QuizCardProps> = ({ 
  question, 
  timeLeft, 
  totalTime, 
  onAnswer,
  questionIndex,
  totalQuestions
}) => {
  // Calculate progress percentage for timer bar
  const progress = (timeLeft / totalTime) * 100;
  
  // Timer color changes based on urgency
  let timerColor = 'bg-blue-500';
  if (progress < 60) timerColor = 'bg-yellow-500';
  if (progress < 30) timerColor = 'bg-red-500';

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      {/* Header Info */}
      <div className="flex justify-between items-end mb-6 text-blue-200">
        <span className="text-xl font-bold">
          {questionIndex + 1}<span className="text-blue-500/50">/{totalQuestions}</span>
        </span>
        <span className="font-mono text-2xl font-bold text-white">
          {timeLeft.toFixed(1)}<span className="text-sm text-gray-400">s</span>
        </span>
      </div>

      {/* Question Card */}
      <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700 mb-6 min-h-[160px] flex items-center justify-center">
        <h2 className="text-2xl font-bold text-center leading-tight">
          {question.text}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => onAnswer(option)}
            className="w-full bg-slate-700 hover:bg-slate-600 active:bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-md border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 text-left flex items-center"
          >
            <span className="bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-4 text-blue-400 font-bold">
              {String.fromCharCode(65 + idx)}
            </span>
            {option}
          </button>
        ))}
      </div>

      {/* Timer Bar */}
      <div className="mt-8 h-3 w-full bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${timerColor} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default QuizCard;
