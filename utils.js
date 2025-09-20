// utils.js
function showToast(message, type = 'info') {
  // Buat elemen toast jika belum ada
  if (!document.getElementById('toast')) {
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.innerHTML = `
      <i class="toast-icon"></i>
      <span class="toast-message"></span>
    `;
    document.body.appendChild(toast);
  }
  
  const toast = document.getElementById('toast');
  const icon = toast.querySelector('.toast-icon');
  const messageEl = toast.querySelector('.toast-message');
  
  // Set kelas berdasarkan type
  toast.className = `toast ${type}`;
  messageEl.textContent = message;
  
  // Set icon
  if (type === 'success') {
    icon.className = 'toast-icon fas fa-check-circle';
  } else if (type === 'error') {
    icon.className = 'toast-icon fas fa-exclamation-circle';
  } else {
    icon.className = 'toast-icon fas fa-info-circle';
  }
  
  // Tampilkan toast
  toast.classList.add('show');
  
  // Sembunyikan setelah 3 detik
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Fungsi untuk menangani error Firebase
function handleFirebaseError(error) {
  console.error('Firebase Error:', error);
  
  switch (error.code) {
    case 'permission-denied':
      showToast('Izin ditolak. Silakan refresh halaman.', 'error');
      break;
    case 'unauthenticated':
      showToast('Anda harus login untuk melakukan aksi ini.', 'error');
      break;
    case 'storage/unauthorized':
      showToast('Izin upload file ditolak.', 'error');
      break;
    default:
      showToast('Terjadi kesalahan. Silakan coba lagi.', 'error');
  }
}