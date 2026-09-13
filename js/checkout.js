/* ============================================================
   CHECKOUT.JS
   Renders the order summary from the cart, handles delivery
   option selection, validates the contact and shipping form,
   and simulates placing an order (no real payment is collected).
   ============================================================ */

(function(){
  const checkoutRoot = document.getElementById("checkoutRoot");
  if(!checkoutRoot) return;

  const summaryList = document.getElementById("checkoutSummaryList");
  const subtotalEl = document.getElementById("checkoutSubtotal");
  const shippingEl = document.getElementById("checkoutShipping");
  const taxEl = document.getElementById("checkoutTax");
  const totalEl = document.getElementById("checkoutTotal");
  const discountRow = document.getElementById("checkoutDiscountRow");
  const discountEl = document.getElementById("checkoutDiscount");
  const form = document.getElementById("checkoutForm");
  const confirmationEl = document.getElementById("orderConfirmation");
  const checkoutFormWrap = document.getElementById("checkoutFormWrap");
  const orderNumberEl = document.getElementById("orderNumber");

  let deliveryMethod = "standard";

  function getPromo(){
    return readStorage("forme_promo", null);
  }

  function calculateTotals(){
    const subtotal = getCartSubtotal();
    const promo = getPromo();
    const discount = promo ? subtotal * promo.rate : 0;
    const discountedSubtotal = subtotal - discount;
    const shippingCost = deliveryMethod === "express" ? SITE_CONFIG.expressShipping :
      (subtotal >= SITE_CONFIG.freeShippingThreshold ? 0 : SITE_CONFIG.standardShipping);
    const tax = discountedSubtotal * SITE_CONFIG.taxRate;
    const total = discountedSubtotal + shippingCost + tax;
    return { subtotal, discount, shippingCost, tax, total, promo };
  }

  function renderSummary(){
    const lines = getCartLines();
    if(!lines.length){
      window.location.href = "cart.html";
      return;
    }
    summaryList.innerHTML = lines.map(line => `
      <div class="order-summary-item">
        <span class="name">${line.product.name} ${line.size ? `(${line.size})` : ""}</span>
        <span class="qty">× ${line.qty}</span>
        <span>${formatPrice(line.product.price * line.qty)}</span>
      </div>`).join("");

    const totals = calculateTotals();
    subtotalEl.textContent = formatPrice(totals.subtotal);
    shippingEl.textContent = totals.shippingCost === 0 ? "Free" : formatPrice(totals.shippingCost);
    taxEl.textContent = formatPrice(totals.tax);
    totalEl.textContent = formatPrice(totals.total);
    if(totals.promo){
      discountRow.style.display = "flex";
      discountEl.textContent = `− ${formatPrice(totals.discount)}`;
    } else {
      discountRow.style.display = "none";
    }
  }

  // Delivery option selection
  document.querySelectorAll(".delivery-option").forEach(opt => {
    opt.addEventListener("click", () => {
      document.querySelectorAll(".delivery-option").forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      deliveryMethod = opt.dataset.delivery;
      renderSummary();
    });
  });

  // Form validation + order placement
  if(form){
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll("[required]").forEach(field => {
        const wrap = field.closest(".form-field");
        let fieldValid = field.value.trim().length > 0;
        if(field.type === "email" && fieldValid){
          fieldValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
        }
        if(wrap) wrap.classList.toggle("error", !fieldValid);
        if(!fieldValid) valid = false;
      });
      if(!valid) return;

      const orderNumber = "DEMO-" + Math.floor(10000 + Math.random() * 89999);
      orderNumberEl.textContent = `Order #${orderNumber}`;
      checkoutFormWrap.style.display = "none";
      document.getElementById("checkoutSummaryCard").style.display = "none";
      confirmationEl.style.display = "block";
      clearCart();
      writeStorage("forme_promo", null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    form.querySelectorAll("[required]").forEach(field => {
      field.addEventListener("input", () => {
        const wrap = field.closest(".form-field");
        if(wrap) wrap.classList.remove("error");
      });
    });
  }

  renderSummary();
})();
