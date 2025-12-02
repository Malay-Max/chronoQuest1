import React, { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';

interface Entity {
    id: number;
    title: string;
    date_start: string;
    description: string;
    type: 'WORK' | 'EVENT';
    tags: string;
    author_name?: string;
}

const Timeline: React.FC = () => {
    const [entities, setEntities] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

    // Refs to track date elements
    const dateRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        axios.get('/api/timeline')
            .then(res => setEntities(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    // Extract unique authors
    const availableAuthors = useMemo(() => {
        const authors = new Set<string>();
        entities.forEach(e => {
            if (e.author_name) authors.add(e.author_name);
        });
        return Array.from(authors).sort();
    }, [entities]);

    // Memoize grouped entities to avoid recalculating on every render
    const groupedEntities = useMemo(() => {
        // Filter entities first
        const filtered = entities.filter(e => {
            // Author Filter
            if (selectedAuthors.length > 0) {
                if (!e.author_name || !selectedAuthors.includes(e.author_name)) return false;
            }
            // Tag Filter
            if (selectedTags.length > 0) {
                if (!e.tags) return false;
                const entityTags = e.tags.split(',').map(t => t.trim());
                // Check if entity has ALL selected tags
                const hasAllTags = selectedTags.every(tag => entityTags.includes(tag));
                if (!hasAllTags) return false;
            }
            return true;
        });

        return Object.entries(filtered.reduce((acc, entity) => {
            const date = entity.date_start || 'Unknown Date';
            if (!acc[date]) acc[date] = [];
            acc[date].push(entity);
            return acc;
        }, {} as Record<string, Entity[]>))
            .sort(([dateA], [dateB]) => {
                if (dateA === 'Unknown Date') return 1;
                if (dateB === 'Unknown Date') return -1;
                return new Date(dateA).getTime() - new Date(dateB).getTime();
            });
    }, [entities, selectedAuthors, selectedTags]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        // Try to find exact match
        if (dateRefs.current[searchQuery]) {
            dateRefs.current[searchQuery]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            alert(`Date "${searchQuery}" not found on timeline.`);
        }
    };

    const toggleAuthor = (author: string) => {
        setSelectedAuthors(prev =>
            prev.includes(author)
                ? prev.filter(a => a !== author)
                : [...prev, author]
        );
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const toggleDate = (date: string) => {
        setExpandedDates(prev => ({
            ...prev,
            [date]: !prev[date]
        }));
    };

    if (loading) return <div className="p-10 font-bold text-xl">Loading Timeline...</div>;

    return (
        <div className="relative min-h-screen py-6 md:py-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pl-4 pr-4 md:pl-10 md:pr-10">
                <h2 className="text-2xl md:text-4xl font-black uppercase mb-4 md:mb-0">Timeline</h2>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 md:flex-none border-2 border-black p-2 font-mono text-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                    />
                    <button
                        type="submit"
                        className="bg-black text-white p-2 border-2 border-black hover:bg-gray-800 transition-colors"
                    >
                        <Search size={20} />
                    </button>
                </form>
            </div>

            {/* Filters Section */}
            <div className="px-4 md:px-10 mb-10 space-y-4">
                {/* Author Filter */}
                {availableAuthors.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="font-bold uppercase text-xs tracking-wider mr-2">Filter by Author:</span>
                        {availableAuthors.map(author => (
                            <button
                                key={author}
                                onClick={() => toggleAuthor(author)}
                                className={`
                                    px-3 py-1 text-xs font-bold uppercase border-2 border-black rounded-full transition-all
                                    ${selectedAuthors.includes(author)
                                        ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]'
                                        : 'bg-white text-black hover:bg-gray-100'
                                    }
                                `}
                            >
                                {author}
                            </button>
                        ))}
                    </div>
                )}

                {/* Active Tag Filters */}
                {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="font-bold uppercase text-xs tracking-wider mr-2">Active Tags:</span>
                        {selectedTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className="px-3 py-1 text-xs font-bold bg-black text-white border-2 border-black rounded-full flex items-center gap-1 hover:bg-gray-800"
                            >
                                #{tag} <span className="text-gray-400">x</span>
                            </button>
                        ))}
                        <button
                            onClick={() => setSelectedTags([])}
                            className="px-3 py-1 text-xs font-bold uppercase border-2 border-red-600 text-red-600 rounded-full hover:bg-red-50 ml-2"
                        >
                            Clear Tags
                        </button>
                    </div>
                )}

                {(selectedAuthors.length > 0 || selectedTags.length > 0) && (
                    <div className="border-t-2 border-gray-200 w-full my-2"></div>
                )}
            </div>

            {/* Vertical Line */}
            {/* Mobile: left-20px, Desktop: left-40px */}
            <div className="absolute left-[20px] md:left-[40px] top-48 bottom-0 w-[4px] bg-black" />

            <div className="space-y-12 md:space-y-16">
                {groupedEntities.map(([date, groupEntities], groupIndex) => {
                    const isCollapsible = groupEntities.length > 2;
                    const isExpanded = expandedDates[date];

                    return (
                        <motion.div
                            key={date}
                            ref={(el) => {
                                if (el) dateRefs.current[date] = el;
                            }}
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: groupIndex * 0.1 }}
                            // Mobile: pl-50px, Desktop: pl-80px
                            className="relative pl-[50px] md:pl-[80px]"
                        >
                            {/* Node on line */}
                            {/* Mobile: Line at 20px, center 22px. Node w-4 (16px). Left = 22-8 = 14px */}
                            {/* Desktop: Line at 40px, center 42px. Node w-4 (16px). Left = 42-8 = 34px */}
                            <div className="absolute left-[14px] md:left-[34px] top-2 w-4 h-4 bg-white border-4 border-black rounded-full z-10" />

                            {/* Date Label */}
                            <div
                                className={`mb-4 md:mb-6 ${isCollapsible ? 'cursor-pointer flex items-center gap-2 group' : ''}`}
                                onClick={() => isCollapsible && toggleDate(date)}
                            >
                                <span className="text-xl md:text-3xl font-black font-serif bg-white pr-4">
                                    {date}
                                </span>
                                {isCollapsible && (
                                    <div className="flex items-center gap-1 text-sm font-bold text-gray-500 group-hover:text-black transition-colors bg-white pr-2">
                                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        <span className="uppercase tracking-wider">{groupEntities.length} items</span>
                                    </div>
                                )}
                            </div>

                            {/* Content Cards Column */}
                            <div className="space-y-6 md:space-y-8">
                                {(!isCollapsible || isExpanded) && groupEntities.map((entity) => (
                                    <div
                                        key={entity.id}
                                        className={`
                                        relative p-4 md:p-6 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                                        transition-transform hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]
                                        ${entity.type === 'WORK' ? 'bg-blue-50' : 'bg-red-50'}
                                    `}
                                    >
                                        <div className="flex flex-col md:flex-row justify-between items-start mb-2 md:mb-1 gap-2">
                                            <h3 className="text-xl md:text-2xl font-black font-serif leading-tight">{entity.title}</h3>
                                            <span className="text-[10px] md:text-xs font-bold border-2 border-black px-2 py-1 uppercase bg-white tracking-wider shrink-0">
                                                {entity.type}
                                            </span>
                                        </div>

                                        {entity.author_name && (
                                            <div className="text-xs md:text-sm font-bold text-gray-600 mb-2 md:mb-3 uppercase tracking-widest">
                                                {entity.author_name}
                                            </div>
                                        )}

                                        <p className="text-gray-800 leading-relaxed text-base md:text-lg">{entity.description}</p>
                                        {entity.tags && (
                                            <div className="mt-4 flex gap-2 flex-wrap">
                                                {entity.tags.split(',').map((tag, i) => {
                                                    const cleanTag = tag.trim();
                                                    const isSelected = selectedTags.includes(cleanTag);
                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={() => toggleTag(cleanTag)}
                                                            className={`
                                                                text-[10px] md:text-xs font-bold px-3 py-1 rounded-full transition-all border-2 border-black
                                                                ${isSelected
                                                                    ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]'
                                                                    : 'bg-white text-black hover:bg-gray-100 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                                                }
                                                            `}
                                                        >
                                                            #{cleanTag}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default Timeline;
