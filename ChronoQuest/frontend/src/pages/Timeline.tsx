import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

interface Entity {
    id: number;
    title: string;
    date_start: string;
    description: string;
    type: 'WORK' | 'EVENT';
    tags: string;
}

const Timeline: React.FC = () => {
    const [entities, setEntities] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/timeline')
            .then(res => setEntities(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-10 font-bold text-xl">Loading Timeline...</div>;

    return (
        <div className="relative min-h-screen pl-10 py-10">
            <h2 className="text-4xl font-black uppercase mb-10">Timeline</h2>

            {/* Vertical Line */}
            <div className="absolute left-[120px] top-24 bottom-0 w-1 bg-black" />

            <div className="space-y-16">
                {Object.entries(entities.reduce((acc, entity) => {
                    const date = entity.date_start || 'Unknown Date';
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(entity);
                    return acc;
                }, {} as Record<string, Entity[]>))
                    .sort(([dateA], [dateB]) => {
                        if (dateA === 'Unknown Date') return 1;
                        if (dateB === 'Unknown Date') return -1;
                        return new Date(dateA).getTime() - new Date(dateB).getTime();
                    })
                    .map(([date, groupEntities], groupIndex) => (
                        <motion.div
                            key={date}
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: groupIndex * 0.1 }}
                            className="relative flex items-start gap-12"
                        >
                            {/* Date Label */}
                            <div className="w-24 text-right pt-1 shrink-0 z-20">
                                <span className="font-black text-lg bg-white pr-2 relative">
                                    {date}
                                </span>
                            </div>

                            {/* Node on line - Centered on the line at left-[120px] */}
                            {/* Line is at 120px. Node is 16px wide. Center is 120 + 2 (half line width) = 122px center. */}
                            {/* Node left should be 122 - 8 = 114px */}
                            <div className="absolute left-[114px] top-2 w-4 h-4 bg-white border-4 border-black rounded-full z-10" />

                            {/* Content Cards Column */}
                            <div className="flex-1 space-y-6 pt-1">
                                {groupEntities.map((entity) => (
                                    <div
                                        key={entity.id}
                                        className={`
                                        p-6 border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                                        transition-transform hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]
                                        ${entity.type === 'WORK' ? 'bg-blue-50' : 'bg-red-50'}
                                    `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-2xl font-black font-serif">{entity.title}</h3>
                                            <span className="text-xs font-bold border-2 border-black px-2 py-1 uppercase bg-white tracking-wider">
                                                {entity.type}
                                            </span>
                                        </div>
                                        <p className="text-gray-800 leading-relaxed">{entity.description}</p>
                                        {entity.tags && (
                                            <div className="mt-4 flex gap-2 flex-wrap">
                                                {entity.tags.split(',').map((tag, i) => (
                                                    <span key={i} className="text-xs font-bold bg-black text-white px-3 py-1 rounded-full">
                                                        #{tag.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
            </div>
        </div>
    );
};

export default Timeline;
