document.getElementById('similarity-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    const url = document.getElementById('leetcode-url').value;
    const fileName = url.split('/').slice(-2, -1)[0];

    document.getElementById('loading-spinner').classList.remove('hidden');

    const response = await fetch('../Data_Set/similarities_with_scores.csv');
    if (!response.ok) {
        console.error('Failed to fetch data:', response.status);
        return;
    }
    const data = await response.text();
    const rows = data.split('\n').map(row => row.split(','));
    const headers = rows[0];
    const fileIndex = headers.indexOf(fileName);

    if (fileIndex === -1) {
        alert('File name not found in the CSV data.');
        document.getElementById('loading-spinner').classList.add('hidden');
        return;
    }

    const similarities = rows.slice(1).map(row => ({
        fileName: row[0],
        score: parseFloat(row[fileIndex])
    })).sort((a, b) => b.score - a.score).slice(1);

    const tagsResponse = await fetch('../Data_Set/leetinfo.csv');
    const tagsData = await tagsResponse.text();
    const tagsRows = tagsData.split('\n').map(row => row.split(','));
    const tagsMap = new Map(tagsRows.slice(1).map(row => {
        let tags = [];
        for (let i = 1; i < row.length - 1; i++) {
            let tag = row[i].trim();
            if (i === 1) {
                tag = tag.replace(/^\[\s*'/, '');
            }
            if (i === row.length - 2) {
                tag = tag.replace(/'\s*\]$/, '');
            }
            tag = tag.replace(/^'/, '').replace(/'$/, '');
            if (tag) {
                tags.push(tag);
            }
        }
        return [row[0], tags];
    }));
    const difficultyMap = new Map(tagsRows.slice(1).map(row => [row[0], row[row.length - 1]]));
    let currentPage = 1;
    const resultsPerPage = 10;
    const totalPages = Math.ceil(similarities.length / resultsPerPage);

    function renderPage(page) {
        const resultsTable = document.getElementById('results-table');
        resultsTable.innerHTML = '';

        const start = (page - 1) * resultsPerPage;
        const end = start + resultsPerPage;
        const pageResults = similarities.slice(start, end);

        pageResults.forEach(similarity => {
            const difficulty = difficultyMap.get(similarity.fileName) || 'Unknown';
            if (difficulty === 'N/A') {
                return;
            }

            const row = document.createElement('tr');
            row.style.backgroundColor = '#F4DFC8';
            row.classList.add('hover:bg-gray-100', 'dark:bg-gray-700', 'dark:hover:bg-gray-600');

            const titleCell = document.createElement('td');
            titleCell.classList.add('px-4', 'py-3', 'text-sm', 'text-gray-900', 'dark:text-gray-200');
            const link = document.createElement('a');
            link.href = `https://leetcode.com/problems/${similarity.fileName}/`;
            link.textContent = similarity.fileName.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
            link.classList.add('text-blue-500', 'hover:underline'); // Make the link blue and underline on hover
            titleCell.appendChild(link);

            const scoreCell = document.createElement('td');
            scoreCell.classList.add('px-4', 'py-3', 'text-sm', 'text-gray-900', 'dark:text-gray-200');
            scoreCell.textContent = similarity.score.toFixed(2);

            const topicsCell = document.createElement('td');
            topicsCell.classList.add('px-4', 'py-3', 'text-sm', 'text-gray-900', 'dark:text-gray-200');
            const tags = tagsMap.get(similarity.fileName) || [];
            if (tags.length > 0) {
                tags[0] = tags[0].replace(/^\\?"\['/, '');
                tags[tags.length - 1] = tags[tags.length - 1].replace(/'\]\"$/, '');
            }
            tags.forEach(tag => {
                const tagDiv = document.createElement('div');
                tagDiv.classList.add('inline-flex', 'w-fit', 'items-center', 'whitespace-nowrap', 'border', 'text-xs', 'font-semibold', 'transition-colors', 'focus:outline-none', 'focus:ring-2', 'focus:ring-ring', 'focus:ring-offset-2', 'border-gray-300', 'bg-gray-100', 'text-gray-800', 'hover:bg-gray-200', 'rounded-md', 'px-2', 'py-1', 'm-1'); // Added 'm-1' for margin
                tagDiv.textContent = tag;
                topicsCell.appendChild(tagDiv);
            });

            const difficultyCell = document.createElement('td');
            difficultyCell.classList.add('px-4', 'py-3', 'text-sm', 'text-gray-900', 'dark:text-gray-200');
            difficultyCell.textContent = difficulty;

            const difficultyColors = {
                'Easy': 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
                'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200',
                'Hard': 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200',
                'Unknown': 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
            };
            const difficultyClass = difficultyColors[difficulty] || difficultyColors['Unknown'];
            difficultyCell.classList.add('inline-flex', 'w-fit', 'items-center', 'whitespace-nowrap', 'border', 'text-xs', 'font-semibold', 'transition-colors', 'focus:outline-none', 'focus:ring-2', 'focus:ring-ring', 'focus:ring-offset-2', 'rounded-md', 'px-2', 'py-1', 'm-1', ...difficultyClass.split(' '));

            row.appendChild(titleCell);
            row.appendChild(scoreCell);
            row.appendChild(topicsCell);
            row.appendChild(difficultyCell);

            resultsTable.appendChild(row);
        });

        document.getElementById('prev-page').disabled = page === 1;
        document.getElementById('next-page').disabled = page === totalPages;
    }

    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderPage(currentPage);
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderPage(currentPage);
        }
    });

    renderPage(currentPage);

    document.getElementById('loading-spinner').classList.add('hidden');
});

document.getElementById('comparison-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    const url1 = document.getElementById('leetcode-url-1').value;
    const url2 = document.getElementById('leetcode-url-2').value;
    const fileName1 = url1.split('/').slice(-2, -1)[0];
    const fileName2 = url2.split('/').slice(-2, -1)[0];

    const response = await fetch('../Data_Set/similarities_with_scores.csv');
    const data = await response.text();
    const rows = data.split('\n').map(row => row.split(','));
    const headers = rows[0];
    const fileIndex1 = headers.indexOf(fileName1);
    const fileIndex2 = headers.indexOf(fileName2);

    if (fileIndex1 === -1 || fileIndex2 === -1) {
        alert('One or both file names not found in the CSV data.');
        return;
    }

    const similarityScore = parseFloat(rows.find(row => row[0] === fileName1)[fileIndex2]).toFixed(2);
    document.getElementById('similarity-score').textContent = similarityScore;
    document.getElementById('comparison-result').classList.remove('hidden');
});

document.getElementById('show-finder').addEventListener('click', () => {
    document.getElementById('problem-finder').classList.remove('hidden');
    document.getElementById('problem-comparator').classList.add('hidden');
});

document.getElementById('show-comparator').addEventListener('click', () => {
    document.getElementById('problem-finder').classList.add('hidden');
    document.getElementById('problem-comparator').classList.remove('hidden');
});
