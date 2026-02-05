import React, { useState } from 'react';
import { Info, Plus, Minus, LucideIcon } from 'lucide-react';
import { ALL_CATEGORIES } from '@/lib/constants/defaultCategories';

interface GoalCardProps {
    title: string;
    icon: LucideIcon;
    helpText: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    detailsValue: string;
    onDetailsChange: (value: string) => void;
    detailsQuestion: string;
    detailsPlaceholder: string;
    isSelect?: boolean;
    options?: { label: string; value: string }[];
    isEditing: boolean;
}

export const GoalCard: React.FC<GoalCardProps> = ({
    title,
    icon: Icon,
    helpText,
    value,
    onChange,
    placeholder,
    detailsValue,
    onDetailsChange,
    detailsQuestion,
    detailsPlaceholder,
    isSelect = false,
    options = [],
    isEditing
}) => {
    const [showHelp, setShowHelp] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    // Initial check to show details if data exists
    React.useEffect(() => {
        if (detailsValue) setShowDetails(true);
    }, []);

    return (
        <div className="bg-[#1B4032] border border-[#A9D9C7] rounded-2xl p-5 transition-all">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-[#A9D9C7]" strokeWidth={1.5} />
                    <label className="text-lg font-semibold">{title}</label>
                </div>
                <button
                    onClick={() => setShowHelp(!showHelp)}
                    className={`transition-colors ${showHelp ? 'text-white' : 'text-[#A9D9C7] hover:text-white'}`}
                >
                    <Info className="w-5 h-5" strokeWidth={1.5} />
                </button>
            </div>

            {showHelp && (
                <p className="text-sm text-[#A9D9C7] mb-4 italic leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                    {helpText}
                </p>
            )}

            {/* Main Input Area */}
            {isEditing ? (
                isSelect ? (
                    <div className="relative">
                        <select
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-full appearance-none bg-[#1B4034] border border-[#A9D9C7]/30 rounded-xl p-3 text-white focus:outline-none focus:border-[#A9D9C7]"
                        >
                            <option value="" disabled>{placeholder}</option>
                            {ALL_CATEGORIES.map((item) => (
                                <option key={item.category} value={item.category}>
                                    {item.category}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#A9D9C7]">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </div>
                ) : (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-[#1B4034] border border-[#A9D9C7]/30 rounded-xl p-3 text-white placeholder-[#A9D9C7]/50 focus:outline-none focus:border-[#A9D9C7]"
                    />
                )
            ) : (
                <div className="w-full bg-[#1B4034]/20 border border-transparent rounded-xl p-3 text-white min-h-[48px] flex items-center">
                    {value ? (
                        <span className="font-medium">{value}</span>
                    ) : (
                        <span className="text-[#A9D9C7]/40 italic">Not set yet</span>
                    )}
                </div>
            )}

            {/* Details Section */}
            <div className="mt-3 flex flex-col gap-2">
                {/* Toggle Button: Always show in Edit Mode. In View Mode, only show if there are details. */}
                {(isEditing || detailsValue) && (
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="self-start text-xs text-[#A9D9C7] hover:text-white transition-colors font-medium flex items-center gap-1 mt-1"
                    >
                        {showDetails ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />} details
                    </button>
                )}

                {showDetails && (
                    <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                        <p className="text-xs text-[#A9D9C7] mb-2 font-medium">{detailsQuestion}</p>
                        {isEditing ? (
                            <textarea
                                value={detailsValue}
                                onChange={(e) => onDetailsChange(e.target.value)}
                                placeholder={detailsPlaceholder}
                                className="w-full bg-[#1B4034]/50 border border-[#A9D9C7]/20 rounded-lg p-3 text-sm text-white placeholder-[#A9D9C7]/40 focus:outline-none focus:border-[#A9D9C7]/50 min-h-[80px]"
                            />
                        ) : (
                            <div className="w-full bg-[#1B4034]/20 border border-transparent rounded-lg p-3 text-sm text-white/90 min-h-[60px] whitespace-pre-wrap">
                                {detailsValue || <span className="text-[#A9D9C7]/40 italic">No details added.</span>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
