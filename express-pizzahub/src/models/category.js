const { mongoose } = require('../db');

const CategorySchema = new mongoose.Schema(
  {
    CategoryID: { type: Number, required: true, unique: true, index: true },
    Name: { type: String, required: true, maxlength: 100 },
    Description: { type: String, default: null },
    CreatedAt: { type: Date, default: Date.now },
  },
  { collection: 'categories', versionKey: false },
);

module.exports = mongoose.model('Category', CategorySchema);
