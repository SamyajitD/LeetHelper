const express = require('express');
const router = express.Router();
const problemController = require('../controllers/problemController');

const validate = require('../middleware/validate');

// Get similar problems
router.get('/problems/:slug/similar', problemController.getSimilarProblems);

// Compare two problems
router.get('/compare', validate('compare', 'query'), problemController.compareProblems);

module.exports = router;
