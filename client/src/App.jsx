import React, { useState } from 'react';
import ProblemFinder from './components/ProblemFinder';
import ProblemComparator from './components/ProblemComparator';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import './index.css';

function AppContent() {
  const [view, setView] = useState('finder'); // finder | comparator

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-black dark:text-white transition-colors duration-300">
      <div className="w-full max-w-4xl mx-auto px-4 py-8 md:px-6 md:py-12">
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                LeetHelper
            </h1>
            <ThemeToggle />
        </header>

        <nav className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setView('finder')}
            className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
              view === 'finder' 
                ? 'bg-primary text-white elevation-3 scale-105' 
                : 'bg-transparent text-text-main border border-border hover:bg-surface hover:elevation-1'
            }`}
          >
            Suggestions
          </button>
          <button
            onClick={() => setView('comparator')}
             className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
              view === 'comparator' 
                ? 'bg-primary text-white elevation-3 scale-105' 
                : 'bg-transparent text-text-main border border-border hover:bg-surface hover:elevation-1'
            }`}
          >
            Comparator
          </button>
        </nav>

        <main className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 elevation-1 transition-colors duration-300">
            {view === 'finder' ? <ProblemFinder /> : <ProblemComparator />}
        </main>
      </div>
    </div>
  );
}

function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}

export default App;
