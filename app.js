// Global variables
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentSort = { field: null, direction: 'asc' };
let currentProductId = null;

// API Base URL
const API_URL = 'https://api.escuelajs.co/api/v1/products';

// Initialize app
document.addEventListener('DOMContentLoaded', function () {
    loadProducts();

    // Event listeners
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('itemsPerPage').addEventListener('change', handleItemsPerPageChange);

    // Initialize Bootstrap tooltips
    initializeTooltips();
});

// Load products from API
async function loadProducts() {
    showLoading(true);
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch products');

        allProducts = await response.json();
        filteredProducts = [...allProducts];
        currentPage = 1;
        renderTable();
        renderPagination();
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Không thể tải dữ liệu sản phẩm. Vui lòng thử lại!');
    } finally {
        showLoading(false);
    }
}

// Show/hide loading spinner
function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();

    if (searchTerm === '') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm)
        );
    }

    currentPage = 1;
    renderTable();
    renderPagination();
}

// Handle items per page change
function handleItemsPerPageChange(e) {
    itemsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderTable();
    renderPagination();
}

// Sort table
function sortTable(field) {
    if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.direction = 'asc';
    }

    filteredProducts.sort((a, b) => {
        let aValue = a[field];
        let bValue = b[field];

        if (field === 'title') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (currentSort.direction === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    renderTable();
}

// Render table
function renderTable() {
    const tbody = document.getElementById('productTableBody');
    tbody.innerHTML = '';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);

    if (pageProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Không tìm thấy sản phẩm nào</td></tr>';
        return;
    }

    pageProducts.forEach(product => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-bs-toggle', 'tooltip');
        tr.setAttribute('data-bs-placement', 'top');
        tr.setAttribute('data-bs-html', 'true');
        tr.setAttribute('title', `<strong>Description:</strong><br>${escapeHtml(product.description || 'No description')}`);
        tr.onclick = () => showProductDetail(product.id);

        // Get first image or placeholder
        const imageUrl = product.images && product.images.length > 0
            ? product.images[0].replace(/[\[\]"]/g, '')
            : 'https://via.placeholder.com/60';

        tr.innerHTML = `
            <td><span class="badge bg-secondary">${product.id}</span></td>
            <td><strong>${escapeHtml(product.title)}</strong></td>
            <td><span class="badge bg-success">$${product.price}</span></td>
            <td>${product.category ? escapeHtml(product.category.name) : 'N/A'}</td>
            <td><img src="${imageUrl}" alt="${escapeHtml(product.title)}" class="product-image" onerror="this.src='https://via.placeholder.com/60'"></td>
        `;

        tbody.appendChild(tr);
    });

    // Reinitialize tooltips
    initializeTooltips();

    // Update page info
    updatePageInfo();
}

// Initialize Bootstrap tooltips
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
        // Dispose old tooltip if exists
        const oldTooltip = bootstrap.Tooltip.getInstance(tooltipTriggerEl);
        if (oldTooltip) {
            oldTooltip.dispose();
        }
        // Create new tooltip
        new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Render pagination
function renderPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    if (totalPages <= 1) return;

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">Previous</a>`;
    pagination.appendChild(prevLi);

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>`;
        pagination.appendChild(li);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">Next</a>`;
    pagination.appendChild(nextLi);
}

// Change page
function changePage(page) {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    renderTable();
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Update page info
function updatePageInfo() {
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredProducts.length);
    const total = filteredProducts.length;

    document.getElementById('pageInfo').textContent =
        `Hiển thị ${startIndex}-${endIndex} trong tổng số ${total} sản phẩm`;
}

// Show product detail
async function showProductDetail(productId) {
    currentProductId = productId;
    showLoading(true);

    try {
        const response = await fetch(`${API_URL}/${productId}`);
        if (!response.ok) throw new Error('Failed to fetch product details');

        const product = await response.json();
        renderProductDetail(product, false);

        const modal = new bootstrap.Modal(document.getElementById('detailModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading product details:', error);
        alert('Không thể tải chi tiết sản phẩm!');
    } finally {
        showLoading(false);
    }
}

// Render product detail
function renderProductDetail(product, editMode = false) {
    const modalBody = document.getElementById('detailModalBody');

    if (!editMode) {
        // View mode
        const images = product.images && product.images.length > 0
            ? product.images.map(img => img.replace(/[\[\]"]/g, '')).filter(img => img)
            : ['https://via.placeholder.com/300'];

        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div id="productCarousel" class="carousel slide" data-bs-ride="carousel">
                        <div class="carousel-inner">
                            ${images.map((img, index) => `
                                <div class="carousel-item ${index === 0 ? 'active' : ''}">
                                    <img src="${img}" class="d-block w-100" alt="Product image" onerror="this.src='https://via.placeholder.com/300'">
                                </div>
                            `).join('')}
                        </div>
                        ${images.length > 1 ? `
                            <button class="carousel-control-prev" type="button" data-bs-target="#productCarousel" data-bs-slide="prev">
                                <span class="carousel-control-prev-icon"></span>
                            </button>
                            <button class="carousel-control-next" type="button" data-bs-target="#productCarousel" data-bs-slide="next">
                                <span class="carousel-control-next-icon"></span>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="col-md-6">
                    <h4>${escapeHtml(product.title)}</h4>
                    <p class="text-muted">ID: ${product.id}</p>
                    <h5 class="text-success">$${product.price}</h5>
                    <hr>
                    <p><strong>Category:</strong> ${product.category ? escapeHtml(product.category.name) : 'N/A'}</p>
                    <p><strong>Description:</strong></p>
                    <p>${escapeHtml(product.description || 'No description available')}</p>
                </div>
            </div>
        `;
    } else {
        // Edit mode
        const images = product.images && product.images.length > 0
            ? product.images.map(img => img.replace(/[\[\]"]/g, '')).join(', ')
            : '';

        modalBody.innerHTML = `
            <form id="editForm">
                <div class="mb-3">
                    <label class="form-label">Title *</label>
                    <input type="text" class="form-control" id="editTitle" value="${escapeHtml(product.title)}" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Price *</label>
                    <input type="number" class="form-control" id="editPrice" value="${product.price}" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Description *</label>
                    <textarea class="form-control" id="editDescription" rows="3" required>${escapeHtml(product.description || '')}</textarea>
                </div>
                <div class="mb-3">
                    <label class="form-label">Category ID *</label>
                    <input type="number" class="form-control" id="editCategoryId" value="${product.category ? product.category.id : ''}" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Images (URLs, phân cách bằng dấu phẩy) *</label>
                    <textarea class="form-control" id="editImages" rows="2" required>${images}</textarea>
                </div>
                <div class="d-flex gap-2">
                    <button type="button" class="btn btn-secondary" onclick="showProductDetail(${product.id})">Hủy</button>
                    <button type="button" class="btn btn-primary" onclick="updateProduct()">
                        <i class="bi bi-save"></i> Lưu thay đổi
                    </button>
                </div>
            </form>
        `;
    }
}

// Enable edit mode
function enableEdit() {
    if (!currentProductId) return;

    fetch(`${API_URL}/${currentProductId}`)
        .then(response => response.json())
        .then(product => renderProductDetail(product, true))
        .catch(error => {
            console.error('Error:', error);
            alert('Không thể chuyển sang chế độ chỉnh sửa!');
        });
}

// Update product
async function updateProduct() {
    const title = document.getElementById('editTitle').value.trim();
    const price = parseFloat(document.getElementById('editPrice').value);
    const description = document.getElementById('editDescription').value.trim();
    const categoryId = parseInt(document.getElementById('editCategoryId').value);
    const imagesText = document.getElementById('editImages').value.trim();

    if (!title || !price || !description || !categoryId || !imagesText) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
    }

    const images = imagesText.split(',').map(img => img.trim()).filter(img => img);

    const productData = {
        title,
        price,
        description,
        categoryId,
        images
    };

    showLoading(true);

    try {
        const response = await fetch(`${API_URL}/${currentProductId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) throw new Error('Failed to update product');

        const updatedProduct = await response.json();
        alert('Cập nhật sản phẩm thành công!');

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('detailModal'));
        modal.hide();

        // Reload products
        loadProducts();
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Không thể cập nhật sản phẩm. Vui lòng thử lại!');
    } finally {
        showLoading(false);
    }
}

// Create product
async function createProduct() {
    const title = document.getElementById('createTitle').value.trim();
    const price = parseFloat(document.getElementById('createPrice').value);
    const description = document.getElementById('createDescription').value.trim();
    const categoryId = parseInt(document.getElementById('createCategoryId').value);
    const imagesText = document.getElementById('createImages').value.trim();

    if (!title || !price || !description || !categoryId || !imagesText) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
    }

    const images = imagesText.split(',').map(img => img.trim()).filter(img => img);

    const productData = {
        title,
        price,
        description,
        categoryId,
        images
    };

    showLoading(true);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) throw new Error('Failed to create product');

        const newProduct = await response.json();
        alert('Tạo sản phẩm mới thành công!');

        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('createModal'));
        modal.hide();
        document.getElementById('createForm').reset();

        // Reload products
        loadProducts();
    } catch (error) {
        console.error('Error creating product:', error);
        alert('Không thể tạo sản phẩm mới. Vui lòng thử lại!');
    } finally {
        showLoading(false);
    }
}

// Export to CSV
function exportToCSV() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);

    if (pageProducts.length === 0) {
        alert('Không có dữ liệu để xuất!');
        return;
    }

    // CSV headers
    let csv = 'ID,Title,Price,Category,Description,Images\n';

    // CSV data
    pageProducts.forEach(product => {
        const title = escapeCSV(product.title);
        const price = product.price;
        const category = product.category ? escapeCSV(product.category.name) : '';
        const description = escapeCSV(product.description || '');
        const images = product.images && product.images.length > 0
            ? escapeCSV(product.images.map(img => img.replace(/[\[\]"]/g, '')).join('; '))
            : '';

        csv += `${product.id},${title},${price},${category},${description},${images}\n`;
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `products_page_${currentPage}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Escape CSV
function escapeCSV(text) {
    if (typeof text !== 'string') return '';
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
}
