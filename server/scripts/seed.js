const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');
const Problem = require('../models/Problem');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const LEETINFO_PATH = path.join(__dirname, '..', '..', 'public', 'Data_Set', 'leetinfo.csv');
const SIMILARITY_URL = process.env.SIMILARITY_DATA_URL || 'https://ulbgsvttyxeqwnev.public.blob.vercel-storage.com/similarities_with_scores-nYm33GWbVV85llXD4KBbZTGsU84LVs.csv';
const TEMP_SIMILARITY_PATH = path.join(__dirname, 'temp_similarities.csv');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/leethelper');

const cleanTag = (tag) => {
    return tag.replace(/^\[?\s*'?"?|'?"?\s*\]?$/g, '').trim().replace(/^['"]|['"]$/g, '');
};

const seedProblems = async () => {
  console.log('Seeding problems...');
  const problems = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(LEETINFO_PATH)
      .pipe(csv({ headers: false })) // headers are in first row but csv-parser treats them as data if not specified, wait. 
      // Actually leetinfo.csv has headers likely. detailed logic below.
      .on('data', (row) => {
        // row is object if headers=true (default checks first line). 
        // Let's check the file content again. It had headers.
        // But headers might be complex? "title,tags...". 
        // Let's trust csv-parser with auto headers or map manually.
        // Code in current process.js does manual split.
        // Let's rely on indices to be safe as row keys might vary.
        // Actually csv-parser output depends on options.
      })
      // RE-READING STRATEGY: 
      // The process.js manually parses: row ends with difficulty. row[0] is fileName.
      // row[1]...row[length-2] are tags.
      // Let's just read as array.
  });
};

// Re-implementing with stream for better control
const run = async () => {
    try {
        await Problem.deleteMany({});
        console.log('Cleared existing problems.');

        // 1. Load Problem Metadata (LeetInfo)
        console.log('Loading problem metadata...');
        const problemMap = new Map(); // slug -> { difficulty, tags }
        
        const leetInfoContent = fs.readFileSync(LEETINFO_PATH, 'utf-8');
        const lines = leetInfoContent.split('\n');
        // skip header
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const parts = line.split(','); 
            // Parsing tags is tricky with simple split if tags contain commas, but here they seem quoted like "['tag1', 'tag2']"?
            // process.js: "['Two Pointers', 'String']", "Easy"
            // The tags are spread across multiple 'csv' columns because of the commas inside the [] string being split by simple split?
            // process.js handles this by iterating i=1 to length-1.
            
            const slug = parts[0];
            const difficulty = parts[parts.length - 1];
            const tags = [];
            
            for(let j=1; j < parts.length - 1; j++) {
                let tag = parts[j];
                // Robust cleaning: remove all [, ], ', " from start and end, and extra spaces
                tag = tag.replace(/^[\[\]"'\s]+|[\[\]"'\s]+$/g, '').trim();
                if(tag) tags.push(tag);
            }
            
            problemMap.set(slug, {
                slug,
                difficulty,
                tags,
                similar: []
            });
        }
        console.log(`Loaded ${problemMap.size} problems metadata.`);

        // 2. Load Similarities
        console.log('Downloading similarity matrix (this may take a while)...');
        const writer = fs.createWriteStream(TEMP_SIMILARITY_PATH);
        const response = await axios({
            url: SIMILARITY_URL,
            method: 'GET',
            responseType: 'stream'
        });
        
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        console.log('Download complete. Parsing similarities...');

        let count = 0;
        await new Promise((resolve, reject) => {
            fs.createReadStream(TEMP_SIMILARITY_PATH)
                .pipe(csv())
                .on('data', (row) => {
                    // Row keys are filenames (slugs). key '0' or first col is the source slug usually?
                    // process.js: rows[0] is headers (slugs). row[0] is source slug.
                    // csv-parser uses first line as headers. So row object keys are the slogans.
                    // row['filename'] (if that's the header) -> but header is likely a slug?
                    // Let's verify process.js: "const headers = rows[0]; const fileIndex = headers.indexOf(fileName);"
                    // So headers ARE the slugs.
                    // The first column in body rows is ALSO the slug.
                    // format: ,slug1, slug2, ...
                    // row 1: slug1, score1_1, score1_2 ...
                    
                    // csv-parser will treat the header row as keys.
                    // The first key might be empty string if the CSV starts with a comma? 
                    // or "file" or similar.
                    // Let's assume the first column header implies "Source".
                    
                    // Actually, getting keys from row is safer.
                    const keys = Object.keys(row);
                    const sourceSlug = row[keys[0]]; // Value of first column
                    
                    if (problemMap.has(sourceSlug)) {
                        const similar = [];
                        // Iterate other keys
                        for (let k = 1; k < keys.length; k++) { // Skip first key (source)
                             const targetSlug = keys[k];
                             const score = parseFloat(row[targetSlug]);
                             if (score > 0.01 && targetSlug !== sourceSlug) { // Threshold to reduce DB size
                                 similar.push({ slug: targetSlug, score });
                             }
                        }
                        // Sort by score
                        similar.sort((a, b) => b.score - a.score);
                        // Take top 100
                        const topSimilar = similar.slice(0, 100);
                        
                        const problem = problemMap.get(sourceSlug);
                        problem.similar = topSimilar;
                        // title derived from slug usually?
                        problem.title = sourceSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '); 
                    }
                    count++;
                    if(count % 100 === 0) process.stdout.write('.');
                })
                .on('end', resolve)
                .on('error', reject);
        });
        
        console.log('\nSimilarities parsed. Saving to DB...');
        const problemsToSave = Array.from(problemMap.values());
        
        // Batch insert
        const CHUNK_SIZE = 500;
        for (let i = 0; i < problemsToSave.length; i += CHUNK_SIZE) {
            await Problem.insertMany(problemsToSave.slice(i, i + CHUNK_SIZE));
            process.stdout.write('*');
        }
        
        console.log('\nSeeding complete!');
        // cleanup
        fs.unlinkSync(TEMP_SIMILARITY_PATH);
        process.exit(0);

    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

run();
