lucide.createIcons();
const API_BASE = window.location.origin;

// State
let cart = [];
let aiDetourItem = null;
let fullCatalog = [];
let usersData = [];
let activeUserObj = null;
let currentReorderItems = [];
let currentProducts = [];

async function trackEvent(eventType, productId = null, source = null) {
    if (!activeUserObj) return;
    try {
        fetch(`${API_BASE}/api/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: activeUserObj.userId,
                eventType,
                productId,
                source
            })
        });
    } catch (e) {
        console.error("Failed to track event", e);
    }
}

async function init() {
    try {
        // Fetch Catalog
        const catRes = await fetch(`${API_BASE}/api/catalog`);
        const catData = await catRes.json();
        fullCatalog = catData.catalog;
        
        setupCategoryPills();
        renderProducts(fullCatalog);
        
        // Fetch users
        const res = await fetch(`${API_BASE}/api/users`);
        const data = await res.json();
        usersData = data.users;
        
        const select = document.getElementById('userSelect');
        select.innerHTML = '';
        usersData.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.userId;
            opt.innerText = u.persona;
            select.appendChild(opt);
        });
        
        if(usersData.length > 0) switchUser(usersData[0].userId);
    } catch (e) { console.error(e); }
}

function getCategoryIcon(catName) {
    const iconMap = {
        "Snacks": "star",
        "Beverages": "coffee",
        "Dairy": "droplet",
        "Fresh Produce": "leaf",
        "Bakery": "croissant",
        "Meat & Seafood": "box",
        "Spices": "flame",
        "Personal Care": "smile",
        "Home & Cleaning": "home",
        "Pet Supplies": "heart"
    };
    return iconMap[catName] || "package";
}

function setupCategoryPills() {
    const row = document.getElementById('realCategoriesRow');
    const categories = [...new Set(fullCatalog.map(item => item.category))];
    
    let html = `<div class="cat-pill active" onclick="filterByCategory('All', this)">All</div>`;
    categories.forEach(cat => {
        html += `<div class="cat-pill" onclick="filterByCategory('${cat}', this)">${cat}</div>`;
    });
    row.innerHTML = html;
}

function filterByCategory(cat, element) {
    document.querySelectorAll('.cat-pill').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    
    document.getElementById('productsTitle').innerText = cat === 'All' ? 'All Items' : cat;
    
    if(cat === 'All') {
        renderProducts(fullCatalog);
    } else {
        renderProducts(fullCatalog.filter(i => i.category === cat));
    }
}

function renderProducts(items) {
    currentProducts = items;
    const grid = document.getElementById('categoriesGrid');
    grid.innerHTML = '';
    
    if (items.length === 0) {
        grid.innerHTML = '<p style="grid-column: span 4; text-align: center; font-size: 12px; color: #7e818c; padding: 20px;">No items found.</p>';
        return;
    }
    
    items.forEach((item) => {
        const cartItem = cart.find(i => i.id === item.productId);
        const qty = cartItem ? cartItem.qty : 0;
        
        let overlayHtml = '';
        if (qty > 0) {
            overlayHtml = `
            <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); z-index: 2;">
                <div class="stepper-btn" onclick="event.stopPropagation()">
                    <button onclick="decrementItem('${item.productId}')">-</button>
                    <span>${qty}</span>
                    <button onclick="addRegularItem('${item.productId}')">+</button>
                </div>
            </div>`;
        }
        
        grid.innerHTML += `
            <div class="category-item" onclick="addRegularItem('${item.productId}')">
                <div class="cat-icon" style="position: relative; overflow: visible;">
                    <i data-lucide="${getCategoryIcon(item.category)}"></i>
                    ${overlayHtml}
                </div>
                <p style="${qty > 0 ? 'margin-top: 8px;' : ''}">${item.name.substring(0, 10)}..</p>
            </div>
        `;
    });
    lucide.createIcons();
}

function handleSearch(query) {
    const q = query.toLowerCase();
    const filtered = fullCatalog.filter(i => 
        i.name.toLowerCase().includes(q) || 
        i.category.toLowerCase().includes(q)
    );
    // Reset category pills
    document.querySelectorAll('.cat-pill').forEach(el => el.classList.remove('active'));
    document.querySelector('.cat-pill').classList.add('active'); // Set "All" to active visually
    document.getElementById('productsTitle').innerText = query ? 'Search Results' : 'All Items';
    renderProducts(filtered);
}

// Attach event listener to search input
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-bar input');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
    }
});

function switchUser(userId) {
    activeUserObj = usersData.find(u => u.userId === userId);
    cart = [];
    updateCartUI();
    
    // Update Previous Orders UI
    updatePreviousOrdersUI();
    
    document.getElementById('homeView').classList.add('active');
    document.getElementById('cartView').classList.remove('active');
    
    const modal = document.getElementById('aiModal');
    const modalBody = document.getElementById('aiModalBody');
    modalBody.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Curating your experience...</p></div>`;
    
    setTimeout(() => {
        modal.classList.add('active');
        fetchHybridDetour(userId);
    }, 500);
}

function updatePreviousOrdersUI() {
    const section = document.getElementById('previouslyOrderedSection');
    const summaryText = document.getElementById('historySummaryText');
    const grid = document.getElementById('previousOrdersGrid');
    
    if(!activeUserObj || !activeUserObj.habitualCategories) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    summaryText.innerText = activeUserObj.groceryHistorySummary;
    
    // Pick 3-4 random items from their habitual categories to simulate past orders
    let habitualItems = fullCatalog.filter(item => activeUserObj.habitualCategories.includes(item.category));
    
    if (habitualItems.length < 4) {
        const extraItems = fullCatalog.filter(item => !activeUserObj.habitualCategories.includes(item.category));
        habitualItems = habitualItems.concat(extraItems.slice(0, 4 - habitualItems.length));
    }
    
    currentReorderItems = habitualItems.sort(() => 0.5 - Math.random()).slice(0, 4);
    renderReorderGrid();
}

function renderReorderGrid() {
    const grid = document.getElementById('previousOrdersGrid');
    if(!grid) return;
    
    grid.innerHTML = '';
    currentReorderItems.forEach(item => {
        const cartItem = cart.find(i => i.id === item.productId);
        const qty = cartItem ? cartItem.qty : 0;
        
        let actionHtml = `<button class="add-btn-small" onclick="addRegularItem('${item.productId}')">ADD</button>`;
        if (qty > 0) {
            actionHtml = `
                <div class="stepper-btn">
                    <button onclick="decrementItem('${item.productId}')">-</button>
                    <span>${qty}</span>
                    <button onclick="addRegularItem('${item.productId}')">+</button>
                </div>
            `;
        }
        
        grid.innerHTML += `
            <div class="reorder-card">
                <div class="reorder-info">
                    <h4>${item.name}</h4>
                    <p>₹${item.price.toFixed(2)}</p>
                </div>
                ${actionHtml}
            </div>
        `;
    });
}

function closeModal() {
    trackEvent('AI_MODAL_DISMISSED', null, 'home_modal');
    document.getElementById('aiModal').classList.remove('active');
}

async function fetchHybridDetour(userId) {
    const modalBody = document.getElementById('aiModalBody');
    try {
        const res = await fetch(`${API_BASE}/api/hybrid-detour/${userId}`, { method: 'POST' });
        aiDetourItem = await res.json();
        
        modalBody.innerHTML = `
            <div class="ai-message-bubble">"${aiDetourItem.aiMessage}"</div>
            <div class="detour-card" style="margin-bottom: 16px; border: 1px solid rgba(219,39,119,0.3); background: linear-gradient(to right, rgba(124,58,237,0.05), rgba(219,39,119,0.05)); justify-content: space-between;">
                <div style="display: flex; gap: 12px; align-items: center;">
                    <div class="detour-img"></div>
                    <div class="detour-info">
                        <h4>${aiDetourItem.productName}</h4>
                        <p style="font-size:10px; color:var(--swiggy-orange); font-weight:500;">✨ Recommended for you</p>
                        <p>₹${aiDetourItem.price.toFixed(2)}</p>
                    </div>
                </div>
                <button class="add-btn-small" style="background: var(--ai-gradient); color: white; border: none; padding: 8px 16px;" onclick="acceptDetour(this)">ADD</button>
            </div>
            
            <h4 style="font-size: 13px; margin-bottom: 8px;">Trending right now</h4>
            <div class="more-items-grid" style="margin-top:0;">
                ${fullCatalog.sort(() => 0.5 - Math.random()).slice(0, 3).map(i => `
                    <div class="more-item-card" onclick="trackEvent('AI_MODAL_TRENDING_ADD', '${i.productId}', 'home_modal'); addRegularItem('${i.productId}')" style="cursor: pointer; position: relative;">
                        <div style="position: absolute; top: 4px; right: 4px; background: #eef2ff; color: #4f46e5; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold;">+</div>
                        <p style="font-size:11px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding-top: 12px;">${i.name}</p>
                        <p style="font-size:12px; font-weight:700;">₹${i.price}</p>
                    </div>
                `).join('')}
            </div>

            <div class="modal-actions">
                <button class="skip-btn" style="width: 100%; background: #282c3f; color: white; border: none; font-size: 15px; padding: 14px;" onclick="closeModal(); goToHome();">Go to Home Page</button>
            </div>
            ${aiDetourItem.isFallback ? '<div style="font-size:10px; color:#f05a26; margin-top:8px; text-align:center;">(Deterministic Fallback)</div>' : ''}
        `;
        
        trackEvent('AI_MODAL_SHOWN', aiDetourItem.productId, 'home_modal');
        
    } catch(e) {
        modalBody.innerHTML = `<p style="text-align:center;">Something went wrong.</p>`;
    }
}

function acceptDetour(btn) {
    if (btn.dataset.added === "true") return;
    
    btn.innerHTML = 'Added <i data-lucide="check"></i>';
    btn.style.background = '#16a34a';
    btn.dataset.added = "true";
    lucide.createIcons();
    
    trackEvent('AI_MODAL_ADD', aiDetourItem.productId, 'home_modal');
    addRegularItem(aiDetourItem.productId);
}

function addRegularItem(productId) {
    const item = fullCatalog.find(i => i.productId === productId);
    if(!item) return;
    
    const existing = cart.find(i => i.id === productId);
    if(existing) {
        existing.qty++;
    } else {
        cart.push({
            id: item.productId,
            name: item.name,
            price: item.price,
            qty: 1
        });
    }
    updateCartUI();
    
    const btn = document.getElementById('viewCartFooter');
    btn.style.transform = 'scale(1.05)';
    setTimeout(() => btn.style.transform = 'scale(1)', 200);
}

function decrementItem(productId) {
    const index = cart.findIndex(i => i.id === productId);
    if(index !== -1) {
        cart[index].qty--;
        if(cart[index].qty <= 0) {
            cart.splice(index, 1);
        }
    }
    updateCartUI();
}

function updateCartUI() {
    // Also re-render reorder grid to update steppers if we are on that tab
    if(document.getElementById('reorderView').classList.contains('active')) {
        renderReorderGrid();
    }
    
    // Auto-update products on home page to show steppers
    if(document.getElementById('homeView').classList.contains('active')) {
        renderProducts(currentProducts);
    }
    
    // Auto-update checkout page if active
    if(document.getElementById('cartView').classList.contains('active')) {
        if(cart.length === 0) {
            goToHome();
        } else {
            renderCartPage();
        }
    }
    
    const footer = document.getElementById('viewCartFooter');
    if (cart.length === 0 || document.getElementById('cartView').classList.contains('active')) {
        footer.style.display = 'none';
        return;
    }
    footer.style.display = 'flex';
    
    let totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    let totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    document.getElementById('footerItemCount').innerText = `${totalItems} Item${totalItems > 1 ? 's' : ''}`;
    document.getElementById('footerTotal').innerText = `₹${totalPrice.toFixed(2)}`;
}

function goToCart() {
    document.getElementById('homeView').classList.remove('active');
    document.getElementById('reorderView').classList.remove('active');
    document.getElementById('cartView').classList.add('active');
    updateCartUI(); // this will hide the view cart footer and update prices
}

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
