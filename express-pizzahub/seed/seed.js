const fs = require('fs');
const path = require('path');
const { connect, mongoose } = require('../src/db');
const Category = require('../src/models/category');
const Product = require('../src/models/product');

async function main() {
  await connect();

  const categories = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'categories.json'), 'utf8'),
  );
  const products = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8'),
  );

  await Category.deleteMany({});
  await Product.deleteMany({});

  await Category.insertMany(categories);
  await Product.insertMany(products);

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
