const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: String,
  difficulty: String,
  tags: [String],
  similar: [
    {
      slug: String,
      score: Number
    }
  ]
});

module.exports = mongoose.model('Problem', problemSchema);
