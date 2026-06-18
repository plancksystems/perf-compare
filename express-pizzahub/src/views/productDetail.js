const { escapeHtml, escapeAttr } = require('./escape');

function renderProductDetail(product) {
  const image = product.ImageURL
    ? `<img src="${escapeAttr(product.ImageURL)}" alt="${escapeAttr(product.Name)}" class="w-full h-full object-cover" />`
    : `<div class="w-full h-full flex items-center justify-center text-slate-300 min-h-[300px]">
         <svg class="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
       </div>`;

  const description = product.Description
    ? `<p class="text-slate-500 text-sm leading-relaxed mb-4">${escapeHtml(product.Description)}</p>`
    : '';

  return `
    <div class="max-w-4xl mx-auto">
      <button class="text-sm text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-1"
              onclick="loadProducts()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Back to Products
      </button>

      <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div class="md:flex">
          <div class="md:w-1/2 h-72 md:h-auto bg-slate-100 relative overflow-hidden">${image}</div>

          <div class="md:w-1/2 p-6 flex flex-col">
            <div class="mb-1">
              <span class="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">${escapeHtml(product.SKU)}</span>
            </div>
            <h1 class="text-2xl font-bold text-slate-800 mb-2">${escapeHtml(product.Name)}</h1>

            ${description}

            <div class="flex items-baseline gap-2 mb-6">
              <span class="text-3xl font-bold text-slate-800">₹${escapeHtml(product.BasePrice)}</span>
              <span class="text-sm text-slate-400">incl. taxes</span>
            </div>

            <div class="grid grid-cols-2 gap-3 mb-6 text-sm">
              <div class="bg-slate-50 rounded-lg p-3">
                <span class="text-slate-400 text-xs">Category</span>
                <p class="font-medium text-slate-700">${escapeHtml(product.CategoryID)}</p>
              </div>
              <div class="bg-slate-50 rounded-lg p-3">
                <span class="text-slate-400 text-xs">Product ID</span>
                <p class="font-medium text-slate-700">${escapeHtml(product.ProductID)}</p>
              </div>
            </div>

            <div class="mt-auto flex gap-3">
              <button class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2"
                      onclick="addToCart(${product.ProductID}, ${JSON.stringify(product.Name)}, ${product.BasePrice})">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderNotFound() {
  return `
    <div class="p-8 text-center">
      <h2 class="text-lg font-semibold text-slate-700">Product Not Found</h2>
      <p class="text-slate-400 mt-1">The requested product does not exist.</p>
    </div>
  `;
}

module.exports = { renderProductDetail, renderNotFound };
