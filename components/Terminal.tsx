import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FSNode, FSType } from '../types';

interface TerminalProps {
  lines: React.ReactNode[];
  history: string[];
  onCommand: (command: string) => void;
  prompt: string;
  getCompletions: (text: string) => FSNode[];
}

export const Terminal: React.FC<TerminalProps> = ({ lines, history, onCommand, prompt, getCompletions }) => {
  const [inputValue, setInputValue] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [completion, setCompletion] = useState<{
    originalParts: string[];
    matches: FSNode[];
    index: number;
  } | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [lines]);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onCommand(inputValue);
      setInputValue('');
      setHistoryIndex(-1);
      setCompletion(null);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCompletion(null);
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInputValue(history[newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCompletion(null);
      if (historyIndex !== -1) {
        if (historyIndex === history.length - 1) {
          setHistoryIndex(-1);
          setInputValue('');
        } else {
          const newIndex = Math.min(history.length - 1, historyIndex + 1);
          setHistoryIndex(newIndex);
          setInputValue(history[newIndex] || '');
        }
      }
    } else if (e.key === 'Tab') {
        e.preventDefault();

        if (completion && completion.matches.length > 0) {
            const nextIndex = (completion.index + 1) % completion.matches.length;
            const nextMatch = completion.matches[nextIndex];
            
            const newInputValue = [...completion.originalParts, nextMatch.name].join(' ');
            setInputValue(newInputValue);
            setCompletion({ ...completion, index: nextIndex });
        } else {
            const parts = inputValue.split(' ');
            const tokenToComplete = parts[parts.length - 1];
            const originalParts = parts.slice(0, -1);

            const matches = getCompletions(tokenToComplete);

            if (matches.length > 0) {
                if (matches.length === 1) {
                    const match = matches[0];
                    const completedName = match.type === FSType.DIRECTORY ? `${match.name}\\` : match.name;
                    const newInputValue = [...originalParts, completedName].join(' ');
                    setInputValue(newInputValue);
                    setCompletion(null);
                } else {
                    const firstMatch = matches[0];
                    const newInputValue = [...originalParts, firstMatch.name].join(' ');
                    setInputValue(newInputValue);
                    setCompletion({
                        originalParts,
                        matches,
                        index: 0,
                    });
                }
            }
        }
    }
  };
  
  return (
    <div className="h-full overflow-y-auto" onClick={focusInput}>
      {lines.map((line, index) => (
        <div key={index}>{line}</div>
      ))}

      <div className="flex items-center">
        <span className="text-gray-300">{prompt}</span>
        <div className="relative flex-grow">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
                setInputValue(e.target.value);
                setCompletion(null);
            }}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none outline-none text-gray-300 w-full pl-1"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          <span
            className="absolute top-0 left-0 h-full w-[8px] cursor-blink"
            style={{ transform: `translateX(${inputValue.length * 8.4}px)` }}
          ></span>
        </div>
      </div>
      <div ref={scrollRef} />
    </div>
  );
};
