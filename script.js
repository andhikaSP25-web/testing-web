const items = document.querySelectorAll('.feature-item');

// PERBAIKAN: Menambahkan 'event' di dalam kurung
function changeMockup(event, sectionName) {
    // Hapus class 'active' dari semua list
    if (items) {
        items.forEach(item => item.classList.remove('active'));
    }

    // Tambahkan class 'active' ke elemen yang diklik
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// === TAMBAHAN: Fungsi untuk Kotak Floating Pembaruan ===
function openUpdateModal() {
    const modal = document.getElementById('update-modal');
    if (modal) {
        modal.classList.add('show'); // Memanggil animasi muncul
    }
}

function closeUpdateModal() {
    const modal = document.getElementById('update-modal');
    if (modal) {
        modal.classList.remove('show'); // Memanggil animasi menghilang
    }
}

// === TAMBAHAN: Tutup modal saat area luar diklik ===
window.addEventListener('click', function(event) {
    const updateModal = document.getElementById('update-modal');
    
    // Mengecek apakah elemen yang diklik adalah background gelap (bukan kotaknya)
    if (event.target === updateModal) {
        closeUpdateModal();
    }
});

// === FUNGSI UNTUK DISCLAIMER ===
function openDisclaimerModal() {
    const modal = document.getElementById('disclaimer-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeDisclaimerModal() {
    const modal = document.getElementById('disclaimer-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// === TAMBAHAN: Menutup Disclaimer jika area luar (gelap) diklik ===
window.addEventListener('click', function(event) {
    const disclaimerModal = document.getElementById('disclaimer-modal');
    
    if (event.target === disclaimerModal) {
        closeDisclaimerModal();
    }
});

// === FUNGSI PINDAH HALAMAN HALUS ===
function smoothNavigate(url) {
    const loadingScreen = document.getElementById('loading-screen');
    
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
        
        // Dipercepat menjadi 300ms (0.3 detik) cukup untuk memunculkan efek pudar
        setTimeout(() => {
            window.location.href = url;
        }, 300); 
    } else {
        window.location.href = url;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelectorAll(".slide-block");
    let currentIndex = 0;

    if (slides.length > 0) {
        setInterval(() => {
            // 1. Suruh teks yang sedang tampil untuk pergi ke atas (menghilang)
            slides[currentIndex].classList.remove("active");
            slides[currentIndex].classList.add("exit");

            // 2. Tentukan teks mana yang akan muncul selanjutnya
            let nextIndex = (currentIndex + 1) % slides.length;

            // 3. Pastikan teks selanjutnya posisinya ada di bawah, bukan di atas
            slides[nextIndex].classList.remove("exit");
            
            // 4. Beri jeda 50 milidetik agar CSS siap, lalu luncurkan teks ke tengah
            setTimeout(() => {
                slides[nextIndex].classList.add("active");
            }, 50); 

            // Update index untuk putaran berikutnya
            currentIndex = nextIndex;
            
        }, 5000); // Angka 10000 ini adalah jeda 10 detik
    }
});