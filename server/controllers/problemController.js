const problemService = require('../services/problemService');
const catchAsync = require('../utils/catchAsync');

exports.getSimilarProblems = catchAsync(async (req, res, next) => {
  const { slug } = req.params;
  const result = await problemService.getSimilarProblems(slug);
  res.status(200).json(result);
});

exports.compareProblems = catchAsync(async (req, res, next) => {
  const { p1, p2 } = req.query;
  const result = await problemService.compareProblems(p1, p2);
  res.status(200).json(result);
});
