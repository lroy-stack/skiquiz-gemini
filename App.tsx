import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Ticket, Zap, Trophy, Clock, Share2, Info, Lock, Flag, Calendar, Target, Crown, Award, Gift, Copy, Check } from 'lucide-react';
import { Screen, UserState, QuizState, Question } from './types';
import { GAME_CONFIG, PRIZE_TIERS, SHOP_ITEMS, MOCK_LEADERBOARD, BADGES } from './constants';
import { getRandomQuestions } from './services/questionService';
import Button from './components/Button';
import BottomNav from './components/BottomNav';
import QuizCard from './components/QuizCard';
import Snowfall from './components/Snowfall';

export default function App() {
  // --- STATE ---
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.HOME);
  
  // User State
  const [user, setUser] = useState<UserState>({
    tickets: 5, // Starting bonus
    highScore: 0,
    dailyFreePlayUsed: false,
    streakDays: 3,
    totalGamesPlayed: 12,
    username: 'Guest Skier',
    rank: 0, // Unranked initially
    badges: ['first_run'], // Give Rookie badge to start since they have played games
    totalScore: 4500,
    perfectGames: 2,
    totalCorrectAnswers: 45,
    referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    referralsCount: 2,
  });

  // Quiz State
  const [quiz, setQuiz] = useState<QuizState>({
    currentQuestionIndex: 0,
    score: 0,
    answers: [],
    startTime: 0,
    isActive: false,
  });
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timeLeft, setTimeLeft] = useState(GAME_CONFIG.TIME_PER_QUESTION_SEC);
  
  // UI States
  const [showRedeemInput, setShowRedeemInput] = useState(false);
  const [redeemInputValue, setRedeemInputValue] = useState('');
  const [copied, setCopied] = useState(false);

  // Refs for timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- ACTIONS ---

  const startQuiz = useCallback((isFree: boolean) => {
    if (!isFree && user.tickets < 1) {
      setCurrentScreen(Screen.SHOP);
      return;
    }

    // Deduct ticket if not free
    if (!isFree) {
      setUser(prev => ({ ...prev, tickets: prev.tickets - 1 }));
    } else {
      setUser(prev => ({ ...prev, dailyFreePlayUsed: true }));
    }

    // Setup new game
    const newQuestions = getRandomQuestions(GAME_CONFIG.QUESTIONS_PER_GAME);
    setQuestions(newQuestions);
    setQuiz({
      currentQuestionIndex: 0,
      score: 0,
      answers: [],
      startTime: Date.now(),
      isActive: true,
    });
    setTimeLeft(GAME_CONFIG.TIME_PER_QUESTION_SEC);
    setCurrentScreen(Screen.QUIZ);
  }, [user.tickets]);

  const endQuiz = useCallback((finalScore: number, finalAnswers: boolean[]) => {
    setQuiz(prev => ({ ...prev, isActive: false, score: finalScore, answers: finalAnswers }));
    
    // Update Stats and Check Badges
    setUser(prev => {
      const newTotalGames = prev.totalGamesPlayed + 1;
      const newTotalCorrect = prev.totalCorrectAnswers + finalAnswers.filter(Boolean).length;
      const newHighScore = Math.max(prev.highScore, finalScore);
      const isPerfectGame = finalAnswers.every(a => a);
      
      const newBadges = [...prev.badges];

      // Badge Logic
      if (!newBadges.includes('first_run') && newTotalGames >= 1) {
        newBadges.push('first_run');
        alert("🏆 Badge Unlocked: Rookie!");
      }
      if (!newBadges.includes('streak_week') && prev.streakDays >= 7) {
        newBadges.push('streak_week');
        alert("🏆 Badge Unlocked: Committed!");
      }
      if (!newBadges.includes('sharpshooter') && newTotalCorrect >= 100) {
        newBadges.push('sharpshooter');
        alert("🏆 Badge Unlocked: Sharpshooter!");
      }
      if (!newBadges.includes('high_flyer') && finalScore >= 600) {
        newBadges.push('high_flyer');
        alert("🏆 Badge Unlocked: High Flyer!");
      }
      if (!newBadges.includes('elite_club') && prev.rank > 0 && prev.rank <= 10) {
        newBadges.push('elite_club');
        alert("🏆 Badge Unlocked: Pro!");
      }

      return { 
        ...prev, 
        tickets: prev.tickets + GAME_CONFIG.TICKETS_EARNED_PLAY,
        totalGamesPlayed: newTotalGames,
        highScore: newHighScore,
        totalCorrectAnswers: newTotalCorrect,
        totalScore: prev.totalScore + finalScore,
        perfectGames: isPerfectGame ? prev.perfectGames + 1 : prev.perfectGames,
        badges: newBadges
      };
    });
    
    setCurrentScreen(Screen.RESULT);
  }, []);

  const handleAnswer = useCallback((selectedOption: string) => {
    if (!quiz.isActive) return;

    // Clear timer immediately to stop countdown
    if (timerRef.current) clearInterval(timerRef.current);

    const currentQ = questions[quiz.currentQuestionIndex];
    const isCorrect = selectedOption === currentQ.correctAnswer;
    
    let points = 0;
    if (isCorrect) {
      // Calculate Score: Base + Speed Bonus
      const speedBonus = Math.max(0, Math.round((timeLeft / GAME_CONFIG.TIME_PER_QUESTION_SEC) * GAME_CONFIG.MAX_SPEED_BONUS));
      points = GAME_CONFIG.BASE_SCORE + speedBonus;
    }

    const nextIndex = quiz.currentQuestionIndex + 1;
    const isFinished = nextIndex >= GAME_CONFIG.QUESTIONS_PER_GAME;
    
    // Determine accumulated state for next step
    let nextScore = quiz.score + points;
    const nextAnswers = [...quiz.answers, isCorrect];

    if (!isFinished) {
      // Continue Game
      setQuiz(prev => ({
        ...prev,
        score: nextScore,
        answers: nextAnswers,
        currentQuestionIndex: nextIndex,
        startTime: Date.now()
      }));
      setTimeLeft(GAME_CONFIG.TIME_PER_QUESTION_SEC);
    } else {
      // End Game - Calculate final bonus
      const allCorrect = nextAnswers.every(a => a);
      if (allCorrect) {
        nextScore += GAME_CONFIG.STREAK_BONUS_ALL_CORRECT;
      }
      
      // Update local state for immediate feedback (optional) but rely on endQuiz for persistent
      setQuiz(prev => ({ ...prev, score: nextScore, answers: nextAnswers }));
      
      // Delay slightly for UX then finish
      setTimeout(() => endQuiz(nextScore, nextAnswers), 100);
    }
  }, [quiz.isActive, quiz.currentQuestionIndex, quiz.answers, quiz.score, questions, timeLeft, endQuiz]);

  const handleTimeOut = useCallback(() => {
    handleAnswer("TIMEOUT");
  }, [handleAnswer]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(`Join me on SkiQuiz! Use my code ${user.referralCode} to get bonus tickets! https://skiquiz.app`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeemCode = () => {
    if (redeemInputValue.length < 3) return;
    if (redeemInputValue.toUpperCase() === user.referralCode) {
      alert("You can't use your own code!");
      return;
    }
    
    setUser(prev => ({
      ...prev,
      tickets: prev.tickets + GAME_CONFIG.TICKETS_JOIN_BONUS
    }));
    
    alert(`Code Redeemed! +${GAME_CONFIG.TICKETS_JOIN_BONUS} Ticket added.`);
    setRedeemInputValue('');
    setShowRedeemInput(false);
  };

  // --- EFFECTS ---

  // Timer Logic
  useEffect(() => {
    if (currentScreen === Screen.QUIZ && quiz.isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0.1) {
            handleTimeOut();
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentScreen, quiz.isActive, quiz.currentQuestionIndex, handleTimeOut]);


  // --- RENDER HELPERS ---

  const renderBadgeIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'Flag': return <Flag className={className} />;
      case 'Calendar': return <Calendar className={className} />;
      case 'Target': return <Target className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Crown': return <Crown className={className} />;
      default: return <Award className={className} />;
    }
  };

  const renderHome = () => (
    <div className="flex flex-col h-full pb-24 pt-8 px-6 overflow-y-auto no-scrollbar relative z-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-white drop-shadow-lg">
            SKI<span className="text-blue-400">QUIZ</span>
          </h1>
          <p className="text-blue-200 text-sm shadow-black drop-shadow-sm">Season 24/25 • Week 12</p>
        </div>
        <div className="flex items-center bg-slate-800/80 backdrop-blur-md rounded-full px-3 py-1.5 border border-slate-700 cursor-pointer shadow-lg" onClick={() => setCurrentScreen(Screen.SHOP)}>
          <Ticket size={16} className="text-blue-400 mr-2" />
          <span className="font-bold text-white">{user.tickets}</span>
          <div className="ml-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white">+</div>
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-blue-600/90 to-blue-800/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl shadow-blue-900/40 relative overflow-hidden mb-8 border border-blue-500/30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <span className="bg-blue-900/40 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border border-blue-400/30 text-blue-100">
              Live Tournament
            </span>
            <div className="text-right">
              <div className="text-xs text-blue-200 uppercase font-semibold">Ends in</div>
              <div className="font-mono font-bold text-white">04:22:15</div>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-1">Win a Helmet</h2>
          <p className="text-blue-200 text-sm mb-6">Current 1st Place: <span className="text-white font-bold">685 pts</span></p>

          <div className="space-y-3">
             {/* Main Play Button */}
            {!user.dailyFreePlayUsed ? (
              <Button fullWidth variant="success" size="lg" onClick={() => startQuiz(true)}>
                Play Free
                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-xs">1x Daily</span>
              </Button>
            ) : (
              <Button fullWidth variant="primary" size="lg" onClick={() => startQuiz(false)} disabled={user.tickets < 1}>
                Play Now
                <span className="ml-2 bg-black/20 px-2 py-0.5 rounded text-xs flex items-center">
                  1 <Ticket size={12} className="ml-1"/>
                </span>
              </Button>
            )}
            
            <div className="text-center">
              <p className="text-xs text-blue-200">
                Next free game in <span className="font-mono text-white">14:20:05</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-700 shadow-lg">
          <div className="flex items-center text-slate-400 mb-2">
            <Trophy size={16} className="mr-2" />
            <span className="text-xs font-bold uppercase">Best Score</span>
          </div>
          <p className="text-2xl font-bold text-white">{user.highScore}</p>
        </div>
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-700 shadow-lg">
          <div className="flex items-center text-slate-400 mb-2">
            <Zap size={16} className="mr-2" />
            <span className="text-xs font-bold uppercase">Streak</span>
          </div>
          <p className="text-2xl font-bold text-white">{user.streakDays} <span className="text-sm font-normal text-slate-500">days</span></p>
        </div>
      </div>

      {/* Prize Preview */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg drop-shadow-md">Weekly Prizes</h3>
          <button className="text-blue-400 text-sm font-semibold" onClick={() => setCurrentScreen(Screen.LEADERBOARD)}>View Ranking</button>
        </div>
        <div className="space-y-3">
          {PRIZE_TIERS[1].prizes && (
            <>
              <div className="bg-slate-800/80 backdrop-blur-md p-3 rounded-xl flex items-center gap-4 border border-slate-700/50">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500 font-bold border border-yellow-500/20">1</div>
                <div>
                  <div className="font-bold">{PRIZE_TIERS[1].prizes.rank1}</div>
                  <div className="text-xs text-slate-400">Atomic / Salomon</div>
                </div>
              </div>
              <div className="bg-slate-800/80 backdrop-blur-md p-3 rounded-xl flex items-center gap-4 border border-slate-700/50">
                <div className="w-10 h-10 bg-gray-400/20 rounded-full flex items-center justify-center text-gray-400 font-bold border border-gray-400/20">2</div>
                <div>
                  <div className="font-bold">{PRIZE_TIERS[1].prizes.rank2}</div>
                  <div className="text-xs text-slate-400">Oakley / Smith</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderQuiz = () => (
    <div className="flex flex-col h-full px-6 pt-12 pb-6 relative overflow-hidden z-10">
      {/* Background decoration handled by global snow, extra blur here */}
      <div className="relative z-10 h-full flex flex-col justify-center">
        {questions.length > 0 && (
          <QuizCard
            question={questions[quiz.currentQuestionIndex]}
            timeLeft={timeLeft}
            totalTime={GAME_CONFIG.TIME_PER_QUESTION_SEC}
            onAnswer={handleAnswer}
            questionIndex={quiz.currentQuestionIndex}
            totalQuestions={GAME_CONFIG.QUESTIONS_PER_GAME}
          />
        )}
      </div>
    </div>
  );

  const renderResult = () => {
    const isWin = quiz.score > 0;
    const correctCount = quiz.answers.filter(Boolean).length;
    const isPersonalBest = quiz.score >= user.highScore && quiz.score > 0;

    return (
      <div className="flex flex-col h-full pt-12 pb-6 px-6 overflow-y-auto no-scrollbar items-center text-center z-10">
        
        <div className="mb-6 animate-fade-in-up">
           <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-xl shadow-blue-500/30 mx-auto mb-4 border-4 border-slate-800 relative">
             <Trophy size={48} className="text-white relative z-10" fill="white" />
             {isPersonalBest && <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>}
           </div>
           <h2 className="text-3xl font-black italic tracking-tight text-white mb-1">FINISHED!</h2>
           {isPersonalBest && (
             <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full border border-yellow-500/30 animate-pulse">
               NEW PERSONAL BEST
             </span>
           )}
        </div>

        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 w-full max-w-sm mb-6 border border-slate-700 shadow-xl">
           <div className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Score</div>
           <div className="text-5xl font-black text-white mb-6 tracking-tighter">{quiz.score}</div>
           
           <div className="grid grid-cols-2 gap-4 mb-4">
             <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                <div className="text-xs text-slate-500 mb-1">Correct</div>
                <div className="font-bold text-xl">{correctCount}/{GAME_CONFIG.QUESTIONS_PER_GAME}</div>
             </div>
             <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                <div className="text-xs text-slate-500 mb-1">Rank</div>
                <div className="font-bold text-xl">#42</div>
             </div>
           </div>

           <div className="flex items-center justify-center gap-2 bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
              <Ticket className="text-blue-400" size={20} />
              <span className="font-bold text-blue-100">+1 Ticket Earned</span>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-4">
          <Button fullWidth variant="primary" onClick={() => startQuiz(false)}>
            Play Again
            <span className="ml-2 bg-black/20 px-2 py-0.5 rounded text-xs font-normal opacity-80">
              -3 Tickets
            </span>
          </Button>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="secondary" onClick={() => setCurrentScreen(Screen.LEADERBOARD)}>
              Ranking
            </Button>
            <Button variant="secondary" onClick={() => setCurrentScreen(Screen.HOME)}>
              Home
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderLeaderboard = () => {
    // Split leaderbord into Top 3 and Rest
    const top3 = MOCK_LEADERBOARD.slice(0, 3);
    const rest = MOCK_LEADERBOARD.slice(3);

    // Reorder Top 3 for Podium: 2nd, 1st, 3rd
    const podiumOrder = [top3[1], top3[0], top3[2]];

    return (
    <div className="flex flex-col h-full pb-24 pt-8 px-6 overflow-hidden z-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold drop-shadow-md">Ranking</h2>
        <div className="bg-slate-800/80 backdrop-blur-sm text-xs px-3 py-1 rounded-full border border-slate-700">
           Weekly Tournament
        </div>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-2 mb-8 h-40">
        {podiumOrder.map((item, index) => {
          // Podium styling logic
          const isFirst = item.rank === 1;
          const isSecond = item.rank === 2;
          const height = isFirst ? 'h-32' : isSecond ? 'h-24' : 'h-20';
          const color = isFirst ? 'bg-yellow-500' : isSecond ? 'bg-gray-400' : 'bg-amber-700';
          const shadow = isFirst ? 'shadow-yellow-900/50' : 'shadow-black/50';
          
          return (
            <div key={item.rank} className="flex flex-col items-center w-1/3">
              <div className="text-xs font-bold mb-1 truncate w-full text-center text-slate-300">{item.name}</div>
              <div className="font-bold text-sm mb-2 text-blue-200">{item.score}</div>
              <div className={`w-full ${height} ${color} rounded-t-xl relative flex items-start justify-center pt-2 shadow-lg ${shadow}`}>
                <div className="font-black text-black/50 text-2xl">{item.rank}</div>
                {isFirst && <Crown size={32} className="absolute -top-10 text-yellow-400 drop-shadow-lg fill-yellow-500" strokeWidth={1.5} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Your Rank Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-4 mb-4 flex items-center justify-between shadow-lg border border-blue-500/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 opacity-50"></div>
        <div className="flex items-center gap-4 relative z-10">
           <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg backdrop-blur-sm">
             42
           </div>
           <div>
             <div className="font-bold">You</div>
             <div className="text-xs text-blue-200">{user.highScore} pts</div>
           </div>
        </div>
        <div className="text-xs font-semibold bg-black/20 px-2 py-1 rounded relative z-10 backdrop-blur-md">
          Top 15%
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pb-4">
         {rest.map((item) => (
           <div key={item.rank} className="bg-slate-800/60 backdrop-blur-sm p-3 rounded-xl flex items-center justify-between border border-slate-700/50">
             <div className="flex items-center gap-4">
               <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-slate-700 text-slate-400">
                 {item.rank}
               </div>
               <div>
                 <div className="font-semibold text-sm">{item.name}</div>
                 <div className="text-[10px] text-slate-500 flex items-center">
                    <span className="mr-1">{item.country}</span> • 35 games
                 </div>
               </div>
             </div>
             <div className="font-mono font-bold text-blue-200">
               {item.score}
             </div>
           </div>
         ))}
      </div>
    </div>
  )};

  const renderShop = () => (
    <div className="flex flex-col h-full pb-24 pt-8 px-6 overflow-y-auto no-scrollbar z-10">
       <h2 className="text-2xl font-bold mb-2">Get Tickets</h2>
       <p className="text-slate-400 text-sm mb-8">Tickets are used to play extra games and climb the leaderboard faster.</p>

       <div className="space-y-4">
         {SHOP_ITEMS.map((item) => (
           <div key={item.id} className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-1 shadow-lg border border-slate-700 hover:border-blue-500/50 transition-colors relative">
             {item.label && (
                <div className="absolute -top-3 right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-[10px] font-bold px-2 py-1 rounded-full shadow-lg uppercase tracking-wider">
                  {item.label}
                </div>
             )}
             <div className="bg-slate-900/50 rounded-xl p-5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                    <Ticket size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-xl text-white">{item.tickets} <span className="text-sm font-normal text-slate-400">Tickets</span></div>
                    <div className="text-xs text-green-400">Instant delivery</div>
                  </div>
                </div>
                <Button size="sm" onClick={() => {
                  // Simulate purchase
                  setUser(prev => ({...prev, tickets: prev.tickets + item.tickets}));
                  alert(`Purchased ${item.tickets} tickets!`);
                }}>
                  {item.price}
                </Button>
             </div>
           </div>
         ))}
       </div>

       <div className="mt-8 bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-dashed border-slate-700">
         <h3 className="font-bold text-sm mb-1 flex items-center">
           <Zap size={14} className="text-yellow-500 mr-2" />
           Daily Bonus
         </h3>
         <p className="text-xs text-slate-400 mb-3">Login for 7 days in a row to get 5 free tickets.</p>
         <div className="flex justify-between gap-1">
           {[1,2,3,4,5,6,7].map(day => (
             <div key={day} className={`h-8 flex-1 rounded-md flex items-center justify-center text-xs font-bold ${
               day <= 3 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-500'
             }`}>
               {day <= 3 ? '✓' : day}
             </div>
           ))}
         </div>
       </div>
    </div>
  );

  const renderProfile = () => (
    <div className="flex flex-col h-full pb-24 pt-8 px-6 overflow-y-auto no-scrollbar z-10">
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-slate-700 rounded-full mx-auto mb-4 border-4 border-slate-800 overflow-hidden relative shadow-lg">
          <UserIconPlaceholder />
        </div>
        <h2 className="text-2xl font-bold">{user.username}</h2>
        <p className="text-slate-400 text-sm">Member since Nov 2024</p>
      </div>

      {/* Advanced Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold mb-1">Total Games</span>
            <span className="font-bold text-xl text-white">{user.totalGamesPlayed}</span>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold mb-1">High Score</span>
            <span className="font-bold text-xl text-blue-400">{user.highScore}</span>
          </div>
          
          <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center">
             <div className="flex items-center justify-center w-full mb-1">
                 <span className="text-[10px] text-slate-400 uppercase font-bold">Avg Score</span>
             </div>
             <span className="font-bold text-xl text-white">
                {user.totalGamesPlayed > 0 ? Math.round(user.totalScore / user.totalGamesPlayed) : 0}
             </span>
          </div>
          
           <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center">
             <div className="flex items-center justify-center w-full mb-1">
                 <Target size={10} className="text-green-500 mr-1"/>
                 <span className="text-[10px] text-slate-400 uppercase font-bold">Accuracy</span>
             </div>
             <span className="font-bold text-xl text-white">
                 {user.totalGamesPlayed > 0 ? Math.round((user.totalCorrectAnswers / (user.totalGamesPlayed * 5)) * 100) : 0}%
             </span>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center">
             <div className="flex items-center justify-center w-full mb-1">
                 <Zap size={10} className="text-yellow-500 mr-1"/>
                 <span className="text-[10px] text-slate-400 uppercase font-bold">Perfect Runs</span>
             </div>
             <span className="font-bold text-xl text-white">{user.perfectGames}</span>
          </div>
          
          <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center">
             <div className="flex items-center justify-center w-full mb-1">
                 <Ticket size={10} className="text-blue-500 mr-1"/>
                 <span className="text-[10px] text-slate-400 uppercase font-bold">Balance</span>
             </div>
             <span className="font-bold text-xl text-white">{user.tickets}</span>
          </div>
      </div>

      {/* Referral Section */}
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-4 flex items-center drop-shadow-md">
          <Gift size={20} className="text-purple-400 mr-2" />
          Invite Friends
        </h3>
        
        {/* Referral Card */}
        <div className="bg-gradient-to-r from-purple-900/60 to-blue-900/60 backdrop-blur-md rounded-2xl p-5 border border-purple-500/30 mb-4 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="font-bold text-white mb-1">Get Free Tickets!</h4>
              <p className="text-xs text-purple-200">
                Share your code. You get <span className="text-white font-bold">+{GAME_CONFIG.TICKETS_REFERRAL_BONUS} tickets</span> when they play!
              </p>
            </div>
            <div className="bg-white/10 p-2 rounded-lg">
              <Gift size={20} className="text-purple-300" />
            </div>
          </div>
          
          <div className="bg-slate-900/60 rounded-xl p-1 flex items-center justify-between border border-dashed border-purple-400/50">
            <div className="px-4 font-mono font-bold tracking-widest text-lg text-purple-200">
              {user.referralCode}
            </div>
            <button 
              onClick={handleCopyCode}
              className={`p-3 rounded-lg transition-all ${
                copied ? 'bg-green-500 text-white' : 'bg-purple-600 text-white active:scale-95'
              }`}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          <p className="text-[10px] text-center mt-2 text-slate-400">
            {user.referralsCount} friends invited so far
          </p>
        </div>

        {/* Redeem Code */}
        {!showRedeemInput ? (
          <button 
            onClick={() => setShowRedeemInput(true)}
            className="w-full py-3 text-sm text-purple-300 hover:text-white transition-colors border border-dashed border-slate-700 rounded-xl hover:bg-slate-800/80 backdrop-blur-sm"
          >
            Have a referral code? Redeem it here
          </button>
        ) : (
          <div className="flex gap-2 animate-fade-in">
            <input 
              type="text" 
              placeholder="Enter Code"
              maxLength={6}
              value={redeemInputValue}
              onChange={(e) => setRedeemInputValue(e.target.value.toUpperCase())}
              className="flex-1 bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-xl px-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 uppercase font-mono"
            />
            <Button size="sm" onClick={handleRedeemCode} disabled={redeemInputValue.length < 3}>
              Redeem
            </Button>
          </div>
        )}
      </div>

      {/* Badges Section */}
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-4 flex items-center drop-shadow-md">
          <Award size={20} className="text-yellow-500 mr-2" />
          Badges & Achievements
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {BADGES.map(badge => {
            const isUnlocked = user.badges.includes(badge.id);
            return (
              <div key={badge.id} className={`aspect-square rounded-xl p-3 flex flex-col items-center justify-center text-center border transition-all ${
                isUnlocked 
                  ? 'bg-slate-800/80 backdrop-blur-sm border-blue-500/30 shadow-lg shadow-blue-500/10' 
                  : 'bg-slate-800/50 backdrop-blur-sm border-slate-700 opacity-60'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  isUnlocked ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-500'
                }`}>
                  {isUnlocked 
                    ? renderBadgeIcon(badge.iconName, "w-5 h-5")
                    : <Lock size={16} />
                  }
                </div>
                <div className={`text-[10px] font-bold leading-tight ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                  {badge.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <button className="w-full text-left p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800 transition-colors flex items-center justify-between group">
          <span className="font-medium text-slate-300 group-hover:text-white">Account Settings</span>
          <span className="text-slate-500">→</span>
        </button>
        <button className="w-full text-left p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800 transition-colors flex items-center justify-between group">
          <span className="font-medium text-slate-300 group-hover:text-white">Restore Purchases</span>
          <span className="text-slate-500">→</span>
        </button>
         <button className="w-full text-left p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800 transition-colors flex items-center justify-between group">
          <span className="font-medium text-slate-300 group-hover:text-white">Privacy & Legal</span>
          <span className="text-slate-500">→</span>
        </button>
      </div>
      
      <div className="mt-8 text-center">
        <span className="text-xs text-slate-600">Version 1.0.2 (Build 45)</span>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-slate-900 text-white font-sans max-w-md mx-auto relative shadow-2xl overflow-hidden">
      {/* Background Snow Effect - Global */}
      <Snowfall />

      {/* Dynamic Screen Rendering */}
      <div className={`h-full transition-opacity duration-300 relative z-10`}>
        {currentScreen === Screen.HOME && renderHome()}
        {currentScreen === Screen.QUIZ && renderQuiz()}
        {currentScreen === Screen.RESULT && renderResult()}
        {currentScreen === Screen.LEADERBOARD && renderLeaderboard()}
        {currentScreen === Screen.SHOP && renderShop()}
        {currentScreen === Screen.PROFILE && renderProfile()}
      </div>

      {/* Bottom Nav (only on non-game screens) */}
      {currentScreen !== Screen.QUIZ && currentScreen !== Screen.RESULT && (
        <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />
      )}
    </div>
  );
}

// Simple placeholder for user avatar
const UserIconPlaceholder = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-500 w-full h-full p-2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);