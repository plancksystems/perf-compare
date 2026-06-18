const { z } = require('zod');

const CreateProductBody = z.object({
  SKU: z.string().min(1).max(50),
  Name: z.string().min(1).max(200),
  Description: z.string().nullish(),
  CategoryID: z.number().int().min(1),
  BasePrice: z.number().min(0),
  ImageURL: z.string().nullish(),
  Attributes: z.string().nullish(),
});

const CreateCategoryBody = z.object({
  Name: z.string().min(1).max(100),
  Description: z.string().nullish(),
});

module.exports = { CreateProductBody, CreateCategoryBody };
