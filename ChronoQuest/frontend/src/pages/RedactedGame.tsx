import { useState, useEffect } from 'react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import axios from 'axios';

// Types
interface GameData {
    redacted_text: string;
    hidden_words: string[];
    distractors: string[];
    title: string;
    author: string;
}

interface Author {
    id: number;
    name: string;
}

interface DraggableWordProps {
    id: string;
    word: string;
}

const DraggableWord = ({ id, word }: DraggableWordProps) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: id,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="bg-black text-white font-mono px-2 py-1 m-1 cursor-grab hover:bg-gray-800 inline-block border border-white">
            {word}
        </div>
    );
};

interface DroppableZoneProps {
    id: string;
    filledWord?: string;
    isCorrect?: boolean | null;
}

const DroppableZone = ({ id, filledWord, isCorrect }: DroppableZoneProps) => {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    });

    let bgColor = 'bg-black';
    if (filledWord) {
        if (isCorrect === true) bgColor = 'bg-green-700';
        else if (isCorrect === false) bgColor = 'bg-red-700';
        else bgColor = 'bg-gray-700'; // Filled but not checked
    } else if (isOver) {
        bgColor = 'bg-gray-800';
    }

    return (
        <span ref={setNodeRef} className={`inline-block min-w-[80px] h-[1.5em] align-middle mx-1 ${bgColor} text-white font-mono px-2 border-b-2 border-white text-center`}>
            {filledWord || ""}
        </span>
    );
};

const RedactedGame = () => {
    const [gameData, setGameData] = useState<GameData | null>(null);
    const [loading, setLoading] = useState(false);
    const [placedWords, setPlacedWords] = useState<{ [key: string]: string }>({}); // zoneId -> word
    const [availableWords, setAvailableWords] = useState<string[]>([]);
    const [checkResult, setCheckResult] = useState<{ [key: string]: boolean } | null>(null);

    // Setup State
    const [setupComplete, setSetupComplete] = useState(false);
    const [timelines, setTimelines] = useState<string[]>([]);
    const [authors, setAuthors] = useState<Author[]>([]);
    const [selectedTimeline, setSelectedTimeline] = useState<string>('');
    const [selectedAuthorIds, setSelectedAuthorIds] = useState<number[]>([]);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [timelineRes, authorRes] = await Promise.all([
                    axios.get('/api/timelines'),
                    axios.get('/api/authors')
                ]);
                setTimelines(timelineRes.data);
                setAuthors(authorRes.data);
            } catch (err) {
                console.error("Failed to fetch filters", err);
            }
        };
        fetchFilters();
    }, []);

    const fetchGame = async () => {
        setLoading(true);
        setPlacedWords({});
        setCheckResult(null);
        try {
            const params: any = {};
            if (selectedTimeline) params.timeline = selectedTimeline;
            if (selectedAuthorIds.length > 0) params.author_ids = selectedAuthorIds;

            const res = await axios.post('/api/game/redacted', null, { params });
            setGameData(res.data);
            // Shuffle words
            const allWords = [...res.data.hidden_words, ...res.data.distractors];
            setAvailableWords(allWords.sort(() => Math.random() - 0.5));
            setSetupComplete(true);
        } catch (err) {
            console.error("Failed to fetch game", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleAuthor = (id: number) => {
        setSelectedAuthorIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over) {
            // If dropped on a zone
            const word = active.id as string;
            const zoneId = over.id as string;

            // Check if word is already placed somewhere else, remove it
            const newPlaced = { ...placedWords };
            Object.keys(newPlaced).forEach(key => {
                if (newPlaced[key] === word) delete newPlaced[key];
            });

            newPlaced[zoneId] = word;
            setPlacedWords(newPlaced);
        }
    };

    const checkAnswers = () => {
        if (!gameData) return;
        const results: { [key: string]: boolean } = {};
        gameData.hidden_words.forEach((word, index) => {
            const zoneId = `zone-${index}`;
            const placed = placedWords[zoneId];
            const isCorrect = placed === word;
            results[zoneId] = isCorrect;
        });

        setCheckResult(results);
    };

    if (loading) return <div className="min-h-screen bg-stone-200 flex items-center justify-center font-mono text-2xl">DECRYPTING...</div>;
    if (loading) return <div className="min-h-screen bg-stone-200 flex items-center justify-center font-mono text-2xl">DECRYPTING...</div>;

    // Only check for gameData error if we are NOT in setup mode
    if (setupComplete && !gameData) return <div className="min-h-screen bg-stone-200 flex items-center justify-center font-mono text-2xl">ERROR LOADING CLASSIFIED DATA</div>;

    // Parse text to create segments (only if gameData exists)
    const segments = gameData ? gameData.redacted_text.split(/(\{\d+\})/g) : [];

    return (
        <div className="min-h-screen bg-stone-200 text-stone-900 p-8 font-mono relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-10 right-10 border-4 border-red-700 text-red-700 p-2 text-4xl font-bold opacity-50 rotate-12 pointer-events-none">
                TOP SECRET
            </div>
            <div className="absolute bottom-10 left-10 text-stone-400 text-9xl font-bold opacity-20 pointer-events-none">
                CONFIDENTIAL
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <header className="mb-8 border-b-4 border-black pb-4 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold uppercase tracking-widest">Project: CHRONOS</h1>
                        <p className="text-sm mt-2">CLEARANCE LEVEL: 5 // EYES ONLY</p>
                    </div>
                    {setupComplete && (
                        <div className="flex gap-2">
                            <button onClick={() => setSetupComplete(false)} className="bg-white text-black border-2 border-black px-4 py-2 hover:bg-gray-200 transition-colors font-bold uppercase">
                                Reconfigure
                            </button>
                            <button onClick={fetchGame} className="bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors font-bold uppercase">
                                Next Dossier
                            </button>
                        </div>
                    )}
                </header>

                {!setupComplete ? (
                    <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <h2 className="text-2xl font-black uppercase mb-6 border-b-2 border-black pb-2">Mission Configuration</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-bold uppercase mb-2">Target Timeline</h3>
                                <select
                                    value={selectedTimeline}
                                    onChange={(e) => setSelectedTimeline(e.target.value)}
                                    className="w-full p-2 border-2 border-black font-mono focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                >
                                    <option value="">ALL TIMELINES (RANDOM)</option>
                                    {timelines.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <h3 className="font-bold uppercase mb-2">Target Subjects (Authors)</h3>
                                <div className="h-48 overflow-y-auto border-2 border-black p-2 font-mono text-sm">
                                    {authors.map(author => (
                                        <div key={author.id} className="flex items-center gap-2 mb-1">
                                            <input
                                                type="checkbox"
                                                id={`author-${author.id}`}
                                                checked={selectedAuthorIds.includes(author.id)}
                                                onChange={() => toggleAuthor(author.id)}
                                                className="accent-black"
                                            />
                                            <label htmlFor={`author-${author.id}`} className="cursor-pointer select-none">
                                                {author.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Leave empty for all authors.</p>
                            </div>
                        </div>

                        <button
                            onClick={fetchGame}
                            disabled={loading}
                            className="w-full mt-8 bg-black text-white p-4 font-bold uppercase text-xl hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_0px_rgba(128,128,128,1)] active:translate-y-1 active:shadow-none"
                        >
                            {loading ? "Initializing..." : "Initialize Mission"}
                        </button>
                    </div>
                ) : (
                    gameData && (
                        <DndContext onDragEnd={handleDragEnd}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Document Area */}
                                <div className="md:col-span-2 bg-white p-8 shadow-2xl border border-stone-400 min-h-[400px] relative">
                                    <div className="absolute top-0 left-0 w-full h-2 bg-stripes-gray opacity-20"></div>

                                    <div className="font-serif text-lg leading-loose text-justify">
                                        {segments.map((segment, i) => {
                                            const match = segment.match(/\{(\d+)\}/);
                                            if (match) {
                                                const index = parseInt(match[1]);
                                                const zoneId = `zone-${index}`;
                                                return (
                                                    <DroppableZone
                                                        key={i}
                                                        id={zoneId}
                                                        filledWord={placedWords[zoneId]}
                                                        isCorrect={checkResult ? checkResult[zoneId] : null}
                                                    />
                                                );
                                            }
                                            return <span key={i}>{segment}</span>;
                                        })}
                                    </div>

                                    <div className="mt-12 pt-4 border-t border-stone-300 text-sm text-stone-500 flex justify-between">
                                        <span>REF: {gameData.title.replace(/[a-z]/g, 'X')} // {gameData.author.replace(/[a-z]/g, 'X')}</span>
                                        <span>DATE: [REDACTED]</span>
                                    </div>
                                </div>

                                {/* Sidebar / Word Bank */}
                                <div className="bg-stone-300 p-6 border-l-4 border-stone-400">
                                    <h2 className="text-xl font-bold mb-4 border-b-2 border-black pb-2">DECRYPT KEYS</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {availableWords.map((word) => {
                                            // Hide word if placed
                                            const isPlaced = Object.values(placedWords).includes(word);
                                            if (isPlaced) return null;
                                            return <DraggableWord key={word} id={word} word={word} />;
                                        })}
                                    </div>

                                    <div className="mt-8">
                                        <button
                                            onClick={checkAnswers}
                                            className="w-full bg-red-700 text-white font-bold py-3 px-6 hover:bg-red-800 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                                        >
                                            VERIFY DECRYPTION
                                        </button>
                                    </div>

                                    {checkResult && (
                                        <div className="mt-4 p-4 bg-black text-green-500 font-mono text-sm">
                                            {Object.values(checkResult).every(v => v) ? (
                                                <div>
                                                    <p className="text-green-400 font-bold">ACCESS GRANTED</p>
                                                    <p>Subject: {gameData.title}</p>
                                                    <p>Author: {gameData.author}</p>
                                                </div>
                                            ) : (
                                                <p className="text-red-500 font-bold blink">ACCESS DENIED</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </DndContext>
                    )
                )}
            </div>
        </div>
    );
};

export default RedactedGame;
