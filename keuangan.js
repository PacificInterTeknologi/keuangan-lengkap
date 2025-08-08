// =====================
// LAPORAN KEUANGAN MANAGEMENT
// =====================
/**
 * Mendapatkan data laporan keuangan dari localStorage
 * @returns {Array} Array of laporan keuangan objects
 */
function getLaporanKeuangan() {
  try {
    return JSON.parse(localStorage.getItem("laporanKeuangan")) || [];
  } catch (error) {
    console.error("Error getting laporan keuangan data:", error);
    return [];
  }
}
/**
 * Menyimpan data laporan keuangan ke localStorage
 * @param {Array} data - Array of laporan keuangan objects
 */
function simpanLaporanKeuangan(data) {
  try {
    // Validasi data
    if (!Array.isArray(data)) {
      throw new Error("Data harus berupa array");
    }
    
    localStorage.setItem("laporanKeuangan", JSON.stringify(data));
  } catch (error) {
    console.error("Error saving laporan keuangan data:", error);
    showNotification("Gagal menyimpan data laporan keuangan", "error");
  }
}
/**
 * Simpan data penjualan ke jurnal dan laporan keuangan
 * @param {Object} penjualan - Data penjualan
 */
function simpanKeJurnal(penjualan) {
  try {
    // Ambil data jurnal yang ada
    const jurnalData = JSON.parse(localStorage.getItem("dataJurnal")) || [];
    
    // Tambahkan entri untuk pendapatan penjualan (kredit)
    jurnalData.push({
      tanggal: penjualan.tanggal,
      akun: "Pendapatan Jasa",
      keterangan: `Penjualan - ${penjualan.customer}`,
      debit: 0,
      kredit: penjualan.total,
      fromPenjualan: true,
      noInvoice: penjualan.noInvoice,
      jenisTransaksi: "penjualan"
    });
    
    // Tambahkan entri untuk kas/piutang (debit)
    jurnalData.push({
      tanggal: penjualan.tanggal,
      akun: penjualan.metodePembayaran === "Tunai" ? "Kas" : "Piutang Usaha",
      keterangan: `Penjualan - ${penjualan.customer}`,
      debit: penjualan.total,
      kredit: 0,
      fromPenjualan: true,
      noInvoice: penjualan.noInvoice,
      jenisTransaksi: "penjualan"
    });
    
    // Simpan kembali data jurnal
    localStorage.setItem("dataJurnal", JSON.stringify(jurnalData));
    
    // Simpan ke laporanKeuangan (SATU BARIS untuk penjualan)
    const laporanKeuangan = getLaporanKeuangan();
    
    // Hapus dulu data laporan keuangan untuk invoice ini jika ada (untuk menghindari duplikat)
    const filteredLaporan = laporanKeuangan.filter(item => 
      !(item.noInvoice === penjualan.noInvoice && item.jenisTransaksi === "penjualan")
    );
    
    // Tambahkan SATU BARIS untuk penjualan
    filteredLaporan.push({
      tanggal: penjualan.tanggal,
      akun: "Penjualan",
      nilai: penjualan.total,
      keterangan: `Penjualan - ${penjualan.customer}`,
      tipe: "kredit",
      noInvoice: penjualan.noInvoice,
      jenisTransaksi: "penjualan",
      metodePembayaran: penjualan.metodePembayaran,
      jenisInvoice: penjualan.jenisInvoice || "jasa"
    });
    
    simpanLaporanKeuangan(filteredLaporan);
    
    showNotification("Data penjualan berhasil dicatat di jurnal dan laporan keuangan!");
    
    // Log aktivitas
    logActivity(`Menambah jurnal untuk invoice: ${penjualan.noInvoice}`);
  } catch (error) {
    console.error("Error saving to journal:", error);
    showNotification("Terjadi kesalahan saat menyimpan ke jurnal", "error");
  }
}
/**
 * Update laporan keuangan setelah hapus data
 * @param {Object} deletedItem - Item yang dihapus
 */
function updateLaporanKeuanganAfterDelete(deletedItem) {
  let laporanKeuangan = getLaporanKeuangan();
  
  // Hapus item yang sesuai dari laporan keuangan
  laporanKeuangan = laporanKeuangan.filter(item => 
    !(item.akun === deletedItem.akun && 
      item.nilai === (deletedItem.debit || deletedItem.kredit) && 
      item.tanggal === deletedItem.tanggal)
  );
  
  simpanLaporanKeuangan(laporanKeuangan);
}
/**
 * Update laporan keuangan saat status pembayaran berubah
 * @param {Object} penjualan - Data penjualan yang statusnya berubah
 */
function updateLaporanKeuanganOnPayment(penjualan) {
  try {
    const laporanKeuangan = getLaporanKeuangan();
    
    if (penjualan.status === "Lunas" && penjualan.tanggalPelunasan) {
      // Tambahkan entri untuk pelunasan
      laporanKeuangan.push({
        tanggal: penjualan.tanggalPelunasan,
        akun: "Pelunasan",
        nilai: penjualan.total,
        keterangan: `Pelunasan Invoice ${penjualan.noInvoice} - ${penjualan.customer}`,
        tipe: "debit",
        noInvoice: penjualan.noInvoice,
        jenisTransaksi: "pelunasan"
      });
      
      showNotification("Status pembayaran diperbarui dan dicatat di laporan keuangan!");
    }
    
    simpanLaporanKeuangan(laporanKeuangan);
    
    // Log aktivitas
    logActivity(`Update laporan keuangan untuk pelunasan invoice: ${penjualan.noInvoice}`);
  } catch (error) {
    console.error("Error updating laporan keuangan on payment:", error);
    showNotification("Terjadi kesalahan saat memperbarui laporan keuangan", "error");
  }
}
/**
 * Bersihkan data laporan keuangan dari invoice yang sudah dihapus
 */
function cleanLaporanKeuanganFromDeletedInvoices() {
  try {
    const laporanKeuangan = getLaporanKeuangan();
    const dataPenjualan = JSON.parse(localStorage.getItem("dataPenjualan")) || [];
    
    // Filter data laporan keuangan, hapus yang tidak memiliki invoice di data penjualan
    const filteredLaporan = laporanKeuangan.filter(item => {
      // Jika tidak ada noInvoice, biarkan (ini adalah transaksi manual)
      if (!item.noInvoice) return true;
      
      // Cek apakah invoice masih ada di data penjualan
      return dataPenjualan.some(p => p.noInvoice === item.noInvoice);
    });
    
    // Simpan kembali data yang sudah dibersihkan
    if (filteredLaporan.length !== laporanKeuangan.length) {
      simpanLaporanKeuangan(filteredLaporan);
      showNotification("Data laporan keuangan telah dibersihkan dari invoice yang sudah dihapus");
    }
  } catch (error) {
    console.error("Error cleaning laporan keuangan:", error);
  }
}
// =====================
// INVOICE MANAGEMENT
// =====================
/**
 * Mendapatkan data invoice dari localStorage
 * @returns {Array} Array of invoice objects
 */
function getInvoices() {
  try {
    return JSON.parse(localStorage.getItem("dataPenjualan")) || [];
  } catch (error) {
    console.error("Error getting invoices data:", error);
    return [];
  }
}
/**
 * Menyimpan data invoice ke localStorage
 * @param {Array} data - Array of invoice objects
 */
function simpanInvoices(data) {
  try {
    // Validasi data
    if (!Array.isArray(data)) {
      throw new Error("Data harus berupa array");
    }
    
    localStorage.setItem("dataPenjualan", JSON.stringify(data));
  } catch (error) {
    console.error("Error saving invoices data:", error);
    showNotification("Gagal menyimpan data invoice", "error");
  }
}
/**
 * Mengubah status pembayaran invoice
 * @param {number} index - Index invoice yang akan diubah
 * @param {string} status - Status baru (Lunas/Belum Lunas)
 */
function ubahStatusPembayaran(index, status) {
  try {
    const data = getInvoices();
    const invoice = data[index];
    
    if (!invoice) {
      showNotification("Data invoice tidak ditemukan", "error");
      return;
    }
    
    const oldStatus = invoice.status;
    invoice.status = status;
    
    if (status === "Lunas") {
      // Jika tanggal pelunasan belum diisi, isi dengan tanggal hari ini
      if (!invoice.tanggalPelunasan) {
        const today = new Date().toISOString().split('T')[0];
        invoice.tanggalPelunasan = today;
      }
      
      // Jika status berubah dari Belum Lunas menjadi Lunas, tambahkan entri jurnal untuk penerimaan kas
      if (oldStatus === "Belum Lunas") {
        const jurnalData = JSON.parse(localStorage.getItem("dataJurnal")) || [];
        
        // Tambahkan entri untuk pengurangan piutang
        jurnalData.push({
          tanggal: invoice.tanggalPelunasan || new Date().toISOString().split('T')[0],
          akun: "Piutang Usaha",
          keterangan: `Pelunasan Invoice ${invoice.noInvoice} - ${invoice.customer}`,
          debit: 0,
          kredit: invoice.total,
          fromPenjualan: true,
          noInvoice: invoice.noInvoice,
          jenisTransaksi: "pelunasan"
        });
        
        // Tambahkan entri untuk penambahan kas
        jurnalData.push({
          tanggal: invoice.tanggalPelunasan || new Date().toISOString().split('T')[0],
          akun: "Kas",
          keterangan: `Pelunasan Invoice ${invoice.noInvoice} - ${invoice.customer}`,
          debit: invoice.total,
          kredit: 0,
          fromPenjualan: true,
          noInvoice: invoice.noInvoice,
          jenisTransaksi: "pelunasan"
        });
        
        localStorage.setItem("dataJurnal", JSON.stringify(jurnalData));
        
        // Update laporan keuangan untuk pelunasan
        updateLaporanKeuanganOnPayment(invoice);
      }
    } else {
      invoice.tanggalPelunasan = "";
    }
    
    simpanInvoices(data);
    
    // Log aktivitas
    logActivity(`Mengubah status pembayaran invoice ${invoice.noInvoice} dari ${oldStatus} menjadi ${status}`);
    
    showNotification("Status pembayaran berhasil diperbarui");
  } catch (error) {
    console.error("Error changing payment status:", error);
    showNotification("Terjadi kesalahan saat mengubah status pembayaran", "error");
  }
}
/**
 * Hapus invoice dan data terkait
 * @param {number} index - Index invoice yang akan dihapus
 */
function hapusInvoice(index) {
  try {
    const data = getInvoices();
    const invoice = data[index];
    
    if (!invoice) {
      showNotification("Data invoice tidak ditemukan", "error");
      return;
    }
    
    // Tampilkan konfirmasi dengan nomor invoice
    if (confirm(`Apakah Anda yakin ingin menghapus invoice ${invoice.noInvoice}?`)) {
      // Hapus dari array
      data.splice(index, 1);
      simpanInvoices(data);
      
      // Hapus dari jurnal
      const jurnalData = JSON.parse(localStorage.getItem("dataJurnal")) || [];
      const updatedJurnalData = jurnalData.filter(item => 
        !(item.noInvoice === invoice.noInvoice)
      );
      localStorage.setItem("dataJurnal", JSON.stringify(updatedJurnalData));
      
      // Hapus dari laporan keuangan
      updateLaporanKeuanganAfterDelete(invoice);
      
      // Log aktivitas
      logActivity(`Menghapus invoice: ${invoice.noInvoice}`);
      
      showNotification(`Invoice ${invoice.noInvoice} berhasil dihapus`);
    }
  } catch (error) {
    console.error("Error deleting invoice:", error);
    showNotification("Terjadi kesalahan saat menghapus invoice", "error");
  }
}

// =====================
// CHART VISUALIZATION
// =====================

/**
 * Membuat chart pendapatan dari data laporan keuangan
 * @param {string} canvasId - ID elemen canvas untuk chart
 * @param {string} periode - Periode chart ('bulan' atau 'tahun')
 */
function buatChartPendapatan(canvasId, periode = 'bulan') {
  try {
    // Ambil data laporan keuangan
    const laporanKeuangan = getLaporanKeuangan();
    
    // Filter data hanya untuk pendapatan penjualan
    const dataPendapatan = laporanKeuangan.filter(item => 
      item.akun === "Penjualan" && item.tipe === "kredit"
    );
    
    if (dataPendapatan.length === 0) {
      console.log("Tidak ada data pendapatan untuk ditampilkan di chart");
      return;
    }
    
    // Kelompokkan data berdasarkan periode
    const groupedData = kelompokkanDataPerPeriode(dataPendapatan, periode);
    
    // Ambil elemen canvas
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
      console.error(`Elemen canvas dengan ID ${canvasId} tidak ditemukan`);
      return;
    }
    
    // Hancurkan chart yang sudah ada jika ada
    if (window.myChart) {
      window.myChart.destroy();
    }
    
    // Buat chart baru
    window.myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: groupedData.labels,
        datasets: [{
          label: 'Pendapatan',
          data: groupedData.values,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: `Grafik Pendapatan (${periode === 'bulan' ? 'Per Bulan' : 'Per Tahun'})`
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'Rp ' + context.parsed.y.toLocaleString('id-ID');
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'Rp ' + value.toLocaleString('id-ID');
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error creating chart:", error);
    showNotification("Terjadi kesalahan saat membuat grafik", "error");
  }
}

/**
 * Mengelompokkan data berdasarkan periode (bulan atau tahun)
 * @param {Array} data - Data laporan keuangan
 * @param {string} periode - Periode pengelompokan ('bulan' atau 'tahun')
 * @returns {Object} Object berisi labels dan values
 */
function kelompokkanDataPerPeriode(data, periode) {
  const grouped = {};
  
  data.forEach(item => {
    const date = new Date(item.tanggal);
    let key;
    
    if (periode === 'bulan') {
      // Format: YYYY-MM (contoh: 2023-05)
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      // Format: YYYY (contoh: 2023)
      key = `${date.getFullYear()}`;
    }
    
    if (!grouped[key]) {
      grouped[key] = 0;
    }
    
    grouped[key] += item.nilai;
  });
  
  // Urutkan berdasarkan key
  const sortedKeys = Object.keys(grouped).sort();
  
  // Format labels
  const labels = sortedKeys.map(key => {
    if (periode === 'bulan') {
      const [year, month] = key.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    } else {
      return key;
    }
  });
  
  const values = sortedKeys.map(key => grouped[key]);
  
  return {
    labels,
    values
  };
}

/**
 * Membuat chart perbandingan pendapatan vs pelunasan
 * @param {string} canvasId - ID elemen canvas untuk chart
 */
function buatChartPerbandingan(canvasId) {
  try {
    // Ambil data laporan keuangan
    const laporanKeuangan = getLaporanKeuangan();
    
    // Filter data untuk pendapatan dan pelunasan
    const dataPendapatan = laporanKeuangan.filter(item => 
      item.akun === "Penjualan" && item.tipe === "kredit"
    );
    
    const dataPelunasan = laporanKeuangan.filter(item => 
      item.akun === "Pelunasan" && item.tipe === "debit"
    );
    
    // Kelompokkan data per bulan
    const groupedPendapatan = kelompokkanDataPerPeriode(dataPendapatan, 'bulan');
    const groupedPelunasan = kelompokkanDataPerPeriode(dataPelunasan, 'bulan');
    
    // Ambil elemen canvas
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
      console.error(`Elemen canvas dengan ID ${canvasId} tidak ditemukan`);
      return;
    }
    
    // Hancurkan chart yang sudah ada jika ada
    if (window.comparisonChart) {
      window.comparisonChart.destroy();
    }
    
    // Buat chart baru
    window.comparisonChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: groupedPendapatan.labels,
        datasets: [
          {
            label: 'Pendapatan',
            data: groupedPendapatan.values,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Pelunasan',
            data: groupedPelunasan.values,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Perbandingan Pendapatan vs Pelunasan'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': Rp ' + context.parsed.y.toLocaleString('id-ID');
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'Rp ' + value.toLocaleString('id-ID');
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error creating comparison chart:", error);
    showNotification("Terjadi kesalahan saat membuat grafik perbandingan", "error");
  }
}

/**
 * Membuat chart status pembayaran invoice
 * @param {string} canvasId - ID elemen canvas untuk chart
 */
function buatChartStatusPembayaran(canvasId) {
  try {
    // Ambil data invoice
    const invoices = getInvoices();
    
    if (invoices.length === 0) {
      console.log("Tidak ada data invoice untuk ditampilkan di chart");
      return;
    }
    
    // Hitung jumlah invoice berdasarkan status
    const statusCount = {
      'Lunas': 0,
      'Belum Lunas': 0
    };
    
    invoices.forEach(invoice => {
      if (invoice.status === 'Lunas') {
        statusCount['Lunas']++;
      } else {
        statusCount['Belum Lunas']++;
      }
    });
    
    // Ambil elemen canvas
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
      console.error(`Elemen canvas dengan ID ${canvasId} tidak ditemukan`);
      return;
    }
    
    // Hancurkan chart yang sudah ada jika ada
    if (window.statusChart) {
      window.statusChart.destroy();
    }
    
    // Buat chart baru
    window.statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Lunas', 'Belum Lunas'],
        datasets: [{
          data: [statusCount['Lunas'], statusCount['Belum Lunas']],
          backgroundColor: [
            'rgba(75, 192, 192, 0.7)',
            'rgba(255, 99, 132, 0.7)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Status Pembayaran Invoice'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error creating status chart:", error);
    showNotification("Terjadi kesalahan saat membuat grafik status", "error");
  }
}

// =====================
// UPDATE INISIALISASI APLIKASI
// =====================
/**
 * Inisialisasi aplikasi
 */
function initializeApp() {
  // Inisialisasi data pengguna
  initializeUsersData();
  
  const user = getCurrentUser();
  if (!user) {
    showNotification("Silakan login terlebih dahulu", "error");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
    return;
  }
  
  // Update info user di header
  const userInfoElement = document.getElementById("userWelcome");
  if (userInfoElement) {
    userInfoElement.textContent = `${user.fullName} (${user.role})`;
  }
  
  // Tampilkan menu manajemen pengguna hanya untuk admin
  const adminMenu = document.getElementById("linkPengguna");
  if (adminMenu && user.role === "admin") {
    adminMenu.style.display = "block";
  }
  
  // Bersihkan data laporan keuangan dari invoice yang sudah dihapus
  cleanLaporanKeuanganFromDeletedInvoices();
  
  // Halaman-specific initialization
  const currentPath = window.location.pathname;
  const pageName = currentPath.split('/').pop() || 'dashboard.html';
  
  switch(pageName) {
    case 'pelanggan.html':
      // Setup form pelanggan
      if (typeof setupFormPelanggan === 'function') setupFormPelanggan();
      
      // Tampilkan data pelanggan
      if (typeof tampilkanPelanggan === 'function') tampilkanPelanggan();
      
      // Setup pencarian jika ada input pencarian
      if (typeof setupSearch === 'function') setupSearch();
      break;
      
    case 'pengguna.html':
      // Setup form pengguna
      if (typeof setupUserForm === 'function') setupUserForm();
      
      // Tampilkan data pengguna
      if (typeof tampilkanUsers === 'function') tampilkanUsers();
      
      // Setup pencarian jika ada input pencarian
      if (typeof setupUserSearch === 'function') setupUserSearch();
      break;
      
    case 'activity-logs.html':
      // Tampilkan activity logs
      if (typeof tampilkanActivityLogs === 'function') tampilkanActivityLogs();
      break;
      
    case 'invoice.html':
      // Tampilkan data invoice
      if (typeof tampilkanInvoices === 'function') tampilkanInvoices();
      break;
      
    // TAMBAHKAN CASE BARU UNTUK DASHBOARD DAN LAPORAN
    case 'dashboard.html':
      // Tampilkan data dashboard
      if (typeof tampilkanDashboard === 'function') tampilkanDashboard();
      
      // Buat chart pendapatan per bulan
      buatChartPendapatan('chartPendapatan', 'bulan');
      
      // Buat chart perbandingan pendapatan vs pelunasan
      buatChartPerbandingan('chartPerbandingan');
      
      // Buat chart status pembayaran
      buatChartStatusPembayaran('chartStatusPembayaran');
      break;
      
    case 'laporan.html':
      // Tampilkan data laporan
      if (typeof tampilkanLaporan === 'function') tampilkanLaporan();
      
      // Buat chart pendapatan (dengan periode yang bisa dipilih user)
      buatChartPendapatan('chartPendapatanLaporan', 'bulan');
      
      // Tambahkan event listener untuk mengubah periode
      const periodeSelector = document.getElementById('periodeSelector');
      if (periodeSelector) {
        periodeSelector.addEventListener('change', function() {
          buatChartPendapatan('chartPendapatanLaporan', this.value);
        });
      }
      break;
  }
  
  // Log aktivitas login
  logActivity(`User ${user.username} (${user.role}) mengakses halaman ${pageName}`);
  
  // Setup auto-refresh token jika diperlukan
  setupAutoRefresh();
}