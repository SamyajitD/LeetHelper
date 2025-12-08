import React, { useState } from 'react';
import axios from 'axios';

const ProblemComparator = () => {
  const [url1, setUrl1] = useState('');
  const [url2, setUrl2] = useState('');
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async (e) => {
    e.preventDefault();
    setLoading(true);
    setScore(null);
    try {
      const slug1 = url1.split('/').filter(part => part).pop();
      const slug2 = url2.split('/').filter(part => part).pop();
      
      if (!slug1 || !slug2) {
          alert('Invalid URLs');
          setLoading(false);
          return;
      }

      const response = await axios.get(`${import.meta.env.NODE_BACKEND_API}/api/compare?p1=${slug1}&p2=${slug2}`);
      setScore(response.data.score);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error comparing problems or problem not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-text-main">Problem Comparator</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Compare similarity between two LeetCode problems.
        </p>
      </div>
      <form onSubmit={handleCompare} className="flex flex-col gap-8 mt-4">
        <div className="relative w-full group">
            <input
            id="p1-input"
            value={url1}
            onChange={(e) => setUrl1(e.target.value)}
            className="peer flex h-14 w-full bg-transparent border-b-2 border-gray-300 dark:border-gray-600 px-1 py-2 text-lg outline-none focus:border-primary transition-all text-text-main placeholder-transparent"
            placeholder="First URL"
            type="text"
            required
            />
            <label className="absolute left-1 -top-5 text-sm text-primary transition-all 
                              peer-placeholder-shown:top-4 peer-placeholder-shown:text-lg peer-placeholder-shown:text-gray-500
                              peer-focus:-top-5 peer-focus:text-sm peer-focus:text-primary pointer-events-none">
                First LeetCode URL
            </label>
        </div>
        
        <div className="relative w-full group">
            <input
            id="p2-input"
            value={url2}
            onChange={(e) => setUrl2(e.target.value)}
            className="peer flex h-14 w-full bg-transparent border-b-2 border-gray-300 dark:border-gray-600 px-1 py-2 text-lg outline-none focus:border-primary transition-all text-text-main placeholder-transparent"
            placeholder="Second URL"
            type="text"
            required
            />
             <label className="absolute left-1 -top-5 text-sm text-primary transition-all 
                              peer-placeholder-shown:top-4 peer-placeholder-shown:text-lg peer-placeholder-shown:text-gray-500
                              peer-focus:-top-5 peer-focus:text-sm peer-focus:text-primary pointer-events-none">
                Second LeetCode URL
            </label>
        </div>

        <button
          type="submit"
          className="w-full h-12 rounded-full bg-primary text-white font-bold 
                     transition-transform duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 elevation-1 tracking-wider"
        >
          COMPARE PROBLEMS
        </button>
      </form>

      {score !== null && (
        <div className="flex flex-col items-center justify-center mt-4 p-8 bg-surface-light dark:bg-surface-dark rounded-xl elevation-3 border border-gray-100 dark:border-gray-800 text-center animate-fadeIn">
            <span className="text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider mb-2">Similarity Score</span>
            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                {(score * 100).toFixed(1)}%
            </span>
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center items-center mt-8">
             <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-secondary border-opacity-30">
                <div className="rounded-full h-8 w-8 border-t-4 border-secondary animate-spin absolute top-[-4px] left-[-4px]"></div>
             </div>
        </div>
      )}
    </div>
  );
};

export default ProblemComparator;
