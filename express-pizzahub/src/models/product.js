const { mongoose } = require('../db');

const ProductSchema = new mongoose.Schema(
  {
    ProductID: { type: Number, required: true, unique: true, index: true },
    SKU: { type: String, required: true, maxlength: 50 },
    Name: { type: String, required: true, maxlength: 200, index: true },
    Description: { type: String, default: null },
    CategoryID: { type: Number, required: true, index: true },
    BasePrice: { type: Number, required: true, min: 0 },
    ImageURL: { type: String, default: null },
    Attributes: { type: String, default: null },
    CreatedAt: { type: Date, default: Date.now },
    UpdatedAt: { type: Date, default: Date.now },
  },
  { collection: 'products', versionKey: false },
);

module.exports = mongoose.model('Product', ProductSchema);
