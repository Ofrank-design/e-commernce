/* ============================================================
   WISHLIST.JS
   Renders the wishlist page from products saved in localStorage.
   ============================================================ */

(function(){
  const grid = document.getElementById("wishlistGrid");
  if(!grid) return;

  const emptyEl = document.getElementById("wishlistEmpty");

  function render(){
    const ids = getWishlist();
    const products = ids.map(id => getProductById(id)).filter(Boolean);
    if(!products.length){
      grid.style.display = "none";
      emptyEl.style.display = "block";
      return;
    }
    grid.style.display = "grid";
    emptyEl.style.display = "none";
    grid.innerHTML = products.map(p => productCardHTML(p)).join("");
  }

  document.addEventListener("click", (e) => {
    if(e.target.closest("[data-wishlist-toggle]")){
      setTimeout(render, 0);
    }
  });

  render();
})();
