function goToHome() {
    document.getElementById("cartView").classList.remove("active");
    document.getElementById("paymentSuccess").style.display = "none";
    document.getElementById("homeView").classList.add("active");
    updateCartUI(); // restore the floating cart button if needed
}

function renderCartPage() {
    const container = document.getElementById("cartItemsContainer");
    container.innerHTML = "";
    
    let totalPrice = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        totalPrice += itemTotal;
        container.innerHTML += `
            <div class="cart-item">
                <div class="item-info" style="flex: 1;">
                    <h4>${item.name}</h4>
                    <p>₹${item.price.toFixed(2)}</p>
                </div>
                <div class="stepper-btn" style="margin-right: 12px; padding: 4px 6px;">
                    <button onclick="decrementItem('${item.id}')">-</button>
                    <span style="margin: 0 4px;">${item.qty}</span>
                    <button onclick="addRegularItem('${item.id}')">+</button>
                </div>
                <div style="font-weight: 600; width: 50px; text-align: right;">₹${itemTotal.toFixed(2)}</div>
            </div>
        `;
    });
    
    // Check if AI Detour Item is already in cart. If not, show it as an upsell, along with some random deterministic items.
    const upsellBlock = document.getElementById("checkoutAiUpsell");
    const upsellContent = document.getElementById("checkoutAiContent");
    
    let upsellsHtml = "";
    
    if (aiDetourItem && !cart.find(i => i.id === aiDetourItem.productId)) {
        upsellsHtml += `
            <div class="checkout-card checkout-card-ai">
                <div>
                    <h4>${aiDetourItem.productName}</h4>
                    <p style="font-size:10px; color:var(--swiggy-orange); margin-bottom:4px; font-weight:500;">✨ Recommended for you</p>
                    <p>₹${aiDetourItem.price.toFixed(2)}</p>
                </div>
                <button class="add-btn-small" style="width:100%;" onclick="trackEvent('CHECKOUT_UPSELL_ADD', '${aiDetourItem.productId}', 'checkout_strip'); addRegularItem('${aiDetourItem.productId}'); goToCart();">ADD</button>
            </div>
        `;
    }
    
    // Add 2 random deterministic items to make it look like a real Swiggy strip
    const randomUpsells = fullCatalog.sort(() => 0.5 - Math.random()).filter(i => !cart.find(c => c.id === i.productId)).slice(0, 2);
    randomUpsells.forEach(item => {
        upsellsHtml += `
            <div class="checkout-card">
                <div>
                    <h4>${item.name}</h4>
                    <p>₹${item.price.toFixed(2)}</p>
                </div>
                <button class="add-btn-small" style="width:100%; color:var(--swiggy-orange); border-color:#fed7aa; background:#fff7ed;" onclick="trackEvent('CHECKOUT_UPSELL_ADD', '${item.productId}', 'checkout_strip'); addRegularItem('${item.productId}'); goToCart();">ADD</button>
            </div>
        `;
    });
    
    if (upsellsHtml !== "") {
        upsellBlock.style.display = "block";
        upsellContent.innerHTML = upsellsHtml;
    } else {
        upsellBlock.style.display = "none";
    }
    
    document.getElementById("billTotal").innerText = `₹${totalPrice.toFixed(2)}`;
    document.getElementById("grandTotal").innerText = `₹${totalPrice.toFixed(2)}`;
    document.getElementById("payTotal").innerText = `₹${totalPrice.toFixed(2)}`;
    
    document.getElementById("payFooter").style.display = "flex";
    document.getElementById("cartItemsContainer").style.display = "block";
    document.querySelector(".bill-details").style.display = "block";
}

function processPayment() {
    document.getElementById("payFooter").style.display = "none";
    document.getElementById("cartItemsContainer").style.display = "none";
    document.querySelector(".bill-details").style.display = "none";
    document.getElementById("checkoutAiUpsell").style.display = "none";
    document.getElementById("paymentSuccess").style.display = "block";
    lucide.createIcons();
    cart = []; // empty the cart
}

// Start
init();

function switchTab(tabName) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    
    if(tabName === "home") {
        document.getElementById("homeView").classList.add("active");
        document.querySelectorAll(".nav-item:nth-child(1)").forEach(i => i.classList.add("active"));
    } else if(tabName === "reorder") {
        document.getElementById("reorderView").classList.add("active");
        document.querySelectorAll(".nav-item:nth-child(2)").forEach(i => i.classList.add("active"));
    }
    updateCartUI(); // ensure cart button is shown
}
