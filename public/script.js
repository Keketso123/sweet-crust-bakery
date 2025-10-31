// script.js
const form = document.getElementById('orderForm');
const ordersTableBody = document.querySelector('#ordersTable tbody');
const formMessage = document.getElementById('formMessage');
const tableMessage = document.getElementById('tableMessage');

const API_BASE = '/api';

async function fetchOrders() {
  try {
    const res = await fetch(API_BASE + '/orders');
    const data = await res.json();
    renderOrders(data);
  } catch (err) {
    console.error(err);
    tableMessage.textContent = 'Failed to load orders.';
  }
}

function renderOrders(orders) {
  ordersTableBody.innerHTML = '';
  if (!orders || orders.length === 0) {
    tableMessage.textContent = 'No orders yet.';
    return;
  }
  tableMessage.textContent = '';
  orders.forEach((o, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${escapeHtml(o.order_id)}</td>
      <td>${escapeHtml(o.customer_name)}</td>
      <td>${escapeHtml(o.product_ordered)}</td>
      <td>${o.quantity}</td>
      <td>${formatDate(o.order_date)}</td>
      <td>
        <span class="badge ${o.order_status === 'Completed' ? 'completed' : 'pending'}">
          ${o.order_status}
        </span>
      </td>
      <td>
        <button class="action-btn edit" data-id="${o.id}" data-action="toggle">${o.order_status === 'Pending' ? 'Mark Completed' : 'Mark Pending'}</button>
        <button class="action-btn delete" data-id="${o.id}" data-action="delete">Delete</button>
      </td>
    `;
    ordersTableBody.appendChild(tr);
  });

  // attach event listeners (delegation)
  document.querySelectorAll('.action-btn').forEach(btn =>
    btn.addEventListener('click', handleAction)
  );
}

function escapeHtml(unsafe) {
  return String(unsafe).replace(/[&<>"'\/]/g, function (s) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;'
    }[s];
  });
}

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toISOString().slice(0,10);
}

async function handleAction(e) {
  const btn = e.currentTarget;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if (action === 'delete') {
    if (!confirm('Delete this order?')) return;
    try {
      const res = await fetch(`${API_BASE}/orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchOrders();
      } else {
        const err = await res.json();
        alert(err.error || 'Delete failed');
      }
    } catch (err) {
      alert('Delete failed');
    }
  } else if (action === 'toggle') {
    try {
      // Find current status from button label
      const row = btn.closest('tr');
      const statusCell = row.querySelector('.badge');
      const newStatus = statusCell.textContent.trim() === 'Pending' ? 'Completed' : 'Pending';
      const res = await fetch(`${API_BASE}/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status: newStatus })
      });
      if (res.ok) {
        fetchOrders();
      } else {
        const err = await res.json();
        alert(err.error || 'Update failed');
      }
    } catch (err) {
      alert('Update failed');
    }
  }
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  formMessage.textContent = '';
  const payload = {
    order_id: form.order_id.value.trim(),
    customer_name: form.customer_name.value.trim(),
    product_ordered: form.product_ordered.value,
    quantity: form.quantity.value,
    order_date: form.order_date.value,
    order_status: form.order_status.value
  };

  // client-side validation
  const errors = [];
  if (!payload.order_id) errors.push('Order ID is required');
  if (!payload.customer_name) errors.push('Customer name is required');
  if (!payload.product_ordered) errors.push('Product ordered is required');
  if (!payload.quantity || isNaN(Number(payload.quantity)) || Number(payload.quantity) <= 0) errors.push('Quantity must be a positive number');
  if (!payload.order_date) errors.push('Order date is required');

  if (errors.length) {
    formMessage.style.color = 'crimson';
    formMessage.textContent = errors.join(' • ');
    return;
  }

  try {
    const res = await fetch(API_BASE + '/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      formMessage.style.color = 'crimson';
      formMessage.textContent = (data.errors || data.error || ['Failed to add order']).join ? (data.errors || data.error).join(' • ') : (data.error || 'Failed to add order');
      return;
    }
    formMessage.style.color = 'green';
    formMessage.textContent = 'Order added successfully';
    form.reset();
    fetchOrders();
  } catch (err) {
    formMessage.style.color = 'crimson';
    formMessage.textContent = 'Network or server error';
  }
});

// initial load
fetchOrders();

// ====== Toggle between Make Order and View Orders ======
const makeOrderBtn = document.getElementById('makeOrderBtn');
const viewOrdersBtn = document.getElementById('viewOrdersBtn');
const formSection = document.getElementById('formSection');
const tableSection = document.getElementById('tableSection');

makeOrderBtn.addEventListener('click', () => {
  makeOrderBtn.classList.add('active');
  viewOrdersBtn.classList.remove('active');
  formSection.classList.remove('hidden');
  tableSection.classList.add('hidden');
});

viewOrdersBtn.addEventListener('click', () => {
  viewOrdersBtn.classList.add('active');
  makeOrderBtn.classList.remove('active');
  formSection.classList.add('hidden');
  tableSection.classList.remove('hidden');
  fetchOrders(); // refresh table every time you view
});

