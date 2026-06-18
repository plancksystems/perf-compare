const express = require('express');
const Product = require('../models/product');

const router = express.Router();

router.get('/:id', async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid_id' });

  const product = await Product.findOne({ ProductID: id }).lean();
  if (!product) return res.status(404).json({ error: 'not_found' });

  res.json({
    product_id: product.ProductID,
    name: product.Name,
    base_price: Number(product.BasePrice.toFixed(2)),
  });
});

module.exports = router;
