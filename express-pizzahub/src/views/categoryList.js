const { escapeHtml, escapeAttr } = require('./escape');

function renderCategoryList(categories) {
  const cls = 'w-full text-left px-3 py-2 rounded-lg text-sm transition hover:bg-blue-50 hover:text-blue-700 category-btn';
  const buttons = categories.map((c) => {
    const id = escapeAttr(c.CategoryID);
    return `<button class="${cls}" data-category="${id}" data-on:click="@get('/products?category=${id}')">${escapeHtml(c.Name)}</button>`;
  }).join('');

  return `<aside id="category-list" class="w-56 min-w-[14rem] bg-white border-r border-slate-200 overflow-y-auto shrink-0 p-4"><h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Categories</h2><button class="${cls} font-medium" data-category="all">All Items</button>${buttons}</aside>`;
}

module.exports = { renderCategoryList };
