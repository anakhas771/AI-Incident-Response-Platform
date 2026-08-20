import React, { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface SearchBarProps {
  onSearch: (query: string, minSimilarity: number, topK: number) => void;
  isLoading?: boolean;
  initialQuery?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  isLoading = false,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [minSimilarity, setMinSimilarity] = useState(0.75);
  const [topK, setTopK] = useState(5);
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim(), minSimilarity, topK);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('', minSimilarity, topK);
  };

  return (
    <div className="space-y-3">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-b border-slate-700 bg-slate-950/50 py-2.5 transition-colors focus-within:border-slate-500"
      >
        <Search className="ml-1 h-5 w-5 shrink-0 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search policies, runbooks, incidents, and procedures…"
          className="min-w-0 flex-1 bg-transparent px-1 text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="rounded-md p-1.5 text-slate-600 transition-colors hover:bg-slate-900 hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
            showFilters
              ? 'bg-slate-800 text-slate-100'
              : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
        </button>
        <Button
          type="submit"
          variant="default"
          disabled={isLoading}
          className="h-9 px-3.5 text-xs font-medium"
        >
          {isLoading ? 'Searching…' : 'Search'}
        </Button>
      </form>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-slate-800 pb-3 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <label className="text-slate-500">Similarity</label>
            <div className="flex items-center gap-1">
              {[0.6, 0.75, 0.85, 0.9].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMinSimilarity(val)}
                  className={`rounded-md px-2 py-1 font-mono transition-colors ${
                    minSimilarity === val
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'
                  }`}
                >
                  {val * 100}%
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-slate-500">Results</label>
            <div className="flex items-center gap-1">
              {[3, 5, 10, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setTopK(num)}
                  className={`rounded-md px-2 py-1 font-mono transition-colors ${
                    topK === num
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
