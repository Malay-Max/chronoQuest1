import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Reorder } from 'framer-motion';
import { GripVertical, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface Entity {
    id: number;
    title: string;
    date_start: string;
    description: string;
}

const TrainingMode: React.FC = () => {
    const [items, setItems] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<'success' | 'fail' | null>(null);

    const fetchGame = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await axios.get('http://localhost:8550/api/entities/random?count=5');
            // Shuffle initially just in case, though backend sends random
            setItems(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGame();
    }, []);

    const checkOrder = () => {
        let isCorrect = true;
        for (let i = 0; i < items.length - 1; i++) {
            const d1 = new Date(items[i].date_start).getTime();
            const d2 = new Date(items[i + 1].date_start).getTime();
            if (d1 > d2) {
                isCorrect = false;
                break;
            }
        }
        setResult(isCorrect ? 'success' : 'fail');
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
                <h2 className="text-4xl font-black uppercase">Chrono-Sort</h2>
                <button
                    onClick={fetchGame}
                    className="brutal-btn flex items-center gap-2 font-bold"
                >
                    <RefreshCw size={20} /> New Game
                </button>
            </div>

            <p className="mb-6 font-bold text-lg">
                Drag the items to arrange them in chronological order (Oldest to Newest).
            </p>

            {loading ? (
                <div className="text-center py-20 font-bold text-xl animate-pulse">Loading History...</div>
            ) : items.length === 0 ? (
                <div className="text-center py-20 font-bold text-xl">Not enough data to play. Add some notes first!</div>
            ) : (
                <div className="space-y-6">
                    <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-4">
                        {items.map((item) => (
                            <Reorder.Item
                                key={item.id}
                                value={item}
                                className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-grab active:cursor-grabbing flex items-center gap-4 select-none"
                            >
                                <GripVertical className="text-gray-400" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg">{item.title}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-1">{item.description}</p>
                                </div>
                                {result && (
                                    <div className="font-mono font-bold bg-black text-white px-2 py-1 text-xs">
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
