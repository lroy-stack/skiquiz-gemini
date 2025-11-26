import React from 'react';
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
  const progress = (timeLeft / totalTime) * 100;
  
  // Dynamic color for timer
  let progressColor = 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]';
  if (progress < 60) progressColor = 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]';
  if (progress < 30) progressColor = 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]';

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col relative animate-fade-in-up">
      
      {/* Top Section: Timer & Counter */}
      <div className="w-full mb-4 relative z-20">
        <div className="flex justify-between items-end mb-2 px-1">
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300/80">
             Question {questionIndex + 1}/{totalQuestions}
           </span>
           <span className={`font-mono font-bold text-xl leading-none ${progress < 30 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
             {timeLeft.toFixed(1)}<span className="text-xs ml-0.5 opacity-50">s</span>
           </span>
        </div>
        
        {/* Timer Bar */}
        <div className="h-5 w-full bg-slate-900/40 rounded-full overflow-hidden backdrop-blur-sm border border-white/10 p-1">
           <div 
             className={`h-full ${progressColor} transition-all duration-100 ease-linear rounded-full`}
             style={{ width: `${progress}%` }}
           />
        </div>
      </div>

      {/* Main Question Area - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center mb-6 relative z-10 min-h-[180px]">
        {/* Decorative backdrop for question */}
        <div className="absolute inset-0 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none"></div>
        
        <h2 className="text-3xl sm:text-4xl font-black text-white text-center leading-[1.1] drop-shadow-2xl tracking-tight px-2">
          {question.text}
        </h2>
      </div>

      {/* Options Stack */}
      <div className="space-y-3 mt-auto relative z-20 pb-4">
        {question.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => onAnswer(option)}
            className="group w-full relative overflow-hidden bg-slate-800/40 hover:bg-slate-700/60 active:bg-blue-600 backdrop-blur-md text-white font-bold py-4 px-5 rounded-2xl transition-all border border-white/10 shadow-lg active:scale-[0.98] active:translate-y-0.5 text-left"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
             <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-white/20 group-active:bg-white/30 flex items-center justify-center text-sm font-black text-blue-300 group-active:text-white border border-white/5 transition-colors shadow-inner">
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="text-lg leading-tight tracking-tight group-active:text-white/90">{option}</span>
             </div>
             
             {/* Hover Gradient Effect */}
             <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-500" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuizCard;