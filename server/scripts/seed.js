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
      .pipe(csv({ headers: false })) // Headers handled manually
      .on('data', () => {}); // No-op, just verifying stream functionality if needed
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
            // Parse tags from CSV columns (variable length between slug and difficulty)
            
            const slug = parts[0];
            const difficulty = parts[parts.length - 1];
            const tags = [];
            
            for(let j=1; j < parts.length - 1; j++) {
                let tag = parts[j];
                // Clean tag string: remove brackets, quotes, and whitespace
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
                    // First column is the source slug (key), subsequent columns are target slugs/scores
                    const keys = Object.keys(row);
                    const sourceSlug = row[keys[0]];
                    
                    if (problemMap.has(sourceSlug)) {
                        const similar = [];
                        // Iterate through similarity scores
                        for (let k = 1; k < keys.length; k++) { 
                             const targetSlug = keys[k];
                             const score = parseFloat(row[targetSlug]);
                             if (score > 0.01 && targetSlug !== sourceSlug) { 
                                 similar.push({ slug: targetSlug, score });
                             }
                        }
                        
                        similar.sort((a, b) => b.score - a.score);
                        const topSimilar = similar.slice(0, 100);
                        
                        const problem = problemMap.get(sourceSlug);
                        problem.similar = topSimilar;
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
