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
            <div className="absolute left-[59px] top-24 bottom-0 w-1 bg-black" />

            <div className="space-y-12">
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
                            className="relative flex items-start gap-8"
                        >
                            {/* Node on line */}
                            <div className="absolute left-[11px] top-2 w-4 h-4 bg-white border-4 border-black rounded-full z-10" />

                            {/* Date */}
                            <div className="w-24 text-right font-bold pt-1 shrink-0">
                                {date}
                            </div>

                            {/* Content Cards Column */}
                            <div className="flex-1 space-y-6">
                                {groupEntities.map((entity) => (
                                    <div
                                        key={entity.id}
                                        className={`
                                        p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                                        ${entity.type === 'WORK' ? 'bg-blue-50' : 'bg-red-50'}
                                    `}
                                    >
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-xl font-bold">{entity.title}</h3>
                                            <span className="text-xs font-bold border border-black px-1 uppercase bg-white">
                                                {entity.type}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm">{entity.description}</p>
                                        {entity.tags && (
                                            <div className="mt-3 flex gap-2 flex-wrap">
                                                {entity.tags.split(',').map((tag, i) => (
                                                    <span key={i} className="text-xs bg-black text-white px-2 py-1">
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
