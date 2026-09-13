/* ============================================================
   SHOP.JS
   Handles the shop page: category/size/color/price/availability
   filtering, sorting, and rendering the product grid. Reads a
   category or search query from the URL so links from the
   homepage and search overlay land on the right filtered view.
   ============================================================ */

(function(){
  const grid = document.getElementById("shopGrid");
  if(!grid) return;

  const countEl = document.getElementById("shopCount");
  const sortSelect = document.getElementById("sortSelect");
  const clearBtn = document.getElementById("clearFilters");
  const params = new URLSearchParams(window.location.search);

  const state = {
    categories: params.get("category") ? [params.get("category")] : [],
    types: [],
    sizes: [],
    colors: [],
    maxPrice: 600,
    inStockOnly: false,
    saleOnly: false,
    sort: "featured",
    query: params.get("q") || ""
  };

  function matchesFilters(p){
    if(state.query){
      const q = state.query.toLowerCase();
      const hit = p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.type.toLowerCase().includes(q);
      if(!hit) return false;
    }
    if(state.categories.length && !state.categories.includes(p.category)) return false;
    if(state.types.length && !state.types.includes(p.type)) return false;
    if(state.sizes.length && !p.sizes.some(s => state.sizes.includes(s))) return false;
    if(state.colors.length && !p.colors.some(c => state.colors.includes(c.name))) return false;
    if(p.price > state.maxPrice) return false;
    if(state.saleOnly && !p.oldPrice) return false;
    return true;
  }

  function sortProducts(list){
    const copy = [...list];
    switch(state.sort){
      case "newest":
        return copy.reverse();
      case "price-asc":
        return copy.sort((a,b) => a.price - b.price);
      case "price-desc":
        return copy.sort((a,b) => b.price - a.price);
      case "rating":
        return copy.sort((a,b) => b.rating - a.rating);
      default:
        return copy;
    }
  }

  function render(){
    const filtered = sortProducts(PRODUCTS.filter(matchesFilters));
    grid.innerHTML = filtered.length
      ? filtered.map(p => productCardHTML(p)).join("")
      : `<div style="grid-column:1/-1; text-align:center; padding:60px 0; color:var(--muted);">No products match these filters. Try clearing a filter.</div>`;
    grid.classList.remove("in");
    requestAnimationFrame(() => grid.classList.add("in"));
    if(countEl) countEl.textContent = `${filtered.length} product${filtered.length === 1 ? "" : "s"}`;
  }

  // Checkbox filter groups
  document.querySelectorAll("[data-filter-group]").forEach(group => {
    const key = group.dataset.filterGroup;
    group.querySelectorAll("input[type=checkbox]").forEach(cb => {
      if(state[key] && state[key].includes(cb.value)) cb.checked = true;
      cb.addEventListener("change", () => {
        if(cb.checked){
          state[key].push(cb.value);
        } else {
          state[key] = state[key].filter(v => v !== cb.value);
        }
        render();
      });
    });
  });

  // Color swatch filters
  document.querySelectorAll("[data-color-swatch]").forEach(swatch => {
    swatch.addEventListener("click", () => {
      const color = swatch.dataset.colorSwatch;
      swatch.classList.toggle("selected");
      if(state.colors.includes(color)){
        state.colors = state.colors.filter(c => c !== color);
      } else {
        state.colors.push(color);
      }
      render();
    });
  });

  // Price range
  const priceRange = document.getElementById("priceRange");
  const priceValue = document.getElementById("priceValue");
  if(priceRange){
    priceRange.addEventListener("input", () => {
      state.maxPrice = Number(priceRange.value);
      if(priceValue) priceValue.textContent = formatPrice(state.maxPrice);
      render();
    });
  }

  // Sale only / in stock checkboxes (availability group)
  const saleCheckbox = document.querySelector('[data-availability="sale"]');
  if(saleCheckbox){
    saleCheckbox.addEventListener("change", () => {
      state.saleOnly = saleCheckbox.checked;
      render();
    });
  }

  // Sort
  if(sortSelect){
    sortSelect.addEventListener("change", () => {
      state.sort = sortSelect.value;
      render();
    });
  }

  // Clear filters
  if(clearBtn){
    clearBtn.addEventListener("click", () => {
      state.categories = [];
      state.types = [];
      state.sizes = [];
      state.colors = [];
      state.maxPrice = 600;
      state.saleOnly = false;
      state.query = "";
      document.querySelectorAll('[data-filter-group] input[type=checkbox]').forEach(cb => cb.checked = false);
      document.querySelectorAll('[data-color-swatch]').forEach(s => s.classList.remove("selected"));
      if(priceRange){ priceRange.value = 600; if(priceValue) priceValue.textContent = formatPrice(600); }
      if(saleCheckbox) saleCheckbox.checked = false;
      render();
    });
  }

  // Collapsible filter groups on mobile
  document.querySelectorAll(".filter-group-title").forEach(title => {
    title.addEventListener("click", () => title.parentElement.classList.toggle("collapsed"));
  });

  // Mobile filter drawer toggle
  const mobileToggle = document.getElementById("mobileFilterToggle");
  const filterSidebar = document.getElementById("filterSidebar");
  if(mobileToggle && filterSidebar){
    mobileToggle.addEventListener("click", () => filterSidebar.classList.toggle("open"));
  }

  render();
})();
