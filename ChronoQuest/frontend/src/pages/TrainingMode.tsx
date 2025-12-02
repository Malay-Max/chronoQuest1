import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Reorder } from 'framer-motion';
import { GripVertical, RefreshCw, CheckCircle, XCircle, Play, Users } from 'lucide-react';

interface Entity {
    id: number;
    title: string;
    date_start: string;
    description: string;
    author_name?: string;
}

const TrainingMode: React.FC = () => {
    const [allEntities, setAllEntities] = useState<Entity[]>([]);
    const [gameItems, setGameItems] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<'success' | 'fail' | null>(null);
    const [gameStarted, setGameStarted] = useState(false);

    // Author Selection State
    const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);

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

    const toggleAuthor = (author: string) => {
        setSelectedAuthors(prev =>
            prev.includes(author)
                ? prev.filter(a => a !== author)
                : [...prev, author]
        );
    };

    const startGame = () => {
        // Filter entities based on selection
        let pool = allEntities;
        if (selectedAuthors.length > 0) {
            pool = allEntities.filter(e => e.author_name && selectedAuthors.includes(e.author_name));
        }

        if (pool.length < 2) {
            alert("Not enough items found for the selected authors. Please select more authors or add more data.");
            return;
        }

        // Randomly select 5 items (or fewer if pool is small)
        const count = Math.min(5, pool.length);
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);

        setGameItems(selected);
        setGameStarted(true);
        setResult(null);
    };

    const resetGame = () => {
        setGameStarted(false);
        setResult(null);
        setGameItems([]);
    };

    const checkOrder = () => {
        let isCorrect = true;
        for (let i = 0; i < gameItems.length - 1; i++) {
            const d1 = new Date(gameItems[i].date_start).getTime();
            const d2 = new Date(gameItems[i + 1].date_start).getTime();
            if (d1 > d2) {
                isCorrect = false;
                break;
            }
        }
        setResult(isCorrect ? 'success' : 'fail');
    };

    if (loading) return <div className="text-center py-20 font-bold text-xl animate-pulse">Loading Data...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
                <h2 className="text-4xl font-black uppercase">Chrono-Sort</h2>
                {gameStarted && (
                    <button
                        onClick={resetGame}
                        className="brutal-btn flex items-center gap-2 font-bold"
                    >
                        <RefreshCw size={20} /> Setup New Game
                    </button>
                )}
            </div>

            {!gameStarted ? (
                // SETUP SCREEN
                <div className="space-y-8">
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
                                className={`
                                    px-4 py-2 font-bold uppercase border-2 border-black transition-all
                                    ${selectedAuthors.length === 0
                                        ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]'
                                        : 'bg-white text-black hover:bg-gray-100'
                                    }
                                `}
                            >
                                Random / All Authors
                            </button>
                            {availableAuthors.map(author => (
                                <button
                                    key={author}
                                    onClick={() => toggleAuthor(author)}
                                    className={`
                                        px-4 py-2 font-bold uppercase border-2 border-black transition-all
                                        ${selectedAuthors.includes(author)
                                            ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]'
                                            : 'bg-white text-black hover:bg-gray-100'
                                        }
                                    `}
                                >
                                    {author}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={startGame}
                            className="w-full bg-green-400 hover:bg-green-500 text-black border-2 border-black p-4 font-black text-xl uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:shadow-none flex items-center justify-center gap-2"
                        >
                            <Play size={24} /> Start Game
                        </button>
                    </div>
                </div>
            ) : (
                // GAME SCREEN
                <div className="space-y-6">
                    <p className="mb-6 font-bold text-lg">
                        Drag the items to arrange them in chronological order (Oldest to Newest).
                    </p>

                    <Reorder.Group axis="y" values={gameItems} onReorder={setGameItems} className="space-y-4">
                        {gameItems.map((item) => (
                            <Reorder.Item
                                key={item.id}
                                value={item}
                                className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-grab active:cursor-grabbing flex items-center gap-4 select-none"
                            >
                                <GripVertical className="text-gray-400" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg">{item.title}</h3>
                                    {item.author_name && (
                                        <span className="text-xs font-bold uppercase bg-gray-100 px-2 py-0.5 border border-black mr-2">
                                            {item.author_name}
                                        </span>
                                    )}
                                    <p className="text-sm text-gray-600 line-clamp-1 mt-1">{item.description}</p>
                                </div>
                                {result && (
                                    <div className="font-mono font-bold bg-black text-white px-2 py-1 text-xs whitespace-nowrap">
                                        {item.date_start}
                                    </div>
                                )}
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>

                    <button
                        onClick={checkOrder}
                        className={`
              w-full p-4 font-black text-xl uppercase border-2 border-black transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
              ${result === 'success' ? 'bg-green-400 hover:bg-green-500' :
                                result === 'fail' ? 'bg-red-400 hover:bg-red-500' :
                                    'bg-yellow-300 hover:bg-yellow-400'}
            `}
                    >
                        {result === 'success' ? (
                            <span className="flex items-center justify-center gap-2"><CheckCircle /> Correct! Well done.</span>
                        ) : result === 'fail' ? (
                            <span className="flex items-center justify-center gap-2"><XCircle /> Incorrect. Try again!</span>
                        ) : (
                            "Submit Order"
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default TrainingMode;
