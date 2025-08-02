// =====================
// USER LOGIN & ROLE
// =====================
const users = [
  { username: "admin", password: "1234", role: "admin" },
  { username: "staff", password: "staff123", role: "staff" },
  { username: "viewer", password: "viewer123", role: "viewer" }
];

function loginUser(username, password) {
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    return user;
  } else {
    showMessage("Username atau password salah", "error");
    return null;
  }
}

function getCurrentUser() {
  const saved = localStorage.getItem("currentUser");
  return saved ? JSON.parse(saved) : null;
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "dashboard.html";
}

function isAuthorized(allowedRoles = []) {
  const user = getCurrentUser();
  return user && allowedRoles.includes(user.role);
}

function applyAccessControl() {
  const allMenus = document.querySelectorAll(".menu-item");
  allMenus.forEach(item => item.style.display = "none");

  const user = getCurrentUser();
  if (!user) return;

  const classMap = {
    admin: "menu-admin",
    staff: "menu-staff",
    viewer: "menu-viewer"
  };

  showElementsByClass(classMap[user.role]);
}

function showElementsByClass(className) {
  const elements = document.getElementsByClassName(className);
  Array.from(elements).forEach(el => el.style.display = "block");
}

function showMessage(msg, type = "info") {
  alert(`[${type.toUpperCase()}] ${msg}`);
}

// =====================
// DATA PELANGGAN
// =====================
function getPelanggan() {
  return JSON.parse(localStorage.getItem("dataPelanggan")) || [];
}

function simpanPelanggan(data) {
  localStorage.setItem("dataPelanggan", JSON.stringify(data));
}

function tampilkanPelanggan() {
  const tbody = document.getElementById("dataPelanggan");
  if (!tbody) return;
  const data = getPelanggan();
  tbody.innerHTML = "";
  data.forEach((item, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${item.tanggal}</td>
        <td>${item.nama}</td>
        <td>${item.alamat}</td>
        <td>${item.telp}</td>
        <td>${item.pembayaran}</td>
        <td>
          <button onclick="hapusPelanggan(${i})" class="btnHapus">Hapus</button>
          <button onclick="lanjutKeJenisInvoice(${i})" class="btnLanjut">Lanjut</button>
        </td>
      </tr>
    `;
  });
}

function hapusPelanggan(index) {
  const data = getPelanggan();
  if (confirm("Hapus data pelanggan ini?")) {
    data.splice(index, 1);
    simpanPelanggan(data);
    tampilkanPelanggan();
  }
}

function cetakInvoice(index) {
  const data = getPelanggan();
  const selected = data[index];
  localStorage.setItem("selectedInvoice", JSON.stringify(selected));
  window.open("invoice.html", "_blank");
}

function lanjutKeJenisInvoice(index) {
  const data = getPelanggan();
  const selected = data[index];
  localStorage.setItem("selectedPelanggan", JSON.stringify(selected));
  window.location.href = "jenis-invoice.html";
}

function setupFormPelanggan() {
  const form = document.getElementById("formPelanggan");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const tanggal = document.getElementById("tanggal").value;
    const nama = document.getElementById("nama").value;
    const alamat = document.getElementById("alamat").value;
    const telp = document.getElementById("telp").value;
    const pembayaran = document.getElementById("pembayaran").value;

    const pelanggan = { tanggal, nama, alamat, telp, pembayaran };
    const data = getPelanggan();
    data.push(pelanggan);
    simpanPelanggan(data);
    form.reset();
    tampilkanPelanggan();
  });
}

// =====================
// FITUR EXPORT (Placeholder)
// =====================
function exportExcel() {
  const table = document.getElementById("tabelPelanggan");
  const wb = XLSX.utils.table_to_book(table, { sheet: "DataPelanggan" });
  XLSX.writeFile(wb, "Data_Pelanggan.xlsx");
}

function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const table = document.getElementById("tabelPelanggan");
  let y = 10;
  doc.setFontSize(12);
  doc.text("Data Pelanggan", 14, y);
  y += 6;

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

  doc.autoTable({ head: [headers], body: rows, startY: y });
  doc.save("Data_Pelanggan.pdf");
}

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", () => {
  const user = getCurrentUser();
  if (!user) {
    alert("Silakan login terlebih dahulu.");
    window.location.href = "dashboard.html";
    return;
  }

  if (typeof tampilkanPelanggan === 'function') tampilkanPelanggan();
  if (typeof setupFormPelanggan === 'function') setupFormPelanggan();
  if (typeof applyAccessControl === 'function') applyAccessControl();
});
