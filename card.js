    // =========================================================================
    // 1. DATABASE KARTU (Pengaturan Manual per User)
    // =========================================================================
    const API_DRIVE_UTAMA = "https://script.google.com/macros/s/AKfycbxF3d5Se1viQG-kFFTuF5823HsFN9R9PaWEY9V6G7LwvaoGxEcCemuMDas-CpyS2fmGtA/exec"; // URL Web App dari New Deployment

    const dataKartu = [
    {
        status: "Primary Card",
        bintang: 1,
        gambar: "https://i.pinimg.com/736x/46/90/65/469065f2c575b4c3e086be6cc4a76035.jpg",
        icon: "lock_person",
        
        username: "admin1",
        halamanTujuan: "galeri.html",
        apiDrive: API_DRIVE_UTAMA, // Menggunakan 1 URL yang sama untuk semua
        
        tingkatDasar: "regular",
        teksStatus: "Admin",
        tanggalAktif: "24 Oktober 2026"
    },
    {
        status: "Available",
        bintang: 1,
        gambar: "https://i.pinimg.com/1200x/92/41/92/924192b2cdbec6802e7fe4229e2e1bd9.jpg",
        icon: "lock_open",
        
        username: "admin2",
        halamanTujuan: "galeri.html",
        apiDrive: API_DRIVE_UTAMA, // Menggunakan 1 URL yang sama
        
        tingkatDasar: "default",
        teksStatus: "Moderator",
        tanggalAktif: "10 Oktober 2026"
    },
    {
        status: "Available",
        bintang: 1,
        gambar: "https://i.pinimg.com/1200x/8e/a4/14/8ea414f41647e6b3c009fccd954c1945.jpg",
        icon: "lock_open",
        
        username: "admin3",
        halamanTujuan: "galeri.html",
       apiDrive: API_DRIVE_UTAMA,
        
        // === KONFIGURASI MANUAL ADMIN ===
        tingkatDasar: "default", 
        teksStatus: "Moderator",
        tanggalAktif: "10 Oktober 2026"
    },
    {
        status: "Available",
        bintang: 1,
        gambar: "https://i.pinimg.com/736x/66/d7/8e/66d78e904063baceaee8d3dbe82e4f09.jpg",
        icon: "lock_open",
        
        username: "admin4",
        halamanTujuan: "galeri.html",
        apiDrive: API_DRIVE_UTAMA,
        
        // === KONFIGURASI MANUAL ADMIN ===
        tingkatDasar: "default", 
        teksStatus: "Moderator",
        tanggalAktif: "10 Oktober 2026"
    },
    {
        status: "Not Available",
        bintang: 1,
        gambar: "https://i.pinimg.com/1200x/55/40/6f/55406f94197b85c43673c56bad4d8aa2.jpg",
        icon: "lock_open",
        
        username: "",
        password: "",  // Kosongkan password untuk menandakan "Not Available"
        halamanTujuan: "galeri.html",
        apiDrive: API_DRIVE_UTAMA,
        
        // === KONFIGURASI MANUAL ADMIN ===
        tingkatDasar: "regular", 
        teksStatus: "Moderator",
        tanggalAktif: "10 Oktober 2026"
    },
        
    // Lanjutkan untuk kartu lainnya...
];

// =========================================================================
// 2. LOGIKA MENCETAK KARTU
// =========================================================================
function cetakBintang(jumlah) {
    let html = "";
    for (let i = 1; i <= 5; i++) {
        if (i <= jumlah) {
            html += `<span class="star active">★</span>`; // Bintang menyala
        } else {
            html += `<span class="star">★</span>`; // Bintang redup
        }
    }
    return html;
}

function muatSemuaKartu() {
    const wadah = document.getElementById('wadah-kartu');
    if (!wadah) return;
    wadah.innerHTML = ""; 

    // Update jumlah kartu di pojok kiri bawah otomatis
    const labelTotal = document.getElementById('total-kartu');
    if (labelTotal) labelTotal.innerText = dataKartu.length;

    dataKartu.forEach((kartu, index) => {
        const cardWrap = document.createElement('div');
        cardWrap.className = index === 0 ? "card-wrapper active" : "card-wrapper";

        cardWrap.innerHTML = `
            <div class="card-header">
                <span>${kartu.status}</span>
                <div class="star-rating">
                    ${cetakBintang(kartu.bintang)}
                </div>
            </div>
            <div class="card" style="background-image: url('${kartu.gambar}');">
                <div class="lock-icon">
                    <span class="material-symbols-outlined" style="font-size: 1.2rem; vertical-align: middle;">${kartu.icon}</span>
                </div>
            </div>
        `;

      // Logika saat kartu diklik
        cardWrap.onclick = function() {
            
            // 1. EFEK VISUAL: Main kartu tetap "Primary Card"
            document.querySelectorAll('.card-wrapper').forEach(c => c.classList.remove('active'));
            
            // Mengunci visual agar kartu pertama (Primary Card) selalu menjadi yang aktif
            const kartuUtama = document.querySelectorAll('.card-wrapper')[0];
            if (kartuUtama) {
                kartuUtama.classList.add('active');
                document.getElementById('main-bg').style.backgroundImage = `url('${dataKartu[0].gambar}')`;
            }

            // KODE WADAH GESER (SCROLL) DIHAPUS DI SINI AGAR LAYAR TIDAK LARI KE KIRI

            // 2. LOGIKA FITUR: Pop-up login HANYA muncul jika password tidak kosong (Available)
            if (kartu.password !== "") {
                attemptAccess(kartu.username, kartu.password, kartu.halamanTujuan, kartu.apiDrive, kartu.tingkatDasar, kartu.teksStatus, kartu.tanggalAktif);
            }
        };

        // --- PENUTUP YANG HILANG SEBELUMNYA DITAMBAHKAN DI SINI ---
        wadah.appendChild(cardWrap);
    }); 

    // Opsional: Set background awal saat halaman pertama kali dibuka
    if (dataKartu.length > 0) {
        document.getElementById('main-bg').style.backgroundImage = `url('${dataKartu[0].gambar}')`;
    }

    inisialisasiEfekGeser();
}



// =========================================================================
// 3. SISTEM LOGIN (Merekam Konfigurasi Manual)
// =========================================================================
let userSementara = "", passSementara = "", targetSementara = "", apiSementara = "";
let tingkatSementara = "", statusSementara = "", tglAktifSementara = "";

// Menangkap semua data dari kartu yang diklik
function attemptAccess(validUser, validPass, targetUrl, apiUrl, bTingkat, bStatus, bTgl) {
    const modal = document.getElementById('auth-modal');
    modal.classList.add('show'); 
    document.getElementById('error-msg').style.display = 'none'; 
    document.getElementById('username').value = ''; 
    document.getElementById('password').value = '';

    userSementara = validUser;
    passSementara = validPass;
    targetSementara = targetUrl;
    apiSementara = apiUrl;
    
    // Menyimpan konfigurasi manual sementara
    tingkatSementara = bTingkat;
    statusSementara = bStatus;
    tglAktifSementara = bTgl;
}


// Menutup modal login 
function closeModal() { document.getElementById('auth-modal').classList.remove('show'); }


// =========================================================================
// 4. EFEK GESER (DRAG) & PENCARIAN
// =========================================================================
function inisialisasiEfekGeser() {
    const allCards = document.querySelectorAll('.card-wrapper');
    const mainBg = document.getElementById('main-bg');
    const sliderContainer = document.getElementById('wadah-kartu');

    allCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const cardBg = card.querySelector('.card').style.backgroundImage;
            mainBg.style.backgroundImage = cardBg;
        });
    });

    sliderContainer.addEventListener('mouseleave', () => {
        const activeCard = document.querySelector('.card-wrapper.active');
        if (activeCard) {
            const activeBg = activeCard.querySelector('.card').style.backgroundImage;
            mainBg.style.backgroundImage = activeBg;
        }
    });

    let isDown = false;
    let startX;
    let scrollLeft;

    sliderContainer.addEventListener('mousedown', (e) => {
        isDown = true;
        sliderContainer.style.scrollBehavior = 'auto';
        startX = e.pageX - sliderContainer.offsetLeft;
        scrollLeft = sliderContainer.scrollLeft;
    });

    sliderContainer.addEventListener('mouseleave', () => {
        isDown = false;
        sliderContainer.style.scrollBehavior = 'smooth';
    });

    sliderContainer.addEventListener('mouseup', () => {
        isDown = false;
        sliderContainer.style.scrollBehavior = 'smooth';
    });

    sliderContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - sliderContainer.offsetLeft;
        const walk = (x - startX) * 2; 
        sliderContainer.scrollLeft = scrollLeft - walk;
    });
}

// Fitur Pencarian Kartu
const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('input', function() {
        const keyword = this.value.toLowerCase();
        const allCards = document.querySelectorAll('.card-wrapper');
        
        allCards.forEach(card => {
            const slideName = card.querySelector('.card-header span').innerText.toLowerCase();
            if (slideName.includes(keyword)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Perintah otomatis menjalankan pencetak kartu saat web dibuka
document.addEventListener('DOMContentLoaded', async () => {
    await sinkronisasiKartuGlobal(); // Wajib pakai 'await' agar menunggu data server selesai ditarik
    // Hapus muatSemuaKartu() di sini karena akan dipanggil dari dalam sinkronisasiKartuGlobal()
});

// Mesin Enkripsi SHA-256 bawaan Browser (Web Crypto API)
async function hashPasswordSHA256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// MENGAMBIL DATA GLOBAL DAN MENYIMPAN STATUS PAKET KE MEMORI KARTU
async function sinkronisasiKartuGlobal() {
    const wadah = document.getElementById('wadah-kartu');
    if (wadah) {
        wadah.innerHTML = "<p style='color:white; text-align:center; width:100%; padding-top:20px;'>Menyinkronkan data server...</p>";
    }

    try {
        // --- PERBAIKAN: Menambahkan &t=${Date.now()} untuk memaksa browser menarik data terbaru (anti-cache) ---
        const response = await fetch(`${API_DRIVE_UTAMA}?action=getUsersStatus&t=${Date.now()}`);
        const result = await response.json();
        
        if (result.status === 'success') {
            const dataServer = result.data;
            
            dataKartu.forEach(kartu => {
                if (kartu.username && dataServer[kartu.username]) {
                    // Pastikan bintang dipaksa menjadi angka
                    kartu.bintang = parseInt(dataServer[kartu.username].bintang) || 1;
                    kartu.paketServer = dataServer[kartu.username].paket; 
                }
            });
        }
    } catch (e) {
        console.error("Gagal terhubung ke database pusat.", e);
    }
    
    // PASTIKAN BARIS INI ADA DI SINI, BUKAN DI LUAR FUNGSI
    muatSemuaKartu(); 
}

// MENYUNTIKKAN DATA DARI SERVER KE HP SAAT LOGIN BERHASIL
async function handleLogin(event) {
    event.preventDefault();
    
    const inputUser = document.getElementById('username').value.trim();
    const inputPass = document.getElementById('password').value;
    const pesanError = document.getElementById('error-msg');
    const tombolLogin = event.target.querySelector('button');

    const dataUser = dataKartu.find(u => u.username === inputUser);
    if (!dataUser) {
        pesanError.style.display = 'block';
        pesanError.textContent = "Username tidak terdaftar!";
        return;
    }
    
    tombolLogin.textContent = "Mengecek...";
    tombolLogin.disabled = true;

    try {
        const hashedPass = await hashPasswordSHA256(inputPass);
        
        const urlServer = `${dataUser.apiDrive}?action=login&username=${inputUser}&password=${hashedPass}`;
        const response = await fetch(urlServer, { method: 'GET', redirect: 'follow' });
        const result = await response.json();

        if (result.status === 'success') {
            localStorage.setItem("statusLogin", "berhasil");
            localStorage.setItem("userAktif", result.username);
            localStorage.setItem("apiDriveAktif", dataUser.apiDrive);
            localStorage.setItem("sessionToken", result.token);
            
            localStorage.setItem("basePaketManual_" + inputUser, dataUser.tingkatDasar);
            if (dataUser.teksStatus) localStorage.setItem("teksStatusManual_" + inputUser, dataUser.teksStatus);
            
            // --- KUNCI SINKRONISASI: SET STATUS PAKET DI HP BERDASARKAN SERVER ---
            if (dataUser.paketServer !== undefined) { 
                if (dataUser.paketServer !== 'Free') {
                    localStorage.setItem('paketAktif_' + result.username, dataUser.paketServer);
                    localStorage.setItem('paketExpired_' + result.username, Date.now() + (30 * 24 * 60 * 60 * 1000)); 
                } else {
                    localStorage.setItem('paketAktif_' + result.username, 'Free');
                    localStorage.removeItem('paketExpired_' + result.username);
                }
            }
            
            window.location.href = dataUser.halamanTujuan;
        } else {
            pesanError.style.display = 'block';
            pesanError.textContent = result.message || "Username atau Sandi salah!";
        }
    } catch (error) {
        console.error("Error Login:", error);
        pesanError.style.display = 'block';
        pesanError.textContent = "Gagal terhubung ke server. Pastikan koneksi aman.";
    } finally {
        tombolLogin.textContent = "Log In";
        tombolLogin.disabled = false;
    }
}
