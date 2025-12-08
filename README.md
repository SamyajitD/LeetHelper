# LeetHelper

LeetHelper is a MERN stack application designed to help LeetCode users find similar problems to practice efficiently. By inputting a problem URL, users can discover related questions to reinforce their understanding of specific patterns and algorithms.

## Features

- **Problem Finder**: Find similar problems based on a source problem URL.
- **Problem Comparator**: Compare the similarity score between two specific problems.
- **LeetCode Theme**: Styled to match the familiar LeetCode aesthetic.
- **Similarity Engine**: Uses pre-calculated cosine similarity scores on problem descriptions and tags.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Services**: Render (Backend), Vercel (Frontend), MongoDB Atlas (Database)

## Prerequisites

- Node.js (v16+)
- MongoDB (Local or Atlas)

The code used to generate the vector embdeddings data can be found in Generate_Data_Set folder

To download all the required data set follow this link: https://drive.google.com/drive/u/0/folders/19DUi5YcB91sNnBjGnK9rxxtT09MltYcp
