const categoryImages = {
    hamburguesas: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500',
    'perros-calientes': 'https://images.unsplash.com/photo-1541214113241-21578d2d9b62?auto=format&fit=crop&q=80&w=500',
    'salchipapas-familiares': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=500',
    salchipapas: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=500',
    desgranados: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=500',
    sandwiches: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=500',
    'arepa-picada': 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=500',
    'chuzo-pan': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=500',
    asados: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=500',
    patacones: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&q=80&w=500',
    pizzas: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad50?auto=format&fit=crop&q=80&w=500',
    bebidas: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=500'
};

function buildProductsFromMenu() {
    if (typeof menuData === 'undefined') return [];
    return menuData.categorias.flatMap(category =>
        category.productos
            .filter(product => product.disponible)
            .map(product => ({
                id: product.id,
                category: category.id,
                categoryName: category.nombre,
                name: product.nombre,
                price: product.precio,
                img: categoryImages[category.id] || 'assets/img/hero.png',
                desc: product.descripcion
            }))
    );
}

const products = buildProductsFromMenu();

let cart = [];
let db;

// Firebase Init
(function initFirebase() {
    if (typeof firebase === 'undefined') return;
    const config = {
        apiKey: "AIzaSyAxmv1QtEMtFU9lHIjFULdlFbjJRn8-Xuo",
        authDomain: "streetfood-bga.firebaseapp.com",
        projectId: "streetfood-bga",
        storageBucket: "streetfood-bga.firebasestorage.app",
        messagingSenderId: "29645475094",
        appId: "1:29645475094:web:7e0618d42d61ee484c1437",
        measurementId: "G-54479KKM8V"
    };
    firebase.initializeApp(config);
    db = firebase.firestore();
})();

// DOM Elements
const productGrid = document.getElementById('product-grid');
const categoriesContainer = document.querySelector('.categories');
let categoryBtns = document.querySelectorAll('.category-card, .category-todos-btn');
const cartSidebar = document.getElementById('cart-sidebar');
const cartCount = document.querySelector('.cart-count');
const cartTotal = document.getElementById('cart-total');
const cartIcon = document.getElementById('cart-icon');
const closeCart = document.getElementById('close-cart');
const header = document.querySelector('header');

const statusBadge = document.getElementById('status-badge');
const finalizeBtn = document.getElementById('finalize-btn');
const clientNameInput = document.getElementById('client-name');
const clientPhoneInput = document.getElementById('client-phone');
const clientAddressInput = document.getElementById('client-address');
const paymentMethodInput = document.getElementById('payment-method');
const orderNotesInput = document.getElementById('order-notes');
const deliveryTypeSelect = document.getElementById('delivery-type');
const addressContainer = document.getElementById('address-container');

const confirmModal = document.getElementById('confirm-modal');
const orderNumberSpan = document.getElementById('order-number');
const closeModalBtn = document.getElementById('close-modal-btn');

const OPEN_HOUR = 0;
const CLOSE_HOUR = 24;
let currentCategory = 'todos';

// ===== TOAST =====
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()">&times;</button>`;
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('toast-removing');
            setTimeout(() => toast.remove(), 250);
        }
    }, 3500);
}

// ===== LOADING STATE =====
function showLoading(btn) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerText;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
}
function hideLoading(btn) {
    btn.disabled = false;
    btn.innerText = btn.dataset.originalText || btn.innerText;
}

// ===== IMAGE FALLBACK =====
function handleImageError(img) {
    if (img.dataset.fallback) return;
    img.dataset.fallback = 'true';
    img.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22250%22%3E%3Crect fill=%22%23222%22 width=%22300%22 height=%22250%22/%3E%3C/svg%3E';
}

// ===== CART QUANTITY =====
function changeQuantity(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
    updateCart();
}

// ===== CART PERSISTENCE =====
function saveCartToStorage() {
    localStorage.setItem('streetfood_cart', JSON.stringify(cart));
}
function loadCartFromStorage() {
    try {
        const saved = localStorage.getItem('streetfood_cart');
        if (saved) {
            cart = JSON.parse(saved).filter(item => products.some(product => product.id === item.id));
        }
    } catch (e) { /* ignore */ }
}

// ===== MOBILE MENU =====
function toggleMobileMenu() {
    document.getElementById('hamburger-btn')?.classList.toggle('active');
    document.getElementById('main-nav')?.classList.toggle('open');
}
function closeMobileMenu() {
    document.getElementById('hamburger-btn')?.classList.remove('active');
    document.getElementById('main-nav')?.classList.remove('open');
}

window.addEventListener('DOMContentLoaded', () => {
    renderCategoryButtons();
    renderFooterCategories();
    setupCategoryFilters();
    setupFooterCategoryLinks();
    loadCartFromStorage();
    displayProducts('todos');
    updateCart();
    checkStoreStatus();
    loadUserData();
});

// Scroll Header Effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Check Store Status
function checkStoreStatus() {
    const now = new Date();
    const hour = now.getHours();
    const min = now.getMinutes();
    let isOpen = (hour >= OPEN_HOUR && hour < CLOSE_HOUR);

    if (isOpen) {
        statusBadge.innerText = 'Abierto';
        statusBadge.className = 'status-badge status-open';
    } else {
        statusBadge.innerText = 'Cerrado';
        statusBadge.className = 'status-badge status-closed';
        finalizeBtn.innerText = 'Estamos Cerrados';
        finalizeBtn.disabled = true;
        finalizeBtn.style.opacity = '0.5';
    }
}

// Display Products
function displayProducts(category) {
    currentCategory = category;
    const searchTerm = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
    const heading = document.getElementById('section-heading');
    if (heading) {
        const cat = menuData.categorias.find(c => c.id === category);
        heading.textContent = category === 'todos' ? 'Todos los productos' : cat?.nombre || '';
    }

    let filteredProducts = category === 'todos' 
        ? products 
        : products.filter(p => p.category === category);

    if (searchTerm) {
        filteredProducts = filteredProducts.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.desc.toLowerCase().includes(searchTerm)
        );
    }

    if (filteredProducts.length === 0) {
        productGrid.innerHTML = '<p class="empty-state--js">No se encontraron productos</p>';
        return;
    }

    productGrid.innerHTML = filteredProducts.map((product, index) => `
        <div class="product-card animate-fade" style="animation-delay:${index * 0.04}s">
            <img src="${product.img}" alt="${product.name}" class="product-img" loading="lazy" onerror="handleImageError(this)">
            <span class="product-tag">${product.categoryName}</span>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.desc}</p>
                <div class="product-footer">
                    <span class="price">$${product.price.toLocaleString()}</span>
                    <button class="add-btn" onclick="addToCart('${product.id}')">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Category Filter
function renderCategoryButtons() {
    if (!categoriesContainer || typeof menuData === 'undefined') return;
    categoriesContainer.innerHTML = `
        <div class="category-todos">
            <button class="category-todos-btn active" data-category="todos">
                <span>📋</span> Todos
            </button>
        </div>
        ${menuData.categorias.map(category =>
            `<button class="category-card" data-category="${category.id}" 
                     style="background-image: url('${categoryImages[category.id] || 'assets/img/hero.png'}')">
                <div class="category-card-overlay"></div>
                <span class="category-card-name">${category.nombre}</span>
            </button>`
        ).join('')}
    `;
    categoryBtns = document.querySelectorAll('.category-card, .category-todos-btn');
}

function setupCategoryFilters() {
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            displayProducts(btn.dataset.category);
            const heading = document.getElementById('section-heading');
            if (heading) {
                const top = heading.getBoundingClientRect().top + window.scrollY - 100;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
}

// Footer category links
function renderFooterCategories() {
    const footerCategories = document.getElementById('footer-categories');
    if (!footerCategories || typeof menuData === 'undefined') return;
    footerCategories.innerHTML = menuData.categorias.slice(0, 6).map(category =>
        `<a href="#menu" data-category="${category.id}">${category.nombre}</a>`
    ).join('');
}

function setupFooterCategoryLinks() {
    document.querySelectorAll('.footer-section a[data-category]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = link.dataset.category;
            const targetBtn = Array.from(categoryBtns).find(b => b.dataset.category === cat);
            if (targetBtn) targetBtn.click();
            const heading = document.getElementById('section-heading');
            if (heading) {
                const top = heading.getBoundingClientRect().top + window.scrollY - 100;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
}

// Cart Functions
function addToCart(id) {
    const product = products.find(p => p.id === id);
    const existing = cart.find(item => item.id === id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCart();
    openCart();
}

function updateCart() {
    const container = document.getElementById('cart-items');
    if (!container) return;

    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartCount.innerText = totalItems;
    
    if (cart.length === 0) {
        container.innerHTML = '<p class="cart__empty">Tu carrito está vacío</p>';
    } else {
        container.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.img}" alt="${item.name}" onerror="this.style.display='none'">
                <div class="cart-item-info">
                    <h4 class="cart__item-name">${item.name}</h4>
                    <div class="cart__item-unit-price">
                        $${item.price.toLocaleString()} c/u
                    </div>
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="changeQuantity('${item.id}', -1)" aria-label="Disminuir cantidad">−</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" onclick="changeQuantity('${item.id}', 1)" aria-label="Aumentar cantidad">+</button>
                        <button class="cart__remove-btn" onclick="removeFromCart('${item.id}')" title="Eliminar" aria-label="Eliminar producto">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="cart__item-subtotal">
                    $${(item.price * item.quantity).toLocaleString()}
                </div>
            </div>
        `).join('');
    }

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    cartTotal.innerText = `$${total.toLocaleString()}`;
    
    saveCartToStorage();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCart();
}

function openCart() {
    cartSidebar.classList.add('open');
}

function closeCartSidebar() {
    cartSidebar.classList.remove('open');
}

cartIcon.addEventListener('click', openCart);
closeCart.addEventListener('click', closeCartSidebar);

let cartTouchStartY = 0;
cartSidebar.addEventListener('touchstart', (e) => {
    cartTouchStartY = e.touches[0].clientY;
}, { passive: true });

cartSidebar.addEventListener('touchend', (e) => {
    const cartTouchEndY = e.changedTouches[0].clientY;
    if (window.innerWidth <= 768 && cartTouchEndY - cartTouchStartY > 80) {
        closeCartSidebar();
    }
}, { passive: true });

// Hamburger Menu
document.getElementById('hamburger-btn')?.addEventListener('click', toggleMobileMenu);
document.querySelectorAll('nav ul li a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
});

// Search
document.getElementById('search-input')?.addEventListener('input', () => {
    displayProducts(currentCategory);
});

// User Data
function loadUserData() {
    clientNameInput.value = localStorage.getItem('streetfood_name') || '';
    clientPhoneInput.value = localStorage.getItem('streetfood_phone') || '';
    clientAddressInput.value = localStorage.getItem('streetfood_address') || '';
    const savedDeliveryType = localStorage.getItem('streetfood_deliveryType');
    if (savedDeliveryType) deliveryTypeSelect.value = savedDeliveryType;
    toggleAddressField();
}

function saveUserData() {
    localStorage.setItem('streetfood_name', clientNameInput.value);
    localStorage.setItem('streetfood_phone', clientPhoneInput.value);
    localStorage.setItem('streetfood_address', clientAddressInput.value);
    localStorage.setItem('streetfood_deliveryType', deliveryTypeSelect.value);
}

function toggleAddressField() {
    if (deliveryTypeSelect.value === 'recoger') {
        addressContainer.style.display = 'none';
    } else {
        addressContainer.style.display = 'block';
    }
}

if(deliveryTypeSelect) {
    deliveryTypeSelect.addEventListener('change', toggleAddressField);
}

// Confirmation Modal
function showConfirmation(order) {
    orderNumberSpan.textContent = order.numero;
    document.getElementById('modal-type').textContent = order.tipo === 'domicilio' ? 'Domicilio' : 'Recoger en local';
    document.getElementById('modal-items').textContent = order.items.reduce(function (s, i) { return s + i.quantity; }, 0) + ' producto(s)';
    document.getElementById('modal-total').textContent = '$' + order.total.toLocaleString();
    confirmModal.classList.add('open');
    closeCartSidebar();
}

closeModalBtn.addEventListener('click', () => {
    confirmModal.classList.remove('open');
});

confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) confirmModal.classList.remove('open');
});

// Save order to Firebase
async function saveOrderToFirebase(order) {
    if (!db) return null;
    try {
        const docRef = await db.collection('pedidos').add(order);
        return docRef.id;
    } catch (err) {
        console.error('Error guardando pedido:', err);
        return null;
    }
}

async function getNextOrderNumber() {
    if (!db) return null;

    try {
        return await db.runTransaction(async (transaction) => {
            const counterRef = db.collection('contadores').doc('pedidos');
            const counterDoc = await transaction.get(counterRef);
            const currentNumber = counterDoc.exists ? (counterDoc.data().ultimo || 0) : 0;
            const nextNumber = currentNumber + 1;

            transaction.set(counterRef, {
                ultimo: nextNumber,
                actualizado: new Date().toISOString()
            }, { merge: true });

            return nextNumber;
        });
    } catch (err) {
        console.error('Error generando numero de pedido:', err);
        return null;
    }
}

// Save contact to Firebase
async function saveContactToFirebase(contact) {
    if (!db) return null;
    try {
        const docRef = await db.collection('contactos').add(contact);
        return docRef.id;
    } catch (err) {
        console.error('Error guardando contacto:', err);
        return null;
    }
}

document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const subject = document.getElementById('contact-subject').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !email || !subject || !message) return showToast('Completa todos los campos', 'warning');

    const contactData = {
        nombre: name,
        email: email,
        asunto: subject,
        mensaje: message,
        creado: new Date().toISOString()
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    showLoading(submitBtn);

    const docId = await saveContactToFirebase(contactData);

    hideLoading(submitBtn);

    if (docId) {
        showToast('Mensaje enviado correctamente. Te contactaremos pronto.', 'success');
        e.target.reset();
    } else {
        showToast('Error al enviar el mensaje. Revisa la consola.', 'error');
    }
});

// Finalize
finalizeBtn.addEventListener('click', async () => {
    if (cart.length === 0) return showToast('Tu carrito está vacío', 'warning');
    const name = clientNameInput.value.trim();
    const phone = clientPhoneInput.value.trim();
    const address = clientAddressInput.value.trim();
    const isDelivery = deliveryTypeSelect.value === 'domicilio';

    if (!name) return showToast('Por favor ingresa tu nombre', 'warning');
    if (!phone) return showToast('Por favor ingresa tu teléfono', 'warning');
    if (isDelivery && !address) return showToast('Completa la dirección de entrega', 'warning');
    if (isDelivery && !document.getElementById('delivery-accept').checked) return showToast('Debes aceptar que el costo del domicilio será confirmado por WhatsApp', 'warning');

    saveUserData();
    showLoading(finalizeBtn);

    const orderNumber = await getNextOrderNumber();
    if (!orderNumber) {
        hideLoading(finalizeBtn);
        showToast('No se pudo generar el número de pedido. Intenta de nuevo.', 'error');
        return;
    }

    const items = cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
    }));
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const orderData = {
        numero: orderNumber,
        cliente: name,
        telefono: phone,
        direccion: address,
        tipo: isDelivery ? 'domicilio' : 'recoger',
        pago: paymentMethodInput.value,
        notas: orderNotesInput.value,
        items: items,
        total: total,
        estado: 'nuevo',
        creado: new Date().toISOString()
    };

    // Build WhatsApp message
    let waMessage = `*PEDIDO #${orderNumber} - LA SAMARIA*\n`;
    waMessage += `══════════════════════\n\n`;
    waMessage += `*Cliente:* ${name}\n`;
    waMessage += `*Teléfono:* ${phone}\n`;
    waMessage += `*Tipo:* ${isDelivery ? 'Envio a Domicilio' : 'Paso a recoger'}\n`;
    if (isDelivery) {
        waMessage += `*Direccion:* ${address}\n`;
    }
    waMessage += `*Pago:* ${paymentMethodInput.value}\n`;
    if (orderNotesInput.value) waMessage += `*Notas:* ${orderNotesInput.value}\n`;
    waMessage += `\n*PRODUCTOS:*\n`;
    cart.forEach(item => {
        waMessage += `- ${item.quantity}x ${item.name} ($${(item.price * item.quantity).toLocaleString()})\n`;
    });
    waMessage += `\n*SUBTOTAL: $${total.toLocaleString()}*`;
    if (isDelivery) {
        waMessage += `\n_(+ Costo de domicilio por confirmar)_`;
        waMessage += `\n\n_¿Aceptas el costo del domicilio? Responde SÍ o NO_`;
    }

    const whatsappUrl = `https://api.whatsapp.com/send?phone=573022942381&text=${encodeURIComponent(waMessage)}`;
    if (/Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent)) {
        window.location.href = whatsappUrl;
    } else {
        window.open(whatsappUrl, '_blank');
    }

    // Save to Firebase
    const docId = await saveOrderToFirebase(orderData);
    hideLoading(finalizeBtn);

    if (!docId) {
        showToast('El pedido se envió por WhatsApp pero hubo un error al guardarlo.', 'error');
        return;
    }

    // Clear cart and show confirmation
    cart = [];
    updateCart();
    showConfirmation(orderData);
    showToast('Pedido #' + orderNumber + ' enviado con éxito', 'success');
});
