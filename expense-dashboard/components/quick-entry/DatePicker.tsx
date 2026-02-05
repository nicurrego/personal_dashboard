'use client';

import React from 'react';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = value.toDateString() === today.toDateString();
  const isYesterday = value.toDateString() === yesterday.toDateString();

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value + 'T00:00:00');
    onChange(newDate);
  };

  // Format for input value
  const inputValue = value.toISOString().split('T')[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Quick date buttons - WHITE text on colored background */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => onChange(today)}
          className={`
            px-6 py-3 rounded-2xl font-semibold transition-all duration-200 border
            ${isToday
              ? 'bg-[#A9D9C7] border-[#A9D9C7] text-[#1B4034]'
              : 'bg-white/5 border-white/10 text-secondary-text hover:bg-white/10 hover:border-white/20'}
          `}
        >
          Today {isToday && '✓'}
        </button>
        <button
          onClick={() => onChange(yesterday)}
          className={`
            px-6 py-3 rounded-2xl font-semibold transition-all duration-200 border
            ${isYesterday
              ? 'bg-[#A9D9C7] border-[#A9D9C7] text-[#1B4034]'
              : 'bg-white/5 border-white/10 text-secondary-text hover:bg-white/10 hover:border-white/20'}
          `}
        >
          Yesterday {isYesterday && '✓'}
        </button>
      </div>

      {/* Selected date display */}
      <div className="text-center">
        <span className="text-3xl font-bold text-white">
          {formatDate(value)}
        </span>
      </div>

      {/* Native date picker (styled) */}
      <div className="flex justify-center">
        <label className="relative cursor-pointer">
          <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/15
                          text-secondary-text text-sm hover:bg-white/10 hover:border-white/25 
                          transition-colors flex items-center gap-2">
            Pick different date
          </span>
          <input
            type="date"
            value={inputValue}
            onChange={handleDateChange}
            max={today.toISOString().split('T')[0]}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}
