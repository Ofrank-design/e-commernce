/* ============================================================
   PRODUCT.JS
   Renders a single product page based on the ?id= query param:
   gallery, color/size selection, quantity, add to cart, review
   breakdown, and related products.
   ============================================================ */

(function(){
  const root = document.getElementById("productRoot");
  if(!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || PRODUCTS[0].id;
  const product = getProductById(id) || PRODUCTS[0];

  let selectedColor = product.colors[0] ? product.colors[0].name : null;
  let selectedSize = null;
  let qty = 1;
  let activeImage = "a";

  document.title = `${product.name} — ${SITE_CONFIG.brand}`;

  // ---- Breadcrumb ----
  const crumbEl = document.getElementById("breadcrumb");
  if(crumbEl){
    crumbEl.innerHTML = `<a href="index.html">Home</a> / <a href="shop.html?category=${product.category}">${product.category}</a> / <span>${product.name}</span>`;
  }

  // ---- Gallery ----
  const galleryMain = document.getElementById("galleryMain");
  const galleryThumbs = document.getElementById("galleryThumbs");
  function renderGallery(){
    galleryMain.innerHTML = placeholderBlock(product, activeImage);
    galleryThumbs.innerHTML = ["a","b"].map((v,i) => `
      <div class="gallery-thumb ${v === activeImage ? "active" : ""}" data-thumb="${v}">
        ${placeholderBlock(product, v)}
      </div>`).join("");
    galleryThumbs.querySelectorAll("[data-thumb]").forEach(thumb => {
      thumb.addEventListener("click", () => {
        activeImage = thumb.dataset.thumb;
        renderGallery();
      });
    });
  }
  renderGallery();

  // ---- Basic info ----
  document.getElementById("pdName").textContent = product.name;
  document.getElementById("pdRatingStars").textContent = renderStars(product.rating);
  document.getElementById("pdReviewCount").textContent = `${product.reviewCount} reviews`;
  document.getElementById("pdPrice").innerHTML = product.oldPrice
    ? `<span class="sale-price">${formatPrice(product.price)}</span><span class="old">${formatPrice(product.oldPrice)}</span>`
    : `<span>${formatPrice(product.price)}</span>`;

  // ---- Color selector ----
  const colorGroup = document.getElementById("colorGroup");
  const colorValueLabel = document.getElementById("colorValueLabel");
  if(product.colors.length){
    colorValueLabel.textContent = selectedColor;
    colorGroup.innerHTML = product.colors.map(c => `
      <div class="pd-color-swatch ${c.name === selectedColor ? "selected" : ""}" style="background:${c.hex}" data-color="${c.name}" title="${c.name}"></div>
    `).join("");
    colorGroup.querySelectorAll("[data-color]").forEach(el => {
      el.addEventListener("click", () => {
        selectedColor = el.dataset.color;
        colorValueLabel.textContent = selectedColor;
        colorGroup.querySelectorAll("[data-color]").forEach(s => s.classList.toggle("selected", s.dataset.color === selectedColor));
      });
    });
  } else {
    document.getElementById("colorOptionGroup").style.display = "none";
  }

  // ---- Size selector ----
  const sizeGroup = document.getElementById("sizeGroup");
  const sizeValueLabel = document.getElementById("sizeValueLabel");
  if(product.sizes.length){
    sizeGroup.innerHTML = product.sizes.map(s => `<button type="button" class="pd-size-btn" data-size="${s}">${s}</button>`).join("");
    sizeGroup.querySelectorAll("[data-size]").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedSize = btn.dataset.size;
        sizeValueLabel.textContent = selectedSize;
        sizeGroup.querySelectorAll("[data-size]").forEach(b => b.classList.toggle("selected", b.dataset.size === selectedSize));
        document.getElementById("pdNote").textContent = "";
      });
    });
  } else {
    document.getElementById("sizeOptionGroup").style.display = "none";
  }

  // ---- Quantity ----
  const qtyInput = document.getElementById("qtyInput");
  document.getElementById("qtyMinus").addEventListener("click", () => {
    qty = Math.max(1, qty - 1);
    qtyInput.value = qty;
  });
  document.getElementById("qtyPlus").addEventListener("click", () => {
    qty += 1;
    qtyInput.value = qty;
  });
  qtyInput.addEventListener("change", () => {
    qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
    qtyInput.value = qty;
  });

  // ---- Add to cart ----
  document.getElementById("addToCartBtn").addEventListener("click", () => {
    if(product.sizes.length && !selectedSize){
      document.getElementById("pdNote").textContent = "Please select a size before adding to cart.";
      return;
    }
    addToCart({ id: product.id, color: selectedColor, size: selectedSize, qty });
    showToast("Added to cart", "check");
  });

  // ---- Wishlist ----
  const wishlistBtn = document.getElementById("pdWishlistBtn");
  function refreshWishlistBtn(){
    const active = isWishlisted(product.id);
    wishlistBtn.classList.toggle("active", active);
    wishlistBtn.querySelector("span").textContent = active ? "Saved to wishlist" : "Add to wishlist";
  }
  refreshWishlistBtn();
  wishlistBtn.addEventListener("click", () => {
    toggleWishlist(product.id);
    refreshWishlistBtn();
    showToast(isWishlisted(product.id) ? "Added to wishlist" : "Removed from wishlist", "heart");
  });

  // ---- Description / details / shipping tabs ----
  document.getElementById("tabDescription").textContent = product.description;
  document.getElementById("tabDetails").innerHTML = `<ul>${product.details.map(d => `<li>${d}</li>`).join("")}</ul>`;
  document.getElementById("tabShipping").textContent = product.shipping;
  document.getElementById("tabReturns").textContent = product.returns;

  // ---- Reviews ----
  const breakdown = [
    { star: 5, pct: 74 },
    { star: 4, pct: 18 },
    { star: 3, pct: 5 },
    { star: 2, pct: 2 },
    { star: 1, pct: 1 }
  ];
  document.getElementById("reviewAvg").textContent = product.rating.toFixed(1);
  document.getElementById("reviewAvgStars").textContent = renderStars(product.rating);
  document.getElementById("reviewAvgCount").textContent = `${product.reviewCount} reviews`;
  document.getElementById("reviewBars").innerHTML = breakdown.map(b => `
    <div class="review-bar-row">
      <span>${b.star} ★</span>
      <div class="review-bar-track"><div class="review-bar-fill" style="width:${b.pct}%"></div></div>
      <span>${b.pct}%</span>
    </div>`).join("");
  document.getElementById("reviewList").innerHTML = REVIEW_SAMPLES.slice(0, 4).map(r => `
    <div class="review-item">
      <span class="stars">${renderStars(r.rating)}</span>
      <p>${r.text}</p>
      <span class="reviewer">${r.name}</span>
    </div>`).join("");

  // ---- Related products ----
  const relatedGrid = document.getElementById("relatedGrid");
  if(relatedGrid){
    const related = getRelatedProducts(product, 4);
    relatedGrid.innerHTML = related.map(p => productCardHTML(p)).join("");
  }
})();
