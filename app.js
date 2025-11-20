const API_URL = "https://jsonplaceholder.typicode.com/users";

// State trên client
let users = [];              // dữ liệu gốc lấy từ API
let currentPage = 1;
const pageSize = 5;          // mỗi trang 5 user
let currentSearch = "";      // từ khóa search

const userTableBody = document.getElementById("userTableBody");
const searchInput = document.getElementById("searchInput");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageInfo = document.getElementById("pageInfo");
const messageDiv = document.getElementById("message");

const userForm = document.getElementById("userForm");
const userIdInput = document.getElementById("userId");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

// Hiển thị thông báo
function showMessage(text, type = "success") {
  messageDiv.textContent = text;
  messageDiv.className = type; // "success" hoặc "error"
  if (!text) return;
  setTimeout(() => {
    messageDiv.textContent = "";
    messageDiv.className = "";
  }, 3000);
}

// Lấy danh sách user từ API (READ)
async function fetchUsers() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error("Failed to fetch users. Status: " + res.status);
    }
    const data = await res.json();
    users = data; // lưu vào state
    currentPage = 1;
    renderUsers();
  } catch (err) {
    console.error(err);
    showMessage("Error fetching users: " + err.message, "error");
  }
}

// Lọc theo tên + phân trang
function getFilteredUsers() {
  const keyword = currentSearch.toLowerCase();
  if (!keyword) return users;
  return users.filter((u) => u.name.toLowerCase().includes(keyword));
}

function renderUsers() {
  const filtered = getFilteredUsers();
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Giữ currentPage trong khoảng [1, totalPages]
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = filtered.slice(startIndex, endIndex);

  // Render bảng
  userTableBody.innerHTML = "";
  if (pageItems.length === 0) {
    userTableBody.innerHTML =
      "<tr><td colspan='5'>No users found.</td></tr>";
  } else {
    for (const user of pageItems) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.phone}</td>
        <td class="actions">
          <button data-id="${user.id}" class="edit-btn">Edit</button>
          <button data-id="${user.id}" class="delete-btn">Delete</button>
        </td>
      `;
      userTableBody.appendChild(tr);
    }
  }

  // Cập nhật nút phân trang
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
  pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;

  // Gán event Edit/Delete
  attachRowEvents();
}

// Gắn event cho nút Edit/Delete trong bảng
function attachRowEvents() {
  const editButtons = document.querySelectorAll(".edit-btn");
  const deleteButtons = document.querySelectorAll(".delete-btn");

  editButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-id"));
      startEditUser(id);
    });
  });

  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-id"));
      deleteUser(id);
    });
  });
}

// Bắt đầu chế độ Edit: fill form
function startEditUser(id) {
  const user = users.find((u) => u.id === id);
  if (!user) return;
  userIdInput.value = user.id;
  nameInput.value = user.name;
  emailInput.value = user.email;
  phoneInput.value = user.phone;

  formTitle.textContent = "Edit User";
  submitBtn.textContent = "Update";
  cancelEditBtn.style.display = "inline-block";
}

// Reset form về trạng thái Create
function resetForm() {
  userIdInput.value = "";
  nameInput.value = "";
  emailInput.value = "";
  phoneInput.value = "";

  formTitle.textContent = "Create New User";
  submitBtn.textContent = "Save";
  cancelEditBtn.style.display = "none";
}

// Create hoặc Update user
userForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = userIdInput.value ? Number(userIdInput.value) : null;
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();

  if (!name || !email || !phone) {
    showMessage("Please fill all fields.", "error");
    return;
  }

  if (!id) {
    // CREATE
    await createUser({ name, email, phone });
  } else {
    // UPDATE
    await updateUser({ id, name, email, phone });
  }
});

cancelEditBtn.addEventListener("click", () => {
  resetForm();
});

// CREATE: POST lên API, cập nhật UI thủ công
async function createUser(userData) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!res.ok) {
      throw new Error("Failed to create user. Status: " + res.status);
    }

    const created = await res.json();
    // JSONPlaceholder là fake, nhưng trả về object có id
    const newId =
      created.id ??
      (users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1);
    const newUser = { id: newId, ...userData };

    users.push(newUser); // cập nhật UI state
    resetForm();
    currentPage = Math.ceil(users.length / pageSize); // nhảy tới trang cuối
    renderUsers();

    showMessage(
      "User created (UI updated, JSONPlaceholder is fake).",
      "success"
    );
  } catch (err) {
    console.error(err);
    showMessage("Error creating user: " + err.message, "error");
  }
}

// UPDATE: PUT lên API, cập nhật UI thủ công
async function updateUser(userData) {
  try {
    const res = await fetch(`${API_URL}/${userData.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!res.ok) {
      throw new Error("Failed to update user. Status: " + res.status);
    }

    await res.json(); // không dùng nhiều nhưng đọc để tránh warning

    users = users.map((u) =>
      u.id === userData.id ? { ...u, ...userData } : u
    );

    resetForm();
    renderUsers();
    showMessage(
      "User updated (UI updated, JSONPlaceholder is fake).",
      "success"
    );
  } catch (err) {
    console.error(err);
    showMessage("Error updating user: " + err.message, "error");
  }
}

// DELETE: gọi API DELETE, rồi xóa khỏi UI state
async function deleteUser(id) {
  const confirmDelete = confirm("Are you sure you want to delete this user?");
  if (!confirmDelete) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Failed to delete user. Status: " + res.status);
    }

    users = users.filter((u) => u.id !== id);
    renderUsers();
    showMessage(
      "User deleted (UI updated, JSONPlaceholder is fake).",
      "success"
    );
  } catch (err) {
    console.error(err);
    showMessage("Error deleting user: " + err.message, "error");
  }
}

// SEARCH: filter theo name
searchInput.addEventListener("input", () => {
  currentSearch = searchInput.value;
  currentPage = 1;
  renderUsers();
});

// PAGINATION
prevPageBtn.addEventListener("click", () => {
  currentPage--;
  renderUsers();
});

nextPageBtn.addEventListener("click", () => {
  currentPage++;
  renderUsers();
});

// Khi load trang: fetch data ban đầu
fetchUsers();
