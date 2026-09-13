/* ============================================================
   CART.JS
   Renders the cart page: line items with quantity controls,
   promo code application, and the order summary (subtotal,
   shipping, tax, total). The applied promo is stored so the
   checkout page summary stays consistent.
   ============================================================ */

(function(){
  const cartRoot = document.getElementById("cartRoot");
  if(!cartRoot) return;

  const itemsEl = document.getElementById("cartItems");
  const emptyEl = document.getElementById("cartEmpty");
  const layoutEl = document.getElementById("cartLayout");
  const subtotalEl = document.getElementById("cartSubtotal");
  const shippingEl = document.getElementById("cartShipping");
  const taxEl = document.getElementById("cartTax");
  const totalEl = document.getElementById("cartTotal");
  const discountRow = document.getElementById("cartDiscountRow");
  const discountEl = document.getElementById("cartDiscount");
  const promoInput = document.getElementById("promoInput");
  const promoBtn = document.getElementById("promoApplyBtn");
  const promoMessage = document.getElementById("promoMessage");

  function getAppliedPromo(){
    return readStorage("forme_promo", null);
  }
  function setAppliedPromo(code, rate){
    writeStorage("forme_promo", code ? { code, rate } : null);
  }

  function calculateTotals(){
    const subtotal = getCartSubtotal();
    const promo = getAppliedPromo();
    const discount = promo ? subtotal * promo.rate : 0;
    const discountedSubtotal = subtotal - discount;
    const shipping = subtotal === 0 ? 0 : (subtotal >= SITE_CONFIG.freeShippingThreshold ? 0 : SITE_CONFIG.standardShipping);
    const tax = discountedSubtotal * SITE_CONFIG.taxRate;
    const total = discountedSubtotal + shipping + tax;
    return { subtotal, discount, shipping, tax, total, promo };
  }

  function render(){
    const lines = getCartLines();
    if(!lines.length){
      emptyEl.style.display = "block";
      layoutEl.style.display = "none";
      return;
    }
    emptyEl.style.display = "none";
    layoutEl.style.display = "grid";

    itemsEl.innerHTML = lines.map(line => {
      const p = line.product;
      const lineTotal = p.price * line.qty;
      return `
      <div class="cart-item" data-key="${lineKey(line.id, line.color, line.size)}">
        <div class="cart-item-media">${placeholderBlock(p, "a")}</div>
        <div>
          <a href="product.html?id=${p.id}" class="cart-item-name">${p.name}</a>
          <div class="cart-item-meta">
            ${line.color ? `Color: ${line.color}` : ""}${line.color && line.size ? " · " : ""}${line.size ? `Size: ${line.size}` : ""}
          </div>
          <div class="cart-item-controls">
            <div class="qty-selector">
              <button type="button" data-qty-minus>−</button>
              <input type="text" value="${line.qty}" readonly>
              <button type="button" data-qty-plus>+</button>
            </div>
            <button type="button" class="cart-item-remove" data-remove>Remove</button>
          </div>
        </div>
        <div class="cart-item-price">
          ${formatPrice(lineTotal)}
          <span class="unit">${formatPrice(p.price)} each</span>
        </div>
      </div>`;
    }).join("");

    itemsEl.querySelectorAll(".cart-item").forEach(row => {
      const key = row.dataset.key;
      const [id, color, size] = key.split("::");
      row.querySelector("[data-qty-minus]").addEventListener("click", () => {
        const line = getCartLines().find(l => lineKey(l.id, l.color, l.size) === key);
        if(line) updateCartQty(id, color || null, size || null, line.qty - 1);
        render();
      });
      row.querySelector("[data-qty-plus]").addEventListener("click", () => {
        const line = getCartLines().find(l => lineKey(l.id, l.color, l.size) === key);
        if(line) updateCartQty(id, color || null, size || null, line.qty + 1);
        render();
      });
      row.querySelector("[data-remove]").addEventListener("click", () => {
        removeFromCart(id, color || null, size || null);
        showToast("Removed from cart", "check");
        render();
      });
    });

    const totals = calculateTotals();
    subtotalEl.textContent = formatPrice(totals.subtotal);
    shippingEl.textContent = totals.shipping === 0 ? "Free" : formatPrice(totals.shipping);
    taxEl.textContent = formatPrice(totals.tax);
    totalEl.textContent = formatPrice(totals.total);
    if(totals.promo){
      discountRow.style.display = "flex";
      discountEl.textContent = `− ${formatPrice(totals.discount)}`;
      promoInput.value = totals.promo.code;
      promoMessage.textContent = `Code ${totals.promo.code} applied (${Math.round(totals.promo.rate * 100)}% off)`;
      promoMessage.className = "promo-message success";
    } else {
      discountRow.style.display = "none";
    }
  }

  if(promoBtn){
    promoBtn.addEventListener("click", () => {
      const code = promoInput.value.trim().toUpperCase();
      if(!code){
        promoMessage.textContent = "Enter a promo code.";
        promoMessage.className = "promo-message error";
        return;
      }
      const rate = SITE_CONFIG.promoCodes[code];
      if(rate){
        setAppliedPromo(code, rate);
        showToast("Promo code applied", "check");
      } else {
        setAppliedPromo(null);
        promoMessage.textContent = "That code isn't valid. Try WELCOME10.";
        promoMessage.className = "promo-message error";
      }
      render();
    });
  }

  render();
})();
