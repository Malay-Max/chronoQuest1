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
    const [loading, setLoading] = useState(true);
    const [placedWords, setPlacedWords] = useState<{ [key: string]: string }>({}); // zoneId -> word
    const [availableWords, setAvailableWords] = useState<string[]>([]);
    const [checkResult, setCheckResult] = useState<{ [key: string]: boolean } | null>(null);

    useEffect(() => {
        fetchGame();
    }, []);

    const fetchGame = async () => {
        setLoading(true);
        setPlacedWords({});
        setCheckResult(null);
        try {
            const res = await axios.post('/api/game/redacted');
            setGameData(res.data);
            // Shuffle words
            const allWords = [...res.data.hidden_words, ...res.data.distractors];
            setAvailableWords(allWords.sort(() => Math.random() - 0.5));
        } catch (err) {
            console.error("Failed to fetch game", err);
        } finally {
            setLoading(false);
        }
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
    if (!gameData) return <div className="min-h-screen bg-stone-200 flex items-center justify-center font-mono text-2xl">ERROR LOADING CLASSIFIED DATA</div>;

    // Parse text to create segments
    const segments = gameData.redacted_text.split(/(\{\d+\})/g);

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
                    <button onClick={fetchGame} className="bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors">
                        NEXT DOSSIER
                    </button>
                </header>

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
            </div>
        </div>
    );
};

export default RedactedGame;
