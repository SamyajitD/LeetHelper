import React, { useState } from 'react';
import axios from 'axios';

const ProblemFinder = () => {
  const [url, setUrl] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const resultsPerPage = 10;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResults([]);
    setPage(1);

    try {
      const slug = url.split('/').filter(part => part).pop();
      if (!slug) {
          alert('Invalid URL');
          setLoading(false);
          return;
      }
      
      const response = await axios.get(`${import.meta.env.NODE_BACKEND_API}/api/problems/${slug}/similar`);
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error fetching data or problem not found');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(results.length / resultsPerPage);
  const currentResults = results.slice((page - 1) * resultsPerPage, page * resultsPerPage);

  const difficultyColors = {
    'Easy': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-700',
    'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-700',
    'Hard': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-100 dark:border-red-700',
    'Unknown': 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500'
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-3xl font-bold text-text-main">Problem Suggestions</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Enter a LeetCode problem URL to find similar problems.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-center gap-6 mt-6">
        <div className="relative w-full flex-1 group">
            <input
            id="problem-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="peer flex h-14 w-full bg-transparent border-b-2 border-gray-300 dark:border-gray-600 px-1 py-2 text-lg outline-none focus:border-primary transition-all text-text-main placeholder-transparent"
            placeholder="LeetCode URL"
            type="text"
            required
            />
            <label className="absolute left-1 -top-5 text-sm text-primary transition-all 
                              peer-placeholder-shown:top-4 peer-placeholder-shown:text-lg peer-placeholder-shown:text-gray-500 
                              peer-focus:-top-5 peer-focus:text-sm peer-focus:text-primary pointer-events-none">
                LeetCode URL
            </label>
        </div>
        
        <button
          type="submit"
          className="w-full md:w-auto h-12 rounded-full bg-primary text-white font-bold px-10 
                     transition-transform duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 elevation-1"
        >
          FIND
        </button>
      </form>

      {loading && (
        <div className="flex justify-center items-center mt-12">
             <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary border-opacity-30">
                <div className="rounded-full h-12 w-12 border-t-4 border-primary animate-spin absolute top-[-4px] left-[-4px]"></div>
             </div>
             <span className="ml-6 text-text-main font-medium tracking-wide animate-pulse">Analyzing...</span>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4 animate-fadeIn">
            <div className="overflow-x-auto rounded-lg elevation-1 bg-surface-light dark:bg-surface-dark">
                <table className="w-full table-auto">
                    <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Problem Title</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Similarity</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Topics</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Difficulty</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {currentResults.map((result, idx) => (
                        <tr key={idx} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                        <td className="px-6 py-4 text-sm font-medium">
                            <a href={`https://leetcode.com/problems/${result.slug}/`} target="_blank" rel="noreferrer" className="text-text-main group-hover:text-black dark:group-hover:text-white hover:text-primary hover:underline decoration-2 transition-colors">
                            {result.title || result.slug}
                            </a>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold force-contrast-text">{(result.score * 100).toFixed(1)}%</td>
                        <td className="px-6 py-4 text-sm">
                            <div className="flex flex-wrap gap-2">
                            {result.tags && result.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="inline-flex items-center text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full px-3 py-1">
                                {tag}
                            </span>
                            ))}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                            <span className={`inline-flex items-center border text-xs font-bold rounded px-2 py-1 uppercase ${difficultyColors[result.difficulty] || difficultyColors['Unknown']}`}>
                            {result.difficulty}
                            </span>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            
            <div className="flex justify-center gap-4 mt-6">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                    Previous
                </button>
                <span className="self-center text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
                <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                    Next
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ProblemFinder;
