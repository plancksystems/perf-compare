function renderPanelHome() {
  return `
    <div>
      <div class="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 lg:p-12">
        <div class="relative z-10">
          <h1 class="text-3xl lg:text-4xl font-bold mb-2">Fresh from the Oven</h1>
          <p class="text-blue-100 text-lg mb-6">Hand-tossed pizzas, pastas, sides and more - delivered hot to your door</p>
          <div class="flex gap-3">
            <button hx-get="/panel/catalogue" hx-target="#content" hx-swap="innerHTML" hx-push-url="/catalogue" class="bg-white text-blue-700 font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-50 transition cursor-pointer">
              Order Now
            </button>
            <button hx-get="/panel/catalogue?category=14" hx-target="#content" hx-swap="innerHTML" hx-push-url="/?category=14" class="border border-white/40 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-white/10 transition cursor-pointer">
              View Combos
            </button>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div hx-get="/panel/catalogue?category=14" hx-target="#content" hx-swap="innerHTML" hx-push-url="/?category=14" class="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition">
          <p class="text-emerald-100 text-xs uppercase tracking-wider mb-1">Best Value</p>
          <h3 class="text-xl font-bold mb-1">Family Feast for 4</h3>
          <p class="text-emerald-100 text-sm">2 Large Pizzas + Sides + Wings + Drinks - Save ₹350</p>
        </div>
        <div hx-get="/panel/catalogue?category=2" hx-target="#content" hx-swap="innerHTML" hx-push-url="/?category=2" class="bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition">
          <p class="text-violet-100 text-xs uppercase tracking-wider mb-1">Premium Selection</p>
          <h3 class="text-xl font-bold mb-1">Gourmet Pizzas</h3>
          <p class="text-violet-100 text-sm">Truffle, Lobster, Prosciutto and more artisan creations</p>
        </div>
      </div>
      <div hx-get="/panel/recent-orders" hx-trigger="load" hx-swap="innerHTML"></div>
    </div>
  `;
}

module.exports = { renderPanelHome };
