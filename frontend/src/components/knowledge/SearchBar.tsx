import React, { useState } from 'react';
import { Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
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
        className="relative flex items-center rounded-xl border border-slate-800 bg-slate-900/80 p-1.5 shadow-lg backdrop-blur-md transition-all focus-within:border-cyan-500/50"
      >
        <div className="flex pl-3.5 pr-2 text-cyan-400">
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Semantic search across incident runbooks, security policies & procedures..."
          className="w-full bg-transparent px-2 py-2.5 text-sm font-medium text-slate-100 placeholder-slate-500 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="mr-2 rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`mr-2 flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-all ${
            showFilters
              ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
              : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filters</span>
        </button>
        <Button type="submit" variant="default" disabled={isLoading} className="h-10 px-4 text-xs font-bold">
          <Search className="mr-1.5 h-3.5 w-3.5" />
          {isLoading ? 'Searching...' : 'Vector Search'}
        </Button>
      </form>

      {showFilters && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-slate-300 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <label className="font-semibold text-slate-400">Min Cosine Similarity:</label>
            <div className="flex items-center gap-1.5">
              {[0.6, 0.75, 0.85, 0.9].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMinSimilarity(val)}
                  className={`rounded-lg border px-2.5 py-1 font-mono text-xs font-bold transition-all ${
                    minSimilarity === val
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {val * 100}%
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="font-semibold text-slate-400">Max Results (top_k):</label>
            <div className="flex items-center gap-1.5">
              {[3, 5, 10, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setTopK(num)}
                  className={`rounded-lg border px-2.5 py-1 font-mono text-xs font-bold transition-all ${
                    topK === num
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
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
