const Problem = require('../models/Problem');
const AppError = require('../utils/AppError');

class ProblemService {
  async getSimilarProblems(slug) {
    const problem = await Problem.findOne({ slug });
    
    if (!problem) {
      throw new AppError('Problem not found', 404);
    }

    const similarSlugs = problem.similar.map(s => s.slug);
    // Fetch details for all similar problems in one query
    const similarProblemsDetails = await Problem.find({ slug: { $in: similarSlugs } });
    
    // Map details back to the score structure
    const result = problem.similar.map(sim => {
      const detail = similarProblemsDetails.find(p => p.slug === sim.slug);
      if (!detail) return null;
      return {
        slug: sim.slug,
        score: sim.score,
        title: detail.title,
        difficulty: detail.difficulty,
        tags: detail.tags
      };
    }).filter(Boolean);
    
    return result;
  }

  async compareProblems(p1, p2) {
    if (!p1 || !p2) {
        throw new AppError('Missing parameters p1 and p2', 400);
    }

    const problem1 = await Problem.findOne({ slug: p1 });
    if (!problem1) {
       throw new AppError('Problem 1 not found', 404);
    }
    
    const match = problem1.similar.find(s => s.slug === p2);
    
    if (match) {
        return { score: match.score };
    } else {
        // Reverse check
        const problem2 = await Problem.findOne({ slug: p2 });
        if(!problem2) {
             throw new AppError('Problem 2 not found', 404);
        }
        const match2 = problem2.similar.find(s => s.slug === p1);
        if (match2) {
            return { score: match2.score };
        } else {
            return { score: 0 };
        }
    }
  }
}

module.exports = new ProblemService();
