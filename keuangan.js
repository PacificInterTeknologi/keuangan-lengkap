// =====================
// USER LOGIN & ROLE MANAGEMENT
// =====================
const users = [
  { username: "admin", password: "1234", role: "admin", fullName: "Administrator" },
  { username: "staff", password: "staff123", role: "staff", fullName: "Staff" },
  { username: "viewer", password: "viewer123", role: "viewer", fullName: "Viewer" }
];

/**
 * Login user dan simpan ke localStorage
 * @param {string} username - Username user
 * @param {string} password - Password user
 * @returns {object|null} User object jika berhasil, null jika gagal
 */
function loginUser(username, password) {
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    // Simpan user ke localStorage tanpa password untuk keamanan
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword));
    return userWithoutPassword;
  } else {
    showNotification("Username atau password salah", "error");
    return null;
  }
}

/**
 * Mendapatkan user yang sedang login
 * @returns {object|null} User object jika ada, null jika belum login
 */
function getCurrentUser() {
  const saved = localStorage.getItem("currentUser");
  return saved ? JSON.parse(saved) : null;
}

/**
 * Logout user dan redirect ke halaman dashboard
 */
function logout() {
  localStorage.removeItem("currentUser");
  showNotification("Anda telah berhasil logout");
  window.location.href = "dashboard.html";
}

/**
 * Cek apakah user memiliki otorisasi untuk mengakses halaman
 * @param {string[]} allowedRoles - Daftar role yang diizinkan
 * @returns {boolean} True jika diizinkan, false jika tidak
 */
function isAuthorized(allowedRoles = []) {
  const user = getCurrentUser();
  return user && allowedRoles.includes(user.role);
}

/**
 * Terapkan kontrol akses berdasarkan role user
 */
function applyAccessControl() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "dashboard.html";
    return;
  }

  // Sembunyikan semua menu terlebih dahulu
  const allMenus = document.querySelectorAll(".menu-item");
  allMenus.forEach(item => item.style.display = "none");

  // Tampilkan menu berdasarkan role
  const roleMap = {
    admin: ["menu-admin", "menu-staff", "menu-viewer"],
    staff: ["menu-staff", "menu-viewer"],
    viewer: ["menu-viewer"]
  };

  const allowedClasses = roleMap[user.role] || [];
  allowedClasses.forEach(className => {
    showElementsByClass(className);
  });

  // Update info user di header
  const userInfoElement = document.getElementById("userInfo");
  if (userInfoElement) {
    userInfoElement.textContent = `${user.fullName} (${user.role})`;
  }
}

/**
 * Tampilkan elemen berdasarkan class name
 * @param {string} className - Nama class yang ingin ditampilkan
 */
function showElementsByClass(className) {
  const elements = document.getElementsByClassName(className);
  Array.from(elements).forEach(el => el.style.display = "block");
}

/**
 * Tampilkan notifikasi kepada user
 * @param {string} message - Pesan notifikasi
 * @param {string} type - Tipe notifikasi (success, error, info, warning)
 */
function showNotification(message, type = "info") {
  // Cek apakah ada container notifikasi
  let notificationContainer = document.getElementById("notificationContainer");
  
  if (!notificationContainer) {
    // Buat container notifikasi jika belum ada
    notificationContainer = document.createElement("div");
    notificationContainer.id = "notificationContainer";
    notificationContainer.style.position = "fixed";
    notificationContainer.style.top = "20px";
    notificationContainer.style.right = "20px";
    notificationContainer.style.zIndex = "9999";
    document.body.appendChild(notificationContainer);
  }

  // Buat elemen notifikasi
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Style untuk notifikasi
  notification.style.padding = "12px 20px";
  notification.style.marginBottom = "10px";
  notification.style.borderRadius = "4px";
  notification.style.color = "white";
  notification.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
  notification.style.transform = "translateX(120%)";
  notification.style.transition = "transform 0.3s ease";
  
  // Warna berdasarkan tipe
  const colors = {
    success: "#4CAF50",
    error: "#F44336",
    info: "#2196F3",
    warning: "#FF9800"
  };
  notification.style.backgroundColor = colors[type] || colors.info;

  // Tambahkan ke container
  notificationContainer.appendChild(notification);

  // Animasi muncul
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 10);

  // Hapus otomatis setelah 3 detik
  setTimeout(() => {
    notification.style.transform = "translateX(120%)";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// =====================
// DATA PELANGGAN MANAGEMENT
// =====================

/**
 * Mendapatkan data pelanggan dari localStorage
 * @returns {Array} Array of pelanggan objects
 */
function getPelanggan() {
  return JSON.parse(localStorage.getItem("dataPelanggan")) || [];
}

/**
 * Menyimpan data pelanggan ke localStorage
 * @param {Array} data - Array of pelanggan objects
 */
function simpanPelanggan(data) {
  localStorage.setItem("dataPelanggan", JSON.stringify(data));
}

/**
 * Menampilkan data pelanggan di tabel
 */
function tampilkanPelanggan() {
  const tbody = document.getElementById("dataPelanggan");
  if (!tbody) return;
  
  const data = getPelanggan();
  tbody.innerHTML = "";
  
  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 20px;">
          Tidak ada data pelanggan
        </td>
      </tr>
    `;
    return;
  }
  
  data.forEach((item, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${item.tanggal || "-"}</td>
        <td>${item.nama || "-"}</td>
        <td>${item.alamat || "-"}</td>
        <td>${item.telp || "-"}</td>
        <td>${item.pembayaran || "-"}</td>
        <td>
          <button onclick="editPelanggan(${i})" class="btn btn-edit">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button onclick="hapusPelanggan(${i})" class="btn btn-delete">
            <i class="fas fa-trash"></i> Hapus
          </button>
          <button onclick="lanjutKeJenisInvoice(${i})" class="btn btn-primary">
            <i class="fas fa-arrow-right"></i> Lanjut
          </button>
        </td>
      </tr>
    `;
  });
}

/**
 * Menghapus data pelanggan
 * @param {number} index - Index pelanggan yang akan dihapus
 */
function hapusPelanggan(index) {
  const data = getPelanggan();
  if (confirm("Apakah Anda yakin ingin menghapus data pelanggan ini?")) {
    const deletedPelanggan = data[index];
    data.splice(index, 1);
    simpanPelanggan(data);
    tampilkanPelanggan();
    showNotification("Data pelanggan berhasil dihapus", "success");
    
    // Log aktivitas
    logActivity(`Menghapus pelanggan: ${deletedPelanggan.nama}`);
  }
}

/**
 * Mengedit data pelanggan
 * @param {number} index - Index pelanggan yang akan diedit
 */
function editPelanggan(index) {
  const data = getPelanggan();
  const pelanggan = data[index];
  
  // Isi form dengan data pelanggan
  document.getElementById("tanggal").value = pelanggan.tanggal || "";
  document.getElementById("nama").value = pelanggan.nama || "";
  document.getElementById("alamat").value = pelanggan.alamat || "";
  document.getElementById("telp").value = pelanggan.telp || "";
  document.getElementById("pembayaran").value = pelanggan.pembayaran || "";
  
  // Ubah tombol submit menjadi Update
  const submitBtn = document.querySelector("#formPelanggan button[type='submit']");
  submitBtn.textContent = "Update Pelanggan";
  submitBtn.onclick = function(e) {
    e.preventDefault();
    updatePelanggan(index);
  };
  
  // Scroll ke form
  document.getElementById("formPelanggan").scrollIntoView({ behavior: 'smooth' });
}

/**
 * Update data pelanggan
 * @param {number} index - Index pelanggan yang akan diupdate
 */
function updatePelanggan(index) {
  const data = getPelanggan();
  
  // Update data
  data[index] = {
    ...data[index],
    tanggal: document.getElementById("tanggal").value,
    nama: document.getElementById("nama").value,
    alamat: document.getElementById("alamat").value,
    telp: document.getElementById("telp").value,
    pembayaran: document.getElementById("pembayaran").value
  };
  
  simpanPelanggan(data);
  tampilkanPelanggan();
  
  // Reset form
  document.getElementById("formPelanggan").reset();
  
  // Kembalikan tombol submit
  const submitBtn = document.querySelector("#formPelanggan button[type='submit']");
  submitBtn.textContent = "Simpan Pelanggan";
  submitBtn.onclick = null;
  
  showNotification("Data pelanggan berhasil diperbarui", "success");
  
  // Log aktivitas
  logActivity(`Mengupdate pelanggan: ${data[index].nama}`);
}

/**
 * Mencetak invoice untuk pelanggan
 * @param {number} index - Index pelanggan
 */
function cetakInvoice(index) {
  const data = getPelanggan();
  const selected = data[index];
  localStorage.setItem("selectedInvoice", JSON.stringify(selected));
  window.open("invoice.html", "_blank");
}

/**
 * Melanjutkan ke halaman jenis invoice
 * @param {number} index - Index pelanggan yang dipilih
 */
function lanjutKeJenisInvoice(index) {
  const data = getPelanggan();
  const selected = data[index];
  localStorage.setItem("selectedPelanggan", JSON.stringify(selected));
  window.location.href = "jenis-invoice.html";
}

/**
 * Setup form pelanggan
 */
function setupFormPelanggan() {
  const form = document.getElementById("formPelanggan");
  if (!form) return;
  
  // Set default tanggal hari ini
  const today = new Date().toISOString().split('T')[0];
  document.getElementById("tanggal").value = today;
  
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    
    const tanggal = document.getElementById("tanggal").value;
    const nama = document.getElementById("nama").value;
    const alamat = document.getElementById("alamat").value;
    const telp = document.getElementById("telp").value;
    const pembayaran = document.getElementById("pembayaran").value;
    
    // Validasi sederhana
    if (!nama || !alamat || !telp) {
      showNotification("Nama, alamat, dan telepon wajib diisi", "error");
      return;
    }
    
    const pelanggan = { tanggal, nama, alamat, telp, pembayaran };
    const data = getPelanggan();
    data.push(pelanggan);
    simpanPelanggan(data);
    
    // Reset form
    form.reset();
    document.getElementById("tanggal").value = today;
    
    tampilkanPelanggan();
    showNotification("Pelanggan berhasil ditambahkan", "success");
    
    // Log aktivitas
    logActivity(`Menambah pelanggan baru: ${nama}`);
  });
}

/**
 * Mencari pelanggan berdasarkan nama
 * @param {string} keyword - Kata kunci pencarian
 */
function cariPelanggan(keyword) {
  const data = getPelanggan();
  const filtered = data.filter(pelanggan => 
    pelanggan.nama.toLowerCase().includes(keyword.toLowerCase()) ||
    pelanggan.alamat.toLowerCase().includes(keyword.toLowerCase()) ||
    pelanggan.telp.includes(keyword)
  );
  
  const tbody = document.getElementById("dataPelanggan");
  if (!tbody) return;
  
  tbody.innerHTML = "";
  
  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 20px;">
          Tidak ada hasil pencarian untuk "${keyword}"
        </td>
      </tr>
    `;
    return;
  }
  
  filtered.forEach((item, i) => {
    const originalIndex = data.indexOf(item);
    tbody.innerHTML += `
      <tr>
        <td>${originalIndex + 1}</td>
        <td>${item.tanggal || "-"}</td>
        <td>${item.nama || "-"}</td>
        <td>${item.alamat || "-"}</td>
        <td>${item.telp || "-"}</td>
        <td>${item.pembayaran || "-"}</td>
        <td>
          <button onclick="editPelanggan(${originalIndex})" class="btn btn-edit">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button onclick="hapusPelanggan(${originalIndex})" class="btn btn-delete">
            <i class="fas fa-trash"></i> Hapus
          </button>
          <button onclick="lanjutKeJenisInvoice(${originalIndex})" class="btn btn-primary">
            <i class="fas fa-arrow-right"></i> Lanjut
          </button>
        </td>
      </tr>
    `;
  });
}

// =====================
// FITUR EXPORT
// =====================

/**
 * Export data pelanggan ke Excel
 */
function exportExcel() {
  const table = document.getElementById("tabelPelanggan");
  if (!table) {
    showNotification("Tabel data tidak ditemukan", "error");
    return;
  }
  
  try {
    const wb = XLSX.utils.table_to_book(table, { sheet: "DataPelanggan" });
    XLSX.writeFile(wb, "Data_Pelanggan.xlsx");
    showNotification("Data berhasil diekspor ke Excel", "success");
    
    // Log aktivitas
    logActivity("Export data pelanggan ke Excel");
  } catch (error) {
    showNotification("Gagal mengekspor data ke Excel", "error");
    console.error("Export Excel error:", error);
  }
}

/**
 * Export data pelanggan ke PDF
 */
function exportPDF() {
  const table = document.getElementById("tabelPelanggan");
  if (!table) {
    showNotification("Tabel data tidak ditemukan", "error");
    return;
  }
  
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Tambahkan judul
    doc.setFontSize(16);
    doc.text("Data Pelanggan", 14, 15);
    
    // Siapkan data untuk tabel
    const headers = ["No", "Tanggal", "Nama", "Alamat", "Telepon", "Pembayaran"];
    const rows = Array.from(table.querySelectorAll("tbody tr")).map((tr, i) => {
      const cells = tr.querySelectorAll("td");
      return [
        i + 1,
        cells[1].innerText,
        cells[2].innerText,
        cells[3].innerText,
        cells[4].innerText,
        cells[5].innerText
      ];
    });
    
    // Buat tabel
    doc.autoTable({ 
      head: [headers], 
      body: rows, 
      startY: 25,
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [27, 31, 59],
        textColor: 255
      }
    });
    
    doc.save("Data_Pelanggan.pdf");
    showNotification("Data berhasil diekspor ke PDF", "success");
    
    // Log aktivitas
    logActivity("Export data pelanggan ke PDF");
  } catch (error) {
    showNotification("Gagal mengekspor data ke PDF", "error");
    console.error("Export PDF error:", error);
  }
}

// =====================
// ACTIVITY LOGGING
// =====================

/**
 * Log aktivitas user
 * @param {string} activity - Deskripsi aktivitas
 */
function logActivity(activity) {
  const user = getCurrentUser();
  if (!user) return;
  
  const logs = JSON.parse(localStorage.getItem("activityLogs")) || [];
  
  logs.push({
    timestamp: new Date().toISOString(),
    user: user.username,
    role: user.role,
    activity: activity
  });
  
  // Simpan maksimal 100 log terakhir
  if (logs.length > 100) {
    logs.shift();
  }
  
  localStorage.setItem("activityLogs", JSON.stringify(logs));
}

/**
 * Mendapatkan log aktivitas
 * @returns {Array} Array of log objects
 */
function getActivityLogs() {
  return JSON.parse(localStorage.getItem("activityLogs")) || [];
}

// =====================
// INITIALIZATION
// =====================

/**
 * Inisialisasi aplikasi
 */
function initializeApp() {
  const user = getCurrentUser();
  if (!user) {
    showNotification("Silakan login terlebih dahulu", "error");
    window.location.href = "dashboard.html";
    return;
  }
  
  // Terapkan kontrol akses
  if (typeof applyAccessControl === 'function') applyAccessControl();
  
  // Setup form pelanggan
  if (typeof setupFormPelanggan === 'function') setupFormPelanggan();
  
  // Tampilkan data pelanggan
  if (typeof tampilkanPelanggan === 'function') tampilkanPelanggan();
  
  // Setup pencarian jika ada input pencarian
  const searchInput = document.getElementById("searchPelanggan");
  if (searchInput) {
    searchInput.addEventListener("input", function() {
      cariPelanggan(this.value);
    });
  }
  
  // Log aktivitas login
  logActivity(`User ${user.username} (${user.role}) mengakses halaman`);
}

// Jalankan inisialisasi saat DOM selesai dimuat
document.addEventListener("DOMContentLoaded", initializeApp);