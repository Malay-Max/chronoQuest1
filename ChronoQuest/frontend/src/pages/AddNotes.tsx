import React, { useState } from 'react';
import axios from 'axios';
import { Save, Loader2, Check } from 'lucide-react';

const AddNotes: React.FC = () => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [extractedData, setExtractedData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleProcess = async () => {
        if (!text.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post('/api/extract', { text });
            setExtractedData(response.data);
        } catch (err) {
            setError('Failed to extract data. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCommit = async () => {
        if (!extractedData) return;
        setLoading(true);
        try {
            await axios.post('/api/commit', extractedData);
            alert('Data saved successfully!');
            setExtractedData(null);
            setText('');
        } catch (err) {
            setError('Failed to save data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-black uppercase border-b-4 border-black pb-2">Add Historical Notes</h2>

            <div className="flex gap-6">
                <div className="flex-1 space-y-4">
                    <textarea
                        className="w-full h-96 p-4 border-2 border-black font-mono text-sm resize-none focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                        placeholder="Paste your history notes here (Markdown supported)..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <button
                        onClick={handleProcess}
                        disabled={loading || !text}
                        className="brutal-btn w-full flex justify-center items-center gap-2 font-bold uppercase disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Process with AI'}
                    </button>
                    {error && <p className="text-red-600 font-bold bg-red-100 p-2 border-2 border-red-600">{error}</p>}
                </div>

                {extractedData && (
                    <div className="flex-1 border-2 border-black p-4 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Check className="text-green-600" /> Review Extracted Data
                        </h3>

                        <div className="space-y-4 max-h-[500px] overflow-auto pr-2">
                            <div>
                                <h4 className="font-bold underline">Authors ({extractedData.authors.length})</h4>
                                <ul className="list-disc pl-5 text-sm">
                                    {extractedData.authors.map((a: any, i: number) => (
                                        <li key={i}>{a.name} ({a.birth_year} - {a.death_year || '?'})</li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold underline">Entities ({extractedData.entities.length})</h4>
                                <ul className="list-disc pl-5 text-sm">
                                    {extractedData.entities.map((e: any, i: number) => (
                                        <li key={i}>
                                            <span className="font-bold">{e.title}</span> ({e.date_start})
                                            {e.author && <span className="text-xs font-bold text-gray-500 ml-2 uppercase">[{e.author}]</span>}
                                            <br />
                                            <span className="text-gray-600 text-xs">{e.description}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <button
                            onClick={handleCommit}
                            disabled={loading}
                            className="mt-6 w-full bg-black text-white p-3 font-bold uppercase hover:bg-gray-800 transition-colors flex justify-center items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Save to History</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddNotes;
