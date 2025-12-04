import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import { GripVertical, CheckCircle, XCircle, Play, Users, ArrowLeft, Brain, Clock, HelpCircle, MessageSquareQuote, FileText } from 'lucide-react';

interface Entity {
    id: number;
    title: string;
    date_start: string;
    description: string;
    author_name?: string;
}

type GameMode = 'menu' | 'chrono-setup' | 'chrono-game' | 'author-game' | 'mystery-game' | 'quote-game';

const TrainingMode: React.FC = () => {
    const [allEntities, setAllEntities] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeMode, setActiveMode] = useState<GameMode>('menu');
    const navigate = useNavigate();

    // --- CHRONO SORT STATE ---
    const [chronoItems, setChronoItems] = useState<Entity[]>([]);
    const [chronoResult, setChronoResult] = useState<'success' | 'fail' | null>(null);
    const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);

    // --- WHO WROTE IT STATE ---
    const [authorQuestion, setAuthorQuestion] = useState<{ entity: Entity, options: string[] } | null>(null);
    const [authorScore, setAuthorScore] = useState(0);
    const [authorStreak, setAuthorStreak] = useState(0);
    const [authorFeedback, setAuthorFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

    // --- MYSTERY GAME STATE ---
    const [mysteryQuestion, setMysteryQuestion] = useState<{ vague_description: string, correct_answer: string, distractors: string[] } | null>(null);
    const [mysteryOptions, setMysteryOptions] = useState<string[]>([]);
    const [mysteryLoading, setMysteryLoading] = useState(false);
    const [mysteryFeedback, setMysteryFeedback] = useState<'correct' | 'wrong' | null>(null);

    // --- QUOTE GAME STATE ---
    const [quoteQuestion, setQuoteQuestion] = useState<{ quote: string, speaker: string, distractors: string[], title: string, author: string } | null>(null);
    const [quoteOptions, setQuoteOptions] = useState<string[]>([]);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [quoteFeedback, setQuoteFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [quoteError, setQuoteError] = useState<string | null>(null);

    // Fetch all data on mount
    useEffect(() => {
        axios.get('/api/timeline')
            .then(res => {
                setAllEntities(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    // Extract unique authors
    const availableAuthors = useMemo(() => {
        const authors = new Set<string>();
        allEntities.forEach(e => {
            if (e.author_name) authors.add(e.author_name);
        });
        return Array.from(authors).sort();
    }, [allEntities]);

    // --- CHRONO SORT LOGIC ---
    const toggleAuthor = (author: string) => {
        setSelectedAuthors(prev =>
            prev.includes(author)
                ? prev.filter(a => a !== author)
                : [...prev, author]
        );
    };

    const startChronoGame = () => {
        let pool = allEntities;
        if (selectedAuthors.length > 0) {
            pool = allEntities.filter(e => e.author_name && selectedAuthors.includes(e.author_name));
        }

        if (pool.length < 2) {
            alert("Not enough items found for the selected authors.");
            return;
        }

        const count = Math.min(5, pool.length);
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        setChronoItems(shuffled.slice(0, count));
        setChronoResult(null);
        setActiveMode('chrono-game');
    };

    const checkChronoOrder = () => {
        let isCorrect = true;
        for (let i = 0; i < chronoItems.length - 1; i++) {
            const d1 = new Date(chronoItems[i].date_start).getTime();
            const d2 = new Date(chronoItems[i + 1].date_start).getTime();
            if (d1 > d2) {
                isCorrect = false;
                break;
            }
        }
        setChronoResult(isCorrect ? 'success' : 'fail');
    };

    // --- WHO WROTE IT LOGIC ---
    const generateAuthorQuestion = () => {
        const validEntities = allEntities.filter(e => e.author_name);
        if (validEntities.length === 0) return;

        const entity = validEntities[Math.floor(Math.random() * validEntities.length)];
        const correctAuthor = entity.author_name!;

        const otherAuthors = availableAuthors.filter(a => a !== correctAuthor);
        const distractors = otherAuthors.sort(() => 0.5 - Math.random()).slice(0, 3);

        const options = [correctAuthor, ...distractors].sort(() => 0.5 - Math.random());

        setAuthorQuestion({ entity, options });
        setAuthorFeedback(null);
        setSelectedAnswer(null);
    };

    const startAuthorGame = () => {
        setAuthorScore(0);
        setAuthorStreak(0);
        generateAuthorQuestion();
        setActiveMode('author-game');
    };

    const handleAuthorAnswer = (answer: string) => {
        if (authorFeedback) return;

        setSelectedAnswer(answer);
        const isCorrect = answer === authorQuestion?.entity.author_name;

        if (isCorrect) {
            setAuthorScore(s => s + 10 + (authorStreak * 2));
            setAuthorStreak(s => s + 1);
            setAuthorFeedback('correct');
        } else {
            setAuthorStreak(0);
            setAuthorFeedback('wrong');
        }

        setTimeout(() => {
            generateAuthorQuestion();
        }, 1500);
    };

    // --- MYSTERY GAME LOGIC ---
    const fetchMysteryQuestion = async () => {
        setMysteryLoading(true);
        setMysteryFeedback(null);
        setSelectedAnswer(null);
        try {
            const res = await axios.post('/api/game/mystery');
            const data = res.data;
            setMysteryQuestion(data);

            const opts = [data.correct_answer, ...data.distractors].sort(() => 0.5 - Math.random());
            setMysteryOptions(opts);
        } catch (err) {
            console.error(err);
            alert("Failed to generate mystery game. Try again.");
        } finally {
            setMysteryLoading(false);
        }
    };

    const startMysteryGame = () => {
        setAuthorScore(0);
        setAuthorStreak(0);
        fetchMysteryQuestion();
        setActiveMode('mystery-game');
    };

    const handleMysteryAnswer = (answer: string) => {
        if (mysteryFeedback) return;

        setSelectedAnswer(answer);
        const isCorrect = answer === mysteryQuestion?.correct_answer;

        if (isCorrect) {
            setAuthorScore(s => s + 20 + (authorStreak * 5));
            setAuthorStreak(s => s + 1);
            setMysteryFeedback('correct');
        } else {
            setAuthorStreak(0);
            setMysteryFeedback('wrong');
        }

        setTimeout(() => {
            fetchMysteryQuestion();
        }, 2000);
    };

    // --- QUOTE GAME LOGIC ---
    const fetchQuoteQuestion = async () => {
        setQuoteLoading(true);
        setQuoteFeedback(null);
        setSelectedAnswer(null);
        setQuoteError(null);
        try {
            const res = await axios.post('/api/game/quote');
            const data = res.data;

            if (data.error) {
                setQuoteError(data.error);
                return;
            }

            setQuoteQuestion(data);
            const opts = [data.speaker, ...data.distractors].sort(() => 0.5 - Math.random());
            setQuoteOptions(opts);
        } catch (err) {
            console.error(err);
            setQuoteError("Failed to connect to the oracle.");
        } finally {
            setQuoteLoading(false);
        }
    };

    const startQuoteGame = () => {
        setAuthorScore(0);
        setAuthorStreak(0);
        fetchQuoteQuestion();
        setActiveMode('quote-game');
    };

    const handleQuoteAnswer = (answer: string) => {
        if (quoteFeedback) return;

        setSelectedAnswer(answer);
        const isCorrect = answer === quoteQuestion?.speaker;

        if (isCorrect) {
            setAuthorScore(s => s + 15 + (authorStreak * 3));
            setAuthorStreak(s => s + 1);
            setQuoteFeedback('correct');
        } else {
            setAuthorStreak(0);
            setQuoteFeedback('wrong');
        }

        setTimeout(() => {
            fetchQuoteQuestion();
        }, 2500); // Longer delay to read the quote/answer
    };


    if (loading) return <div className="text-center py-20 font-bold text-xl animate-pulse">Loading Data...</div>;

    return (
        <div className="max-w-3xl mx-auto min-h-[80vh]">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
                <div className="flex items-center gap-4">
                    {activeMode !== 'menu' && (
                        <button onClick={() => setActiveMode('menu')} className="hover:bg-gray-100 p-2 rounded-full transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                    )}
                    <h2 className="text-4xl font-black uppercase">The Arena</h2>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeMode === 'menu' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="grid md:grid-cols-2 gap-6"
                    >
                        {/* Chrono Sort Card */}
                        <div
                            onClick={() => setActiveMode('chrono-setup')}
                            className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all cursor-pointer group"
                        >
                            <Clock size={48} className="mb-4 group-hover:rotate-12 transition-transform" />
                            <h3 className="text-2xl font-black uppercase mb-2">Timeline Repair</h3>
                            <p className="font-bold text-gray-600">Drag and drop historical events into the correct chronological order.</p>
                        </div>

                        {/* Who Wrote It Card */}
                        <div
                            onClick={startAuthorGame}
                            className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all cursor-pointer group"
                        >
                            <Brain size={48} className="mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="text-2xl font-black uppercase mb-2">Who Wrote It?</h3>
                            <p className="font-bold text-gray-600">Speed round! Identify the author of the work before time runs out.</p>
                        </div>

                        {/* Mystery Description Card */}
                        <div
                            onClick={startMysteryGame}
                            className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all cursor-pointer group"
                        >
                            <HelpCircle size={48} className="mb-4 group-hover:rotate-180 transition-transform duration-500" />
                            <h3 className="text-2xl font-black uppercase mb-2">Mystery Description</h3>
                            <p className="font-bold text-gray-600">Identify the work from a vague, cryptic description generated by AI.</p>
                        </div>

                        {/* Quote Game Card */}
                        <div
                            onClick={startQuoteGame}
                            className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all cursor-pointer group"
                        >
                            <MessageSquareQuote size={48} className="mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="text-2xl font-black uppercase mb-2">Who Said That?</h3>
                            <p className="font-bold text-gray-600">Match famous quotes to the correct Character or Author.</p>
                        </div>

                        {/* Redacted Game Card */}
                        <div
                            onClick={() => navigate('/games/redacted')}
                            className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all cursor-pointer group"
                        >
                            <FileText size={48} className="mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="text-2xl font-black uppercase mb-2">Redacted</h3>
                            <p className="font-bold text-gray-600">Declassify documents by filling in the missing words.</p>
                        </div>
                    </motion.div>
                )}

                {activeMode === 'chrono-setup' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                        <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <h3 className="text-2xl font-black uppercase mb-4 flex items-center gap-2">
                                <Users /> Select Authors
                            </h3>
                            <p className="mb-6 font-bold text-gray-600">
                                Select specific authors to test your knowledge on, or leave empty to include everyone.
                            </p>

                            <div className="flex flex-wrap gap-2 mb-6">
                                <button
                                    onClick={() => setSelectedAuthors([])}
                                    className={`px-4 py-2 font-bold uppercase border-2 border-black transition-all ${selectedAuthors.length === 0 ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]' : 'bg-white text-black hover:bg-gray-100'}`}
                                >
                                    Random / All Authors
                                </button>
                                {availableAuthors.map(author => (
                                    <button
                                        key={author}
                                        onClick={() => toggleAuthor(author)}
                                        className={`px-4 py-2 font-bold uppercase border-2 border-black transition-all ${selectedAuthors.includes(author) ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]' : 'bg-white text-black hover:bg-gray-100'}`}
                                    >
                                        {author}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={startChronoGame}
                                className="w-full bg-green-400 hover:bg-green-500 text-black border-2 border-black p-4 font-black text-xl uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:shadow-none flex items-center justify-center gap-2"
                            >
                                <Play size={24} /> Start Game
                            </button>
                        </div>
                    </motion.div>
                )}

                {activeMode === 'chrono-game' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <p className="mb-6 font-bold text-lg">Drag items to arrange them Oldest (Top) to Newest (Bottom).</p>
                        <Reorder.Group axis="y" values={chronoItems} onReorder={setChronoItems} className="space-y-4">
                            {chronoItems.map((item) => (
                                <Reorder.Item key={item.id} value={item} className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-grab active:cursor-grabbing flex items-center gap-4 select-none">
                                    <GripVertical className="text-gray-400" />
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg">{item.title}</h3>
                                        {item.author_name && <span className="text-xs font-bold uppercase bg-gray-100 px-2 py-0.5 border border-black mr-2">{item.author_name}</span>}
                                        <p className="text-sm text-gray-600 line-clamp-1 mt-1">{item.description}</p>
                                    </div>
                                    {chronoResult && <div className="font-mono font-bold bg-black text-white px-2 py-1 text-xs whitespace-nowrap">{item.date_start}</div>}
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                        <button onClick={checkChronoOrder} className={`w-full p-4 font-black text-xl uppercase border-2 border-black transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${chronoResult === 'success' ? 'bg-green-400' : chronoResult === 'fail' ? 'bg-red-400' : 'bg-yellow-300 hover:bg-yellow-400'}`}>
                            {chronoResult === 'success' ? <span className="flex items-center justify-center gap-2"><CheckCircle /> Correct!</span> : chronoResult === 'fail' ? <span className="flex items-center justify-center gap-2"><XCircle /> Incorrect.</span> : "Submit Order"}
                        </button>
                    </motion.div>
                )}

                {activeMode === 'author-game' && authorQuestion && (
                    <motion.div
                        key={authorQuestion.entity.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="max-w-xl mx-auto"
                    >
                        <div className="flex justify-between items-end mb-8 font-mono font-bold">
                            <div className="text-xl">SCORE: {authorScore}</div>
                            <div className="text-sm text-gray-500">STREAK: {authorStreak} 🔥</div>
                        </div>

                        <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] mb-8 text-center">
                            <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Who wrote this?</div>
                            <h3 className="text-3xl md:text-4xl font-black font-serif mb-6 leading-tight">
                                "{authorQuestion.entity.title}"
                            </h3>
                            <p className="text-gray-600 italic line-clamp-2">{authorQuestion.entity.description}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {authorQuestion.options.map((author) => {
                                const isSelected = selectedAnswer === author;
                                const isCorrect = author === authorQuestion.entity.author_name;

                                let btnClass = "bg-white hover:bg-gray-100";
                                if (authorFeedback) {
                                    if (isCorrect) btnClass = "bg-green-400 border-green-600";
                                    else if (isSelected && !isCorrect) btnClass = "bg-red-400 border-red-600";
                                    else btnClass = "bg-gray-100 text-gray-400";
                                }

                                return (
                                    <button
                                        key={author}
                                        onClick={() => handleAuthorAnswer(author)}
                                        disabled={!!authorFeedback}
                                        className={`p-4 border-2 border-black font-bold text-lg uppercase transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none ${btnClass}`}
                                    >
                                        {author}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {activeMode === 'mystery-game' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="max-w-xl mx-auto"
                    >
                        <div className="flex justify-between items-end mb-8 font-mono font-bold">
                            <div className="text-xl">SCORE: {authorScore}</div>
                            <div className="text-sm text-gray-500">STREAK: {authorStreak} 🔥</div>
                        </div>

                        {mysteryLoading ? (
                            <div className="bg-white border-4 border-black p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] mb-8 text-center animate-pulse">
                                <div className="text-2xl font-black uppercase mb-4">Consulting the Oracle...</div>
                                <div className="text-gray-500">Generating cryptic description</div>
                            </div>
                        ) : mysteryQuestion && (
                            <>
                                <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] mb-8 text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
                                    <div className="text-sm font-bold text-purple-600 uppercase tracking-widest mb-4">Identify the Work</div>
                                    <p className="text-xl md:text-2xl font-serif font-bold mb-6 leading-relaxed italic">
                                        "{mysteryQuestion.vague_description}"
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {mysteryOptions.map((option) => {
                                        const isSelected = selectedAnswer === option;
                                        const isCorrect = option === mysteryQuestion.correct_answer;

                                        let btnClass = "bg-white hover:bg-gray-100";
                                        if (mysteryFeedback) {
                                            if (isCorrect) btnClass = "bg-green-400 border-green-600";
                                            else if (isSelected && !isCorrect) btnClass = "bg-red-400 border-red-600";
                                            else btnClass = "bg-gray-100 text-gray-400";
                                        }

                                        return (
                                            <button
                                                key={option}
                                                onClick={() => handleMysteryAnswer(option)}
                                                disabled={!!mysteryFeedback}
                                                className={`p-4 border-2 border-black font-bold text-lg uppercase transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none text-left flex items-center justify-between ${btnClass}`}
                                            >
                                                <span>{option}</span>
                                                {mysteryFeedback && isCorrect && <CheckCircle size={20} />}
                                                {mysteryFeedback && isSelected && !isCorrect && <XCircle size={20} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </motion.div>
                )}

                {activeMode === 'quote-game' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="max-w-xl mx-auto"
                    >
                        <div className="flex justify-between items-end mb-8 font-mono font-bold">
                            <div className="text-xl">SCORE: {authorScore}</div>
                            <div className="text-sm text-gray-500">STREAK: {authorStreak} 🔥</div>
                        </div>

                        {quoteLoading ? (
                            <div className="bg-white border-4 border-black p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] mb-8 text-center animate-pulse">
                                <div className="text-2xl font-black uppercase mb-4">Finding a Quote...</div>
                                <div className="text-gray-500">Scanning literary database</div>
                            </div>
                        ) : quoteError ? (
                            <div className="bg-red-100 border-4 border-red-500 p-8 text-center">
                                <h3 className="text-xl font-bold text-red-700 mb-2">Error</h3>
                                <p className="text-red-600 mb-4">{quoteError}</p>
                                <button onClick={fetchQuoteQuestion} className="bg-red-500 text-white px-4 py-2 font-bold uppercase hover:bg-red-600">Try Again</button>
                            </div>
                        ) : quoteQuestion && (
                            <>
                                <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] mb-8 text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
                                    <div className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">Who Said That?</div>
                                    <blockquote className="text-2xl md:text-3xl font-serif font-black mb-6 leading-tight">
                                        "{quoteQuestion.quote}"
                                    </blockquote>
                                    <div className="text-sm font-bold text-gray-400 uppercase">
                                        From: {quoteQuestion.title}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {quoteOptions.map((option) => {
                                        const isSelected = selectedAnswer === option;
                                        const isCorrect = option === quoteQuestion.speaker;

                                        let btnClass = "bg-white hover:bg-gray-100";
                                        if (quoteFeedback) {
                                            if (isCorrect) btnClass = "bg-green-400 border-green-600";
                                            else if (isSelected && !isCorrect) btnClass = "bg-red-400 border-red-600";
                                            else btnClass = "bg-gray-100 text-gray-400";
                                        }

                                        return (
                                            <button
                                                key={option}
                                                onClick={() => handleQuoteAnswer(option)}
                                                disabled={!!quoteFeedback}
                                                className={`p-4 border-2 border-black font-bold text-lg uppercase transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none ${btnClass}`}
                                            >
                                                {option}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TrainingMode;
