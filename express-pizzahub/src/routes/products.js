const express = require('express');
const Product = require('../models/product');
const { renderProductList } = require('../views/productList');
const { renderProductDetail, renderNotFound } = require('../views/productDetail');
const { CreateProductBody } = require('../validators/product');

const router = express.Router();

router.get('/', async (req, res) => {
  const filter = {};
  const categoryRaw = req.query.category;
  if (categoryRaw !== undefined && categoryRaw !== '') {
    const catId = Number.parseInt(categoryRaw, 10);
    if (Number.isInteger(catId)) filter.CategoryID = catId;
  }

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q.length > 0) {
    filter.Name = { $regex: escapeRegex(q), $options: 'i' };
  }

  const products = await Product.find(filter).limit(200).lean();
  res.type('html').send(renderProductList(products));
});

router.get('/:id', async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).type('html').send(renderNotFound());

  const product = await Product.findOne({ ProductID: id }).lean();
  if (!product) return res.status(404).type('html').send(renderNotFound());
  res.type('html').send(renderProductDetail(product));
});

router.post('/', async (req, res) => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  const next = await Product.findOne({}).sort({ ProductID: -1 }).select('ProductID').lean();
  const ProductID = next ? next.ProductID + 1 : 1;

  await Product.create({ ProductID, ...parsed.data });
  res.type('html').send('<span>Product created</span>');
});

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = router;
