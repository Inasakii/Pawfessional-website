
document.addEventListener("DOMContentLoaded", () => {
  const SERVER_URL = 'https://pawfessional-api-server.onrender.com';

  // Element selectors
  const catCheckbox = document.getElementById("cat-checkbox");
  const dogCheckbox = document.getElementById("dog-checkbox");
  const brandFilterContainer = document.querySelector("#brand-filter .filter-content");
  const categoryCheckboxes = Array.from(document.querySelectorAll('#category-filter input[type="checkbox"]'));
  const lifeStageCheckboxes = Array.from(document.querySelectorAll('#lifestage-filter input[type="checkbox"]'));
  
  const productsList = document.getElementById("products-list");
  const resultsInfo = document.getElementById("results-info");
  const categoryTitle = document.getElementById("category-title");
  const sortSelect = document.getElementById("sort-select");

  const modal = document.getElementById("productModal");
  const closeModalBtn = document.getElementById("closeModal");

  const searchInput = document.getElementById("searchInput");
  const suggestionsContainer = document.getElementById("suggestions");
  const clearBtn = document.querySelector(".clr-btn");
  const lowerPageControls = document.querySelector(".lower-page-controls");

  // State
  let allProducts = [];
  let filters = {
    petTypes: new Set(),
    brands: new Set(),
    categories: new Set(),
    lifeStages: new Set()
  };
  let sortOption = "relevancy";
  let searchQuery = "";
  let currentPage = 1;
  let resultsPerPage = 9;

  // Initialize dynamic elements
  if (lowerPageControls) {
    const paginationContainer = document.createElement("div");
    paginationContainer.id = "pagination";
    lowerPageControls.appendChild(paginationContainer);

    const resultsPerPageContainer = document.createElement("div");
    resultsPerPageContainer.className = "results-per-page-container";
    const resultsLabel = document.createElement("span");
    resultsLabel.textContent = "Results per page:";
    resultsPerPageContainer.appendChild(resultsLabel);
    [9, 18, 27, 36, 45].forEach(num => {
      const btn = document.createElement("button");
      btn.textContent = num;
      if (num === resultsPerPage) btn.classList.add("active");
      btn.addEventListener("click", () => {
        resultsPerPage = num;
        currentPage = 1;
        document.querySelectorAll('.results-per-page-container button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderProducts();
      });
      resultsPerPageContainer.appendChild(btn);
    });
    lowerPageControls.appendChild(resultsPerPageContainer);
  }

  // === DATA FETCHING & SOCKETS ===
  async function fetchProducts() {
    try {
      const res = await fetch(`${SERVER_URL}/api/public/products`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      allProducts = await res.json();
      populateFilters();
      renderProducts();
    } catch (err) {
      console.error("Error fetching products:", err);
      if (productsList) {
        productsList.innerHTML = `<p class="no-products-message">Failed to load products. Please check the connection.</p>`;
      }
    }
  }

  try {
    const socket = io(SERVER_URL);
    socket.on("products_update", (updatedProducts) => {
      console.log("🔄 Products updated via socket:", updatedProducts);
      fetchProducts();
    });
  } catch(e) {
    console.error("Socket.io connection failed:", e);
  }


  // === FILTER POPULATION ===
  function populateFilters() {
    if(!brandFilterContainer) return;
    const brands = [...new Set(allProducts.map(p => p.brand))].sort();
    brandFilterContainer.innerHTML = brands.map(brand => `
      <label><input type="checkbox" value="${brand}" data-filter-type="brands">${brand}</label>
    `).join('');
    document.querySelectorAll('#brand-filter input').forEach(cb => 
      cb.addEventListener('change', handleFilterChange)
    );
  }
  
  // === RENDERING ===
  function renderProducts() {
    if (!productsList) return;
    let filtered = [...allProducts];

    // Apply Sorting
    switch (sortOption) {
      case "recent": filtered.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      case "price-low": filtered.sort((a, b) => a.price - b.price); break;
      case "price-high": filtered.sort((a, b) => b.price - a.price); break;
    }

    // Apply Filtering
    filtered = filtered.filter(p => {
      if (filters.petTypes.size && !filters.petTypes.has(p.petType) && p.petType !== "Dog and Cat") return false;
      if (filters.brands.size && !filters.brands.has(p.brand)) return false;
      if (filters.categories.size && !filters.categories.has(p.category)) return false;
      if (filters.lifeStages.size > 0 && !filters.lifeStages.has(p.life_stage?.toLowerCase())) return false;
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.pname.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    const totalResults = filtered.length;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    const start = (currentPage - 1) * resultsPerPage;
    const end = start + resultsPerPage;
    const paginated = filtered.slice(start, end);

    if (resultsInfo) resultsInfo.textContent = `Showing ${paginated.length} of ${totalResults} results`;
    if (categoryTitle) categoryTitle.textContent = filters.petTypes.size === 1
      ? `${Array.from(filters.petTypes)[0]} Products`
      : "All Products";

    productsList.innerHTML = paginated.length ? "" : '<p class="no-products-message">No products found for the selected filters.</p>';

    paginated.forEach(p => {
      const card = document.createElement("article");
      card.className = "product-card";
      let priceHtml = `<span>₱${Number(p.price).toLocaleString()}</span>`;
      if (p.disc && p.disc > 0) {
        const discounted = (p.price - (p.price * (p.disc / 100))).toFixed(2);
        priceHtml = `<span class="price-original">₱${Number(p.price).toLocaleString()}</span> <span class="price-discounted">₱${Number(discounted).toLocaleString()} (-${p.disc}%)</span>`;
      }
      card.innerHTML = `
        <img src="${p.image ? `${SERVER_URL}${p.image}` : './Assets/Images/no-image.png'}" alt="${p.pname}" class="product-image"/>
        <div class="product-info"><h3>${p.pname}</h3><p class="brand">${p.brand}</p><div class="price">${priceHtml}</div></div>
        <button class="info-btn" aria-label="More info about ${p.pname}"><i class="fas fa-circle-info"></i></button>`;
      card.querySelector(".info-btn").addEventListener("click", () => openProductModal(p));
      productsList.appendChild(card);
    });
    const paginationContainer = document.getElementById("pagination");
    if (paginationContainer) renderPagination(totalPages, paginationContainer);
  }

  function renderPagination(totalPages, container) {
    container.innerHTML = "";
    if (totalPages <= 1) return;
    const createBtn = (content, onClick, disabled = false) => {
        const btn = document.createElement("button");
        btn.innerHTML = content;
        btn.disabled = disabled;
        btn.addEventListener("click", onClick);
        return btn;
    };
    container.appendChild(createBtn('<i class="fas fa-chevron-left"></i>', () => { currentPage--; renderProducts(); }, currentPage === 1));
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = createBtn(i, () => { currentPage = i; renderProducts(); });
        if (i === currentPage) pageBtn.classList.add("active");
        container.appendChild(pageBtn);
    }
    container.appendChild(createBtn('<i class="fas fa-chevron-right"></i>', () => { currentPage++; renderProducts(); }, currentPage === totalPages));
  }

  // === MODAL LOGIC ===
  function openProductModal(product) {
    let priceText = `₱${Number(product.price).toLocaleString()}`;
    if (product.disc && product.disc > 0) {
      const discounted = (product.price - (product.price * (product.disc / 100))).toFixed(2);
      priceText = `₱${Number(discounted).toLocaleString()} <span class="price-original" style="font-size: 0.8em; color: #6b7280;">(Discount: ${product.disc}%)</span>`;
    }
    document.getElementById("modalImage").src = product.image ? `${SERVER_URL}${product.image}` : './Assets/Images/no-image.png';
    document.getElementById("modalTitle").textContent = product.pname;
    document.getElementById("modalBrand").innerHTML = `<strong>Brand:</strong> ${product.brand}`;
    document.getElementById("modalCategory").innerHTML = `<strong>Category:</strong> ${product.category}`;
    document.getElementById("modalLifeStage").innerHTML = `<strong>Life Stage:</strong> ${product.life_stage}`;
    document.getElementById("modalPetType").innerHTML = `<strong>Pet Type:</strong> ${product.petType}`;
    document.getElementById("modalDescription").textContent = product.description || "No description available.";
    document.getElementById("modalPrice").innerHTML = priceText;
    if (modal) modal.classList.add("visible");
  }

  function closeModal() {
    if (modal) modal.classList.remove("visible");
  }

  // === EVENT LISTENERS ===
  function handleFilterChange(e) {
    const { checked, value, dataset: { filterType } } = e.target;
    if (filterType && filters[filterType]) {
        checked ? filters[filterType].add(value) : filters[filterType].delete(value);
    }
    currentPage = 1;
    renderProducts();
  }

  function updateFiltersAndRender() {
    filters.petTypes.clear();
    if (catCheckbox && catCheckbox.checked) filters.petTypes.add("Cat");
    if (dogCheckbox && dogCheckbox.checked) filters.petTypes.add("Dog");

    filters.lifeStages.clear();
    lifeStageCheckboxes.forEach(cb => { if (cb.checked) filters.lifeStages.add(cb.value.toLowerCase()); });
    
    filters.categories.clear();
    categoryCheckboxes.forEach(cb => { if (cb.checked) filters.categories.add(cb.value); });
    
    currentPage = 1;
    renderProducts();
  }

  if (catCheckbox) catCheckbox.addEventListener('change', updateFiltersAndRender);
  if (dogCheckbox) dogCheckbox.addEventListener('change', updateFiltersAndRender);
  lifeStageCheckboxes.forEach(cb => cb.addEventListener('change', updateFiltersAndRender));
  categoryCheckboxes.forEach(cb => cb.addEventListener('change', updateFiltersAndRender));

  if(clearBtn) clearBtn.addEventListener("click", () => {
    document.querySelectorAll('.filter-block input[type="checkbox"]').forEach(cb => cb.checked = false);
    filters = { petTypes: new Set(), brands: new Set(), categories: new Set(), lifeStages: new Set() };
    currentPage = 1;
    renderProducts();
  });

  if(sortSelect) sortSelect.addEventListener("change", () => { sortOption = sortSelect.value; renderProducts(); });
  
  // Search and Suggestions
  function showSuggestions(suggestions) {
    if (!suggestionsContainer) return;
    if (suggestions.length === 0 || !searchQuery) {
        suggestionsContainer.style.display = 'none'; return;
    }
    suggestionsContainer.innerHTML = suggestions.map(s => `<div class="suggestion-item">${s}</div>`).join('');
    suggestionsContainer.style.display = 'block';
    document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            searchInput.value = item.textContent;
            searchQuery = item.textContent;
            suggestionsContainer.style.display = 'none';
            renderProducts();
        });
    });
  }

  if(searchInput) searchInput.addEventListener("input", function () {
    searchQuery = this.value.trim();
    renderProducts();
    if (!searchQuery) { showSuggestions([]); return; }
    const q = searchQuery.toLowerCase();
    const nameMatches = allProducts.filter(p => p.pname.toLowerCase().includes(q)).map(p => p.pname);
    showSuggestions([...new Set(nameMatches)].slice(0, 8));
  });
  
  document.addEventListener('click', (e) => {
    if (suggestionsContainer && !suggestionsContainer.contains(e.target) && e.target !== searchInput) {
        suggestionsContainer.style.display = 'none';
    }
  });

  if(closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if(modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  fetchProducts();
});
