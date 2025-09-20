// form-handler.js
document.addEventListener('DOMContentLoaded', function() {
  const complaintForm = document.getElementById('complaint-form');
  
  if (complaintForm) {
    complaintForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Tampilkan loading state
      const submitButton = document.getElementById('submit-button');
      const originalText = submitButton.innerHTML;
      submitButton.innerHTML = '<span class="spinner"></span> Mengirim...';
      submitButton.disabled = true;
      
      try {
        // Ambil data dari form
        const formData = new FormData(complaintForm);
        const complaintData = {
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone') || '',
          location: formData.get('location'),
          category: formData.get('category'),
          description: formData.get('description'),
          status: 'pending',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Simpan ke Firestore
        const docRef = await db.collection('complaints').add(complaintData);
        
        // Upload file jika ada
        const fileInput = document.getElementById('file-input');
        if (fileInput.files.length > 0) {
          for (let i = 0; i < fileInput.files.length; i++) {
            const file = fileInput.files[i];
            const storageRef = storage.ref(`complaints/${docRef.id}/${file.name}`);
            await storageRef.put(file);
          }
        }
        
        // Update statistik
        await updateStatistics();
        
        // Tampilkan pesan sukses
        showToast('Pengaduan berhasil dikirim!', 'success');
        
        // Reset form
        complaintForm.reset();
        
      } catch (error) {
        console.error('Error mengirim pengaduan:', error);
        showToast('Gagal mengirim pengaduan. Silakan coba lagi.', 'error');
      } finally {
        // Kembalikan state tombol
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
      }
    });
  }
});

async function updateStatistics() {
  // Implementasi update statistik
  const statsRef = db.collection('stats').doc('complaintStats');
  const complaintsCount = await db.collection('complaints').count().get();
  
  await statsRef.set({
    total: complaintsCount.data().count,
    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}