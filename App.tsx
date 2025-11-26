import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Ticket, Zap, Trophy, Clock, Share2, Info, Lock, Flag, Calendar, Target, Crown, Award, Gift, Copy, Check, ChevronLeft, Volume2, VolumeX, Bell, Smartphone, LogOut, Save, Mail, ShoppingBag } from 'lucide-react';
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
    dailyBonusClaimed: false,
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
    settings: {
      soundEnabled: true,
      hapticEnabled: true,
      notificationsEnabled: false,
    }
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
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  
  // Settings UI State
  const [tempUsername, setTempUsername] = useState(user.username);

  // Refs for timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- ACTIONS ---

  const startQuiz = useCallback((isFree: boolean) => {
    if (!isFree && user.tickets < GAME_CONFIG.TICKET_COST_REPLAY) {
      setCurrentScreen(Screen.SHOP);
      return;
    }

    // Deduct ticket if not free
    if (!isFree) {
      setUser(prev => ({ ...prev, tickets: prev.tickets - GAME_CONFIG.TICKET_COST_REPLAY }));
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
        // NOTE: No tickets added here. Only earned via login, referral or shop.
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

  const toggleSetting = (key: keyof typeof user.settings) => {
    setUser(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: !prev.settings[key]
      }
    }));
  };

  const saveUsername = () => {
    if (tempUsername.trim().length > 0) {
      setUser(prev => ({ ...prev, username: tempUsername.trim() }));
      alert("Profile updated!");
    }
  };

  // --- EFFECTS ---

  // Daily Login Bonus Logic
  useEffect(() => {
    if (!user.dailyBonusClaimed) {
      setUser(prev => ({
        ...prev,
        tickets: prev.tickets + GAME_CONFIG.DAILY_LOGIN_BONUS,
        dailyBonusClaimed: true
      }));
      setShowDailyBonus(true);
      setTimeout(() => setShowDailyBonus(false), 4000); // Hide after 4s
    }
  }, []); // Run once on mount

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

  const renderDailyBonusModal = () => (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ${showDailyBonus ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0 pointer-events-none'}`}>
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/20">
        <div className="bg-white/20 p-1.5 rounded-full">
          <Gift size={20} className="text-white" fill="white" />
        </div>
        <div>
          <p className="font-bold text-sm">Daily Bonus!</p>
          <p className="text-xs opacity-90">+{GAME_CONFIG.DAILY_LOGIN_BONUS} Ticket added</p>
        </div>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="flex flex-col h-full pb-24 pt-8 px-6 overflow-y-auto no-scrollbar relative z-10">
      {renderDailyBonusModal()}
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-white drop-shadow-lg">
            SKI<span className="text-blue-400">QUIZ</span>
          </h1>
          <p className="text-blue-200 text-sm shadow-black drop-shadow-sm">Season 24/25 • Week 12</p>
        </div>
        <div className="flex items-center bg-slate-800/80 backdrop-blur-md rounded-full px-3 py-1.5 border border-slate-700 cursor-pointer shadow-lg active:scale-95 transition-transform" onClick={() => setCurrentScreen(Screen.SHOP)}>
          <Ticket size={16} className="text-blue-400 mr-2" />
          <span className="font-bold text-white">{user.tickets}</span>
          <div className="ml-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white">+</div>
        </div>
      </div>

      {/* Hero Card - Enhanced */}
      <div className="relative mb-8 group">
        {/* Glow Effect behind card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        
        <div className="bg-slate-900 rounded-[1.8rem] p-1 shadow-2xl relative overflow-hidden border border-slate-800">
           {/* Inner background with gradient */}
           <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/10 absolute inset-0"></div>
           
           {/* Content Container */}
           <div className="relative rounded-[1.6rem] bg-slate-900/80 backdrop-blur-md p-5 flex flex-col h-full min-h-[220px]">
              
              {/* Header: Timer & Badge */}
              <div className="flex justify-between items-start mb-4">
                 <div className="flex flex-col relative z-10">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Weekly Cup</span>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter leading-none drop-shadow-lg">
                      WIN A <br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">HELMET</span>
                    </h2>
                 </div>
                 
                 <div className="bg-black/40 rounded-lg p-2 border border-white/5 flex flex-col items-center min-w-[70px] backdrop-blur-sm">
                    <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">Ends In</span>
                    <div className="font-mono font-bold text-white text-sm flex items-center gap-1">
                       <Clock size={12} className="text-red-400 animate-pulse"/>
                       04:22
                    </div>
                 </div>
              </div>

              {/* Middle: Stats & Visuals */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                 <div className="flex items-center gap-3 bg-white/5 rounded-full pl-1 pr-4 py-1.5 border border-white/10 backdrop-blur-md">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-600 flex items-center justify-center text-xs font-bold text-black shadow-lg">1</div>
                    <div className="flex flex-col leading-none">
                       <span className="text-[10px] text-slate-300 font-medium">Current Leader</span>
                       <span className="text-sm font-bold text-white">685 pts</span>
                    </div>
                 </div>
                 
                 {/* Decorative Icon */}
                 <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-4 -translate-y-8">
                    <Trophy size={120} className="text-blue-400" />
                 </div>
              </div>

              {/* Action: Button */}
              <div className="mt-auto relative z-20">
                {!user.dailyFreePlayUsed ? (
                  <Button fullWidth variant="success" size="lg" onClick={() => startQuiz(true)} className="shadow-lg shadow-green-900/20 border-t border-green-400/20">
                    <div className="flex flex-col items-center leading-none py-0.5">
                       <span className="text-lg font-black uppercase tracking-wide">Play Free</span>
                       <span className="text-[10px] opacity-90 font-medium mt-1">1x Daily Chance</span>
                    </div>
                  </Button>
                ) : (
                  <div className="flex flex-col gap-3">
                     <Button fullWidth variant="primary" size="lg" onClick={() => startQuiz(false)} disabled={user.tickets < GAME_CONFIG.TICKET_COST_REPLAY} className="shadow-lg shadow-blue-900/20 border-t border-blue-400/20">
                        <div className="flex items-center justify-center gap-2">
                           <span className="text-lg font-black uppercase tracking-wide">Play Now</span>
                           <div className="bg-black/20 px-2 py-1 rounded text-xs flex items-center font-mono border border-white/10 text-blue-200">
                              - {GAME_CONFIG.TICKET_COST_REPLAY} <Ticket size={12} className="ml-1"/>
                           </div>
                        </div>
                     </Button>
                     <div className="text-center">
                        <span className="text-[10px] text-slate-500 font-medium bg-black/20 px-3 py-1 rounded-full">Next free game in <span className="font-mono text-slate-300">14:20:05</span></span>
                     </div>
                  </div>
                )}
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
            key={quiz.currentQuestionIndex} // Key forces remount for animations
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
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-4">
          <Button fullWidth variant="primary" onClick={() => startQuiz(false)} disabled={user.tickets < GAME_CONFIG.TICKET_COST_REPLAY}>
            Play Again
            <span className="ml-2 bg-black/20 px-2 py-0.5 rounded text-xs font-normal opacity-80">
              -{GAME_CONFIG.TICKET_COST_REPLAY} Tickets
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black italic tracking-tight text-white drop-shadow-md">
            SKI<span className="text-blue-400">SHOP</span>
          </h2>
          <p className="text-blue-200 text-xs">Get tickets & keep playing</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-800/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700">
          <Ticket size={14} className="text-blue-400" />
          <span className="font-bold text-sm">{user.tickets}</span>
        </div>
      </div>

      {/* Daily Bonus Section - Redesigned as Hero */}
      <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 p-1 shadow-lg group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="bg-slate-900/40 backdrop-blur-md rounded-xl p-4 relative z-10">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-sm flex items-center text-indigo-300">
               <Zap size={16} className="text-yellow-400 mr-2 fill-yellow-400" />
               Daily Streak
             </h3>
             <span className="text-xs font-mono text-slate-400 bg-black/20 px-2 py-0.5 rounded">Day {Math.min(user.streakDays + 1, 7)} of 7</span>
          </div>
          
          {/* Progress Track */}
          <div className="flex justify-between items-center gap-1 relative">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-slate-700 -z-10"></div>
            
            {[1,2,3,4,5,6,7].map(day => {
               const isCompleted = day <= user.streakDays;
               const isToday = day === user.streakDays + 1;
               const isLast = day === 7;
               
               let bgClass = "bg-slate-800 border-slate-600 text-slate-500";
               if (isCompleted) bgClass = "bg-blue-500 border-blue-400 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]";
               if (isToday) bgClass = "bg-yellow-500 border-yellow-300 text-white shadow-[0_0_10px_rgba(234,179,8,0.5)] scale-110";
               if (isLast && !isCompleted) bgClass = "bg-indigo-900 border-indigo-500 text-indigo-300";

               return (
                 <div key={day} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all relative ${bgClass}`}>
                   {isCompleted ? <Check size={12} strokeWidth={4}/> : day}
                   {isLast && <Gift size={12} className="absolute -top-4 text-yellow-400 animate-bounce" />}
                 </div>
               );
            })}
          </div>
          <p className="text-[10px] text-center mt-3 text-indigo-200/70">
            Log in 7 days in a row to win +5 Tickets!
          </p>
        </div>
      </div>

       <h3 className="font-bold text-lg mb-4 text-white flex items-center">
         <ShoppingBag size={18} className="mr-2 text-blue-400" />
         Ticket Packs
       </h3>

       <div className="space-y-4">
         {SHOP_ITEMS.map((item, idx) => {
           // Determine style based on pack type (heuristic based on ticket count)
           const isBestValue = item.tickets >= 60;
           const isPopular = item.tickets === 25;
           
           let cardStyle = "bg-slate-800/40 border-slate-700/50";
           let iconBg = "bg-blue-500/20 text-blue-400";
           let buttonVariant: 'primary' | 'secondary' | 'success' = 'secondary';
           
           if (isPopular) {
             cardStyle = "bg-slate-800/60 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.1)]";
             iconBg = "bg-purple-500/20 text-purple-400";
             buttonVariant = 'primary';
           }
           if (isBestValue) {
             cardStyle = "bg-gradient-to-br from-slate-800/80 to-amber-900/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]";
             iconBg = "bg-amber-500/20 text-amber-400";
             buttonVariant = 'success'; // Or custom gold
           }

           return (
             <div key={item.id} className={`relative group overflow-hidden rounded-2xl p-4 backdrop-blur-md border transition-all hover:scale-[1.02] active:scale-[0.98] ${cardStyle}`}>
               {/* Label */}
               {item.label && (
                   <div className={`absolute top-0 right-0 text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-md uppercase tracking-wider ${isBestValue ? 'bg-amber-500 text-black' : 'bg-purple-600 text-white'}`}>
                      {item.label}
                   </div>
               )}
               
               <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-4">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${iconBg}`}>
                        <Ticket size={28} strokeWidth={2.5} />
                     </div>
                     <div>
                        <div className="text-white font-black text-2xl leading-none flex items-baseline gap-1">
                          {item.tickets} <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Tickets</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Instant Top-up</div>
                     </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant={buttonVariant as any} 
                    className={isBestValue ? '!bg-amber-500 !text-black !border-amber-700 hover:!bg-amber-400' : ''}
                    onClick={() => {
                      setUser(prev => ({...prev, tickets: prev.tickets + item.tickets}));
                      alert(`Purchased ${item.tickets} tickets!`);
                    }}
                  >
                    {item.price}
                  </Button>
               </div>
             </div>
           );
         })}
       </div>
       
       <div className="mt-8 text-center px-8">
          <p className="text-[10px] text-slate-500">
            Transactions are secure and processed via Stripe. <br/>
            Tickets do not expire.
          </p>
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
        <button 
          onClick={() => setCurrentScreen(Screen.SETTINGS)}
          className="w-full text-left p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800 transition-colors flex items-center justify-between group"
        >
          <span className="font-medium text-slate-300 group-hover:text-white">Account Settings</span>
          <span className="text-slate-500">→</span>
        </button>
      </div>
      
      <div className="mt-8 text-center pb-8">
        <span className="text-xs text-slate-600">Version 1.0.2 (Build 45)</span>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="flex flex-col h-full bg-slate-900 z-20">
      {/* Settings Header */}
      <div className="px-6 pt-8 pb-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center sticky top-0 z-30">
        <button 
          onClick={() => setCurrentScreen(Screen.PROFILE)} 
          className="mr-4 p-2 -ml-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
        
        {/* Section: Profile */}
        <section>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">My Profile</h3>
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-4 space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Username</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
             <Button size="sm" fullWidth onClick={saveUsername} disabled={tempUsername === user.username}>
                <Save size={16} className="mr-2" /> Update Profile
              </Button>
          </div>
        </section>

        {/* Section: Preferences */}
        <section>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Preferences</h3>
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
            
            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                  {user.settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </div>
                <span className="font-medium text-slate-200">Sound Effects</span>
              </div>
              <button 
                onClick={() => toggleSetting('soundEnabled')}
                className={`w-12 h-6 rounded-full relative transition-colors ${user.settings.soundEnabled ? 'bg-blue-500' : 'bg-slate-600'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${user.settings.soundEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {/* Haptics Toggle */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                   <Smartphone size={16} />
                </div>
                <span className="font-medium text-slate-200">Haptic Feedback</span>
              </div>
              <button 
                onClick={() => toggleSetting('hapticEnabled')}
                className={`w-12 h-6 rounded-full relative transition-colors ${user.settings.hapticEnabled ? 'bg-blue-500' : 'bg-slate-600'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${user.settings.hapticEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

             {/* Notifications Toggle */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                   <Bell size={16} />
                </div>
                <span className="font-medium text-slate-200">Notifications</span>
              </div>
              <button 
                onClick={() => toggleSetting('notificationsEnabled')}
                className={`w-12 h-6 rounded-full relative transition-colors ${user.settings.notificationsEnabled ? 'bg-blue-500' : 'bg-slate-600'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${user.settings.notificationsEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

          </div>
        </section>

        {/* Section: Support */}
        <section>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Support</h3>
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 p-1">
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 rounded-lg transition-colors text-left">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-slate-400" />
                <span className="font-medium text-slate-200">Contact Support</span>
              </div>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 rounded-lg transition-colors text-left border-t border-slate-700/50">
               <div className="flex items-center gap-3">
                <Info size={18} className="text-slate-400" />
                <span className="font-medium text-slate-200">Privacy Policy</span>
              </div>
            </button>
          </div>
        </section>

        {/* Section: Danger */}
        <section>
           <Button variant="danger" fullWidth onClick={() => alert("Logged out successfully (Simulated)")}>
             <LogOut size={18} className="mr-2" /> Log Out
           </Button>
           <div className="mt-4 text-center">
             <p className="text-[10px] text-slate-600 uppercase tracking-widest">SkiQuiz Inc. © 2024</p>
           </div>
        </section>

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
        {currentScreen === Screen.SETTINGS && renderSettings()}
      </div>

      {/* Bottom Nav (only on non-game screens) */}
      {currentScreen !== Screen.QUIZ && currentScreen !== Screen.RESULT && currentScreen !== Screen.SETTINGS && (
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