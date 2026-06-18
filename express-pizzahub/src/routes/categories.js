const express = require('express');
const Category = require('../models/category');
const { renderCategoryList } = require('../views/categoryList');
const { CreateCategoryBody } = require('../validators/product');

const router = express.Router();

router.get('/', async (req, res) => {
  const categories = await Category.find({}).limit(100).sort({ CategoryID: 1 }).lean();
  res.type('html').send(renderCategoryList(categories));
});

router.post('/', async (req, res) => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  const next = await Category.findOne({}).sort({ CategoryID: -1 }).select('CategoryID').lean();
  const CategoryID = next ? next.CategoryID + 1 : 1;

  await Category.create({ CategoryID, ...parsed.data });
  res.type('html').send('<span>Category created</span>');
});

module.exports = router;
