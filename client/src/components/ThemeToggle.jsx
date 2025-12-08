import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full transition-colors duration-200 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-yellow-500 dark:text-yellow-400"
      aria-label="Toggle Theme"
    >
      {theme === 'light' ? <FaMoon size={20} className="text-gray-800" /> : <FaSun size={20} />}
    </button>
  );
};

export default ThemeToggle;
