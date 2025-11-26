import { Question } from '../types';

const QUESTIONS_POOL: Question[] = [
  { id: '1', text: 'Who holds the record for most World Cup wins?', options: ['Ingemar Stenmark', 'Mikaela Shiffrin', 'Lindsey Vonn'], correctAnswer: 'Mikaela Shiffrin' },
  { id: '2', text: 'Where were the 2010 Winter Olympics held?', options: ['Salt Lake City', 'Turin', 'Vancouver'], correctAnswer: 'Vancouver' },
  { id: '3', text: 'What is the color of the most difficult slope in Europe?', options: ['Red', 'Black', 'Double Diamond'], correctAnswer: 'Black' },
  { id: '4', text: 'Which discipline involves gates spaced farthest apart?', options: ['Slalom', 'Giant Slalom', 'Downhill'], correctAnswer: 'Downhill' },
  { id: '5', text: 'Who is known as "The Herminator"?', options: ['Hermann Maier', 'Marcel Hirscher', 'Bode Miller'], correctAnswer: 'Hermann Maier' },
  { id: '6', text: 'In which country is Kitzbühel located?', options: ['Germany', 'Switzerland', 'Austria'], correctAnswer: 'Austria' },
  { id: '7', text: 'What is a "fakie" in snowboarding?', options: ['Riding backwards', 'A fake jump', 'Falling down'], correctAnswer: 'Riding backwards' },
  { id: '8', text: 'Which shape of skis makes turning easier?', options: ['Camber', 'Rocker', 'Flat'], correctAnswer: 'Rocker' },
  { id: '9', text: 'How long is the Streif downhill course approx?', options: ['2.5 km', '3.3 km', '4.1 km'], correctAnswer: '3.3 km' },
  { id: '10', text: 'When was snowboarding included in the Olympics?', options: ['1992', '1998', '2002'], correctAnswer: '1998' },
  { id: '11', text: 'What does FIS stand for?', options: ['Intl. Ski Fed.', 'Fast Ice Skiing', 'Free International Ski'], correctAnswer: 'Intl. Ski Fed.' },
  { id: '12', text: 'Which Austrian skier won 8 Overall World Cups?', options: ['Annemarie M-P', 'Marcel Hirscher', 'Benjamin Raich'], correctAnswer: 'Marcel Hirscher' },
  { id: '13', text: 'A "360" involves spinning how many degrees?', options: ['180', '360', '720'], correctAnswer: '360' },
  { id: '14', text: 'What is "Après-ski"?', options: ['Pre-ski warm up', 'Post-ski socializing', 'Ski maintenance'], correctAnswer: 'Post-ski socializing' },
  { id: '15', text: 'Which material is commonly used for ski bases?', options: ['P-Tex', 'Teflon', 'Carbon'], correctAnswer: 'P-Tex' },
];

export const getRandomQuestions = (count: number): Question[] => {
  const shuffled = [...QUESTIONS_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
