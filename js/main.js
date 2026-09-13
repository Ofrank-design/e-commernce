/* ============================================================
   MAIN.JS
   Shared utilities loaded on every page: header state, mobile
   navigation, search overlay, toast notifications, cart and
   wishlist storage helpers, and the product card renderer used
   across the home page, shop, search, and wishlist.
   ============================================================ */

/* ---------------------------------------------------------
   STORAGE HELPERS
   --------------------------------------------------------- */
function readStorage(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch(e){
    return fallback;
  }
}
function writeStorage(key, value){
  try{
    localStorage.setItem(key, JSON.stringify(value));
  } catch(e){ /* storage unavailable, fail silently */ }
}

/* ---------------------------------------------------------
   CART
   Cart items: { id, name, price, image tone, color, size, qty }
   A single product can appear more than once if the color or
   size differs, so line items are keyed by id + color + size.
   --------------------------------------------------------- */
function getCart(){
  return readStorage("forme_cart", []);
}
function saveCart(cart){
  writeStorage("forme_cart", cart);
  updateHeaderCounts();
}
function lineKey(id, color, size){
  return [id, color || "", size || ""].join("::");
}
function addToCart({ id, color, size, qty }){
  const product = getProductById(id);
  if(!product) return;
  const cart = getCart();
  const key = lineKey(id, color, size);
  const existing = cart.find(item => lineKey(item.id, item.color, item.size) === key);
  if(existing){
    existing.qty += qty;
  } else {
    cart.push({ id, color: color || null, size: size || null, qty });
  }
  saveCart(cart);
}
function updateCartQty(id, color, size, qty){
  const cart = getCart();
  const key = lineKey(id, color, size);
  const item = cart.find(i => lineKey(i.id, i.color, i.size) === key);
  if(!item) return;
  item.qty = Math.max(1, qty);
  saveCart(cart);
}
function removeFromCart(id, color, size){
  const cart = getCart().filter(i => lineKey(i.id, i.color, i.size) !== lineKey(id, color, size));
  saveCart(cart);
}
function clearCart(){
  saveCart([]);
}
function getCartCount(){
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}
function getCartLines(){
  return getCart().map(item => {
    const product = getProductById(item.id);
    return product ? { ...item, product } : null;
  }).filter(Boolean);
}
function getCartSubtotal(){
  return getCartLines().reduce((sum, line) => sum + line.product.price * line.qty, 0);
}

/* ---------------------------------------------------------
   WISHLIST
   --------------------------------------------------------- */
function getWishlist(){
  return readStorage("forme_wishlist", []);
}
function isWishlisted(id){
  return getWishlist().includes(id);
}
function toggleWishlist(id){
  let list = getWishlist();
  if(list.includes(id)){
    list = list.filter(i => i !== id);
  } else {
    list.push(id);
  }
  writeStorage("forme_wishlist", list);
  updateHeaderCounts();
  return list.includes(id);
}

/* ---------------------------------------------------------
   RECENT SEARCHES
   --------------------------------------------------------- */
function getRecentSearches(){
  return readStorage("forme_recent_searches", []);
}
function addRecentSearch(term){
  if(!term.trim()) return;
  let list = getRecentSearches().filter(t => t.toLowerCase() !== term.toLowerCase());
  list.unshift(term);
  list = list.slice(0, 6);
  writeStorage("forme_recent_searches", list);
}

/* ---------------------------------------------------------
   DISPLAY HELPERS
   --------------------------------------------------------- */
function formatPrice(value){
  return SITE_CONFIG.currency + Number(value).toFixed(0);
}
function renderStars(rating){
  const full = Math.round(rating);
  return "★★★★★☆☆☆☆☆".slice(5 - full, 10 - full);
}
function placeholderBlock(product, variant){
  const src = variant === "b" ? (product.images[1] || product.images[0]) : product.images[0];
  const cls = variant === "b" ? "placeholder-block image-b" : "placeholder-block image-a";
  return `<div class="${cls}"><img src="${src}" alt="${product.name}" loading="lazy" style="width:100%; height:100%; object-fit:cover;"></div>`;
}

/* ---------------------------------------------------------
   PRODUCT CARD RENDERER
   Used on: home page grids, shop grid, search results, wishlist,
   related products.
   --------------------------------------------------------- */
function productCardHTML(product){
  const wished = isWishlisted(product.id);
  const badgeClass = product.badge === "SALE" ? "product-badge sale" : "product-badge";
  const priceHTML = product.oldPrice
    ? `<span class="sale-price">${formatPrice(product.price)}</span><span class="old">${formatPrice(product.oldPrice)}</span>`
    : `<span>${formatPrice(product.price)}</span>`;
  const colorDots = product.colors.slice(0, 4).map(c => `<span class="color-dot" style="background:${c.hex}" title="${c.name}"></span>`).join("");

  return `
  <div class="product-card" data-id="${product.id}">
    <a href="product.html?id=${product.id}" class="product-media" aria-label="${product.name}">
      ${product.badge ? `<span class="${badgeClass}">${product.badge}</span>` : ""}
      <button class="wishlist-btn ${wished ? "active" : ""}" data-wishlist-toggle="${product.id}" aria-label="Add to wishlist" onclick="event.preventDefault(); handleWishlistClick(this, '${product.id}')">
        <svg viewBox="0 0 24 24" stroke-width="1.8"><path d="M12 21s-7.5-4.6-10-9.1C0.3 8.6 2 5 5.6 5c2 0 3.6 1.1 4.4 2.7C10.8 6.1 12.4 5 14.4 5 18 5 19.7 8.6 18 11.9 15.5 16.4 12 21 12 21z"/></svg>
      </button>
      ${placeholderBlock(product, "a")}
      ${placeholderBlock(product, "b")}
      <span class="quick-add" onclick="event.preventDefault(); handleQuickAdd('${product.id}')">Quick Add</span>
    </a>
    <a href="product.html?id=${product.id}">
      <div class="product-info-name">${product.name}</div>
    </a>
    <div class="product-rating">
      <span class="stars">${renderStars(product.rating)}</span>
      <span class="count">(${product.reviewCount})</span>
    </div>
    <div class="product-price">${priceHTML}</div>
    ${product.colors.length ? `<div class="product-colors">${colorDots}</div>` : ""}
  </div>`;
}

function handleWishlistClick(btn, id){
  const active = toggleWishlist(id);
  btn.classList.toggle("active", active);
  showToast(active ? "Added to wishlist" : "Removed from wishlist", "heart");
}

function handleQuickAdd(id){
  const product = getProductById(id);
  if(!product) return;
  if(product.sizes && product.sizes.length){
    window.location.href = `product.html?id=${id}`;
    return;
  }
  addToCart({ id, color: product.colors[0] ? product.colors[0].name : null, size: null, qty: 1 });
  showToast("Added to cart", "check");
}

/* ---------------------------------------------------------
   HEADER COUNTS
   --------------------------------------------------------- */
function updateHeaderCounts(){
  document.querySelectorAll("[data-cart-count]").forEach(el => {
    const count = getCartCount();
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  });
  document.querySelectorAll("[data-wishlist-count]").forEach(el => {
    const count = getWishlist().length;
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  });
}

/* ---------------------------------------------------------
   TOAST NOTIFICATIONS
   --------------------------------------------------------- */
function showToast(message, icon){
  let stack = document.querySelector(".toast-stack");
  if(!stack){
    stack = document.createElement("div");
    stack.className = "toast-stack";
    document.body.appendChild(stack);
  }
  const icons = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 12l5 5L20 6"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-10-9.1C0.3 8.6 2 5 5.6 5c2 0 3.6 1.1 4.4 2.7C10.8 6.1 12.4 5 14.4 5 18 5 19.7 8.6 18 11.9 15.5 16.4 12 21 12 21z"/></svg>'
  };
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `${icons[icon] || icons.check}<span>${message}</span>`;
  stack.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("leaving");
    setTimeout(() => toast.remove(), 260);
  }, 2600);
}

/* ---------------------------------------------------------
   MOBILE NAV DRAWER
   --------------------------------------------------------- */
function initMobileDrawer(){
  const toggle = document.getElementById("menuToggle");
  const drawer = document.getElementById("mobileDrawer");
  const overlay = document.getElementById("drawerOverlay");
  const closeBtn = document.getElementById("drawerClose");
  if(!toggle || !drawer) return;
  const open = () => { drawer.classList.add("open"); overlay.classList.add("open"); };
  const close = () => { drawer.classList.remove("open"); overlay.classList.remove("open"); };
  toggle.addEventListener("click", open);
  if(closeBtn) closeBtn.addEventListener("click", close);
  if(overlay) overlay.addEventListener("click", close);
}

/* ---------------------------------------------------------
   SEARCH OVERLAY
   --------------------------------------------------------- */
function initSearchOverlay(){
  const openBtns = document.querySelectorAll("[data-search-open]");
  const overlay = document.getElementById("searchOverlay");
  const closeBtn = document.getElementById("searchClose");
  const input = document.getElementById("searchInput");
  const resultsEl = document.getElementById("searchResults");
  const metaEl = document.getElementById("searchMeta");
  const recentEl = document.getElementById("searchRecent");
  if(!overlay || !input) return;

  function renderRecent(){
    const recent = getRecentSearches();
    if(!recentEl) return;
    recentEl.innerHTML = recent.length
      ? `<p class="promo-hint" style="margin-bottom:8px;">Recent searches</p><div class="search-recent">${recent.map(t => `<button type="button">${t}</button>`).join("")}</div>`
      : "";
    recentEl.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => { input.value = btn.textContent; runSearch(btn.textContent); });
    });
  }

  function runSearch(term){
    const q = term.trim().toLowerCase();
    if(!q){
      resultsEl.innerHTML = "";
      metaEl.textContent = "";
      renderRecent();
      return;
    }
    const matches = PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q)
    );
    metaEl.textContent = `${matches.length} product${matches.length === 1 ? "" : "s"} found`;
    resultsEl.innerHTML = matches.slice(0, 6).map(p => productCardHTML(p)).join("");
    if(recentEl) recentEl.innerHTML = "";
  }

  openBtns.forEach(btn => btn.addEventListener("click", () => {
    overlay.classList.add("open");
    input.focus();
    renderRecent();
  }));
  if(closeBtn) closeBtn.addEventListener("click", () => overlay.classList.remove("open"));
  overlay.addEventListener("click", (e) => { if(e.target === overlay) overlay.classList.remove("open"); });
  document.addEventListener("keydown", (e) => { if(e.key === "Escape") overlay.classList.remove("open"); });
  input.addEventListener("input", () => runSearch(input.value));
  input.addEventListener("keydown", (e) => {
    if(e.key === "Enter" && input.value.trim()){
      addRecentSearch(input.value.trim());
      window.location.href = `shop.html?q=${encodeURIComponent(input.value.trim())}`;
    }
  });
}

/* ---------------------------------------------------------
   NEWSLETTER FORM (appears in footer and dedicated section)
   --------------------------------------------------------- */
function initNewsletterForms(){
  document.querySelectorAll("[data-newsletter-form]").forEach(form => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input[type=email]");
      if(!input || !input.value.trim()) return;
      const successEl = form.parentElement.querySelector(".newsletter-success");
      form.style.display = "none";
      if(successEl) successEl.classList.add("show");
      showToast("You're on the list", "check");
    });
  });
}

/* ---------------------------------------------------------
   ACCORDION (product page tabs, FAQ)
   --------------------------------------------------------- */
function initAccordions(){
  document.querySelectorAll(".accordion-item").forEach(item => {
    const head = item.querySelector(".accordion-head");
    const body = item.querySelector(".accordion-body");
    if(!head || !body) return;
    if(item.classList.contains("open")){
      body.style.maxHeight = body.scrollHeight + "px";
    }
    head.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      const parent = item.parentElement;
      if(parent.classList.contains("single-open")){
        parent.querySelectorAll(".accordion-item").forEach(other => {
          other.classList.remove("open");
          other.querySelector(".accordion-body").style.maxHeight = 0;
        });
      }
      if(!isOpen){
        item.classList.add("open");
        body.style.maxHeight = body.scrollHeight + "px";
      } else {
        item.classList.remove("open");
        body.style.maxHeight = 0;
      }
    });
  });
}

/* ---------------------------------------------------------
   COUNTDOWN TIMER
   Counts down to a fixed point 3 days after first page load,
   persisted in localStorage so it feels consistent across visits
   for the same demo session.
   --------------------------------------------------------- */
function initCountdown(){
  const el = document.getElementById("countdown");
  if(!el) return;
  let endTime = readStorage("forme_promo_end", null);
  if(!endTime){
    endTime = Date.now() + (3 * 24 * 60 * 60 * 1000);
    writeStorage("forme_promo_end", endTime);
  }
  function tick(){
    const diff = Math.max(0, endTime - Date.now());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    const pad = n => String(n).padStart(2, "0");
    el.querySelector("[data-days]").textContent = pad(days);
    el.querySelector("[data-hours]").textContent = pad(hours);
    el.querySelector("[data-mins]").textContent = pad(mins);
    el.querySelector("[data-secs]").textContent = pad(secs);
  }
  tick();
  setInterval(tick, 1000);
}

/* ---------------------------------------------------------
   NAV SCROLL SHADOW
   --------------------------------------------------------- */
function initHeaderScrollShadow(){
  const header = document.querySelector("header");
  if(!header) return;
  const toggle = () => header.classList.toggle("scrolled", window.scrollY > 8);
  toggle();
  window.addEventListener("scroll", toggle, { passive: true });
}

/* ---------------------------------------------------------
   SCROLL REVEAL
   --------------------------------------------------------- */
function initScrollReveal(){
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const els = document.querySelectorAll(".reveal");
  if(prefersReducedMotion){
    els.forEach(el => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => io.observe(el));
}

/* ---------------------------------------------------------
   INIT
   --------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  updateHeaderCounts();
  initMobileDrawer();
  initSearchOverlay();
  initNewsletterForms();
  initAccordions();
  initCountdown();
  initHeaderScrollShadow();
  initScrollReveal();
});
