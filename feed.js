// === SISTEM AUTENTIKASI GOOGLE ===

// Ganti 'CLIENT_ID_ANDA' dengan ID dari Google Cloud Console Anda nanti
const GOOGLE_CLIENT_ID = '250525790541-sth854etht84mjqhpknake8lao07n4dq.apps.googleusercontent.com'; 
const ADMIN_EMAIL = "clokk2208@gmail.com";
let penggunaSaatIni = JSON.parse(localStorage.getItem('sesiGlobalApp')) || null;

window.onload = function () {
    try {
        // PEREDAM 1: Cek apakah web dijalankan secara lokal (file:///)
        if (window.location.protocol === 'file:') {
            console.warn("Peringatan: Sistem Login Google dihentikan karena Anda menggunakan file:///. Gunakan ekstensi Live Server untuk mengujinya.");
            perbaruiTampilanSesuaiLogin(); // Pastikan UI tetap jalan
            return; // Hentikan proses Google di sini agar tidak crash
        }

        // PEREDAM 2: Blok inisialisasi normal (Hanya berjalan jika menggunakan http:// atau https://)
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: tanganiResponGoogle
        });
        
        google.accounts.id.renderButton(
            document.getElementById("google-btn-container"),
            { theme: "outline", size: "large", shape: "pill", width: 250 } 
        );
        
        perbaruiTampilanSesuaiLogin();
    } catch (error) {
        console.error("Sistem keamanan gagal dimuat, tetapi web akan tetap berjalan:", error);
        perbaruiTampilanSesuaiLogin();
    }
};

// Fungsi yang membedah data setelah user berhasil login
function tanganiResponGoogle(response) {
    // Membaca data token rahasia dari Google
    const dataPengguna = jwt_decode(response.credential);
    
    penggunaSaatIni = {
        id: dataPengguna.sub,
        nama: dataPengguna.name,
        email: dataPengguna.email,
        foto: dataPengguna.picture
    };
    
    // Simpan ke memori browser
    localStorage.setItem('sesiGlobalApp', JSON.stringify(penggunaSaatIni));
    tutupLogin();
    perbaruiTampilanSesuaiLogin();
    tampilkanToast(`Selamat datang, ${penggunaSaatIni.nama}!`);
}

function bukaLogin() { document.getElementById('login-overlay').style.display = 'flex'; }
function tutupLogin() { document.getElementById('login-overlay').style.display = 'none'; }
// === FUNGSI KELUAR AKUN (TOMBOL AKSI GANDA) ===
let resetTombolLogout; // Variabel penyimpan timer

function logout() {
    const btnLogout = document.getElementById('btn-logout');

    // Cek apakah tombol sudah dalam mode "Peringatan" (Klik Kedua)
    if (btnLogout.innerText.includes("Yakin")) {
        // Hapus sesi dan segarkan halaman
        localStorage.removeItem('sesiGlobalApp');
        penggunaSaatIni = null;
        tutupEditProfile();
        window.location.reload(); 
        
    } else {
        // KLIK PERTAMA: Ubah warna dan teks tombol menjadi peringatan
        btnLogout.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">warning</span> Yakin ingin keluar?`;
        btnLogout.style.background = '#ef4444'; // Background merah solid
        btnLogout.style.color = 'white';        // Teks putih

        // Beri waktu 3 detik. Jika tidak diklik lagi, kembalikan seperti semula
        clearTimeout(resetTombolLogout);
        resetTombolLogout = setTimeout(() => {
            btnLogout.innerHTML = `<span class="material-symbols-outlined" style="font-size: 18px;">logout</span> Keluar Akun`;
            btnLogout.style.background = '#fef2f2';
            btnLogout.style.color = '#ef4444';
        }, 3000);
    }
}

// === FUNGSI SINKRONISASI TAMPILAN PROFIL ===
function perbaruiTampilanSesuaiLogin() {
    const profileAuth = document.getElementById('profile-auth');
    const profileUnauth = document.getElementById('profile-unauth');

    if (penggunaSaatIni) {
        // Tampilkan profil, sembunyikan kotak "Gembok"
        if (profileAuth) profileAuth.style.display = 'block';
        if (profileUnauth) profileUnauth.style.display = 'none';

        // Set default Bio dan Username jika pengguna baru login pertama kali
        if (!penggunaSaatIni.username) penggunaSaatIni.username = "@" + penggunaSaatIni.email.split('@')[0];
        if (!penggunaSaatIni.bio) penggunaSaatIni.bio = "Halo, saya menggunakan Global App!";

        // Cek status masa aktif Centang Biru
        let ikonCentangBiru = '';
        const waktuSekarang = new Date().getTime();
        if (penggunaSaatIni.verifiedUntil && waktuSekarang < penggunaSaatIni.verifiedUntil) {
            // Jika punya masa aktif dan belum kadaluarsa, tambahkan ikon
            ikonCentangBiru = `<span class="material-symbols-outlined" style="color: #3b82f6; font-size: 24px; font-variation-settings: 'FILL' 1;" title="Verified Creator">verified</span>`;
        } else if (penggunaSaatIni.verifiedUntil && waktuSekarang > penggunaSaatIni.verifiedUntil) {
            // Hapus centang biru jika sudah lewat 30 hari
            delete penggunaSaatIni.verifiedUntil; 
            localStorage.setItem('sesiGlobalApp', JSON.stringify(penggunaSaatIni));
        }

        // Tembakkan data ke HTML
        // Gunakan foto custom jika ada, jika kosong gunakan foto Google
        const fotoYangDitampilkan = penggunaSaatIni.fotoCustom || penggunaSaatIni.foto;
        document.getElementById('profile-avatar-img').src = fotoYangDitampilkan;
        document.getElementById('profile-name-text').innerHTML = `${penggunaSaatIni.nama} ${ikonCentangBiru}`;
        document.getElementById('profile-username-text').innerText = penggunaSaatIni.username;
        document.getElementById('profile-bio-text').innerText = penggunaSaatIni.bio;
        
    } else {
        // Jika belum login, sembunyikan profil asli, tampilkan gembok
        if (profileAuth) profileAuth.style.display = 'none';
        if (profileUnauth) profileUnauth.style.display = 'block';
    }
}

// === SISTEM EDIT PROFIL (DENGAN KUSTOMISASI FOTO) ===

function bukaEditProfile() {
    // Isi teks saat ini
    document.getElementById('input-nama').value = penggunaSaatIni.nama;
    document.getElementById('input-username').value = penggunaSaatIni.username.replace('@', '');
    document.getElementById('input-bio').value = penggunaSaatIni.bio;
    
    // Tampilkan foto saat ini (Prioritaskan foto custom jika ada, jika tidak pakai Google)
    const fotoSaatIni = penggunaSaatIni.fotoCustom || penggunaSaatIni.foto;
    document.getElementById('preview-foto-edit').src = fotoSaatIni;
    
    document.getElementById('edit-profile-modal').style.display = 'flex';
}

function tutupEditProfile() {
    document.getElementById('edit-profile-modal').style.display = 'none';
    document.getElementById('input-foto-baru').value = ''; // Reset input file
}

// Fungsi membaca gambar dari laptop/HP ke layar preview
function previewFotoBaru(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('preview-foto-edit').src = e.target.result;
        }
        reader.readAsDataURL(file); // Ubah gambar fisik jadi teks (Base64)
    }
}

// Fungsi menghapus foto custom (kembali ke bawaan Google)
function hapusFotoEdit() {
    document.getElementById('preview-foto-edit').src = penggunaSaatIni.foto; 
    document.getElementById('input-foto-baru').value = ''; 
}

function simpanProfile() {
    // 1. Simpan teks baru
    penggunaSaatIni.nama = document.getElementById('input-nama').value;
    penggunaSaatIni.username = "@" + document.getElementById('input-username').value.replace('@', '');
    penggunaSaatIni.bio = document.getElementById('input-bio').value;
    
    // 2. Simpan foto baru
    const fotoPreview = document.getElementById('preview-foto-edit').src;
    // Jika foto di preview BEDA dengan foto asli Google, berarti user mengunggah foto custom
    if (fotoPreview !== penggunaSaatIni.foto) {
        penggunaSaatIni.fotoCustom = fotoPreview;
    } else {
        // Jika sama, hapus memori foto custom agar kembali bersih
        delete penggunaSaatIni.fotoCustom;
    }
    
    localStorage.setItem('sesiGlobalApp', JSON.stringify(penggunaSaatIni));
    perbaruiTampilanSesuaiLogin();
    tutupEditProfile();
}

// === SISTEM UPGRADE CENTANG BIRU (30 HARI) ===
function bukaUpgrade() {
    document.getElementById('upgrade-modal').style.display = 'flex';
}

function tutupUpgrade() {
    document.getElementById('upgrade-modal').style.display = 'none';
}

function prosesPembayaran() {
    // Simulasi mengarahkan ke sistem pembayaran (Midtrans/Xendit)
    tampilkanToast('Pembayaran berhasil. Centang biru diaktifkan!', 'workspace_premium', '#fbbf24');

    // Hitung waktu 30 hari ke depan dalam satuan milidetik
    const tigaPuluhHari = 30 * 24 * 60 * 60 * 1000; 
    
    // Simpan "Tanggal Kadaluarsa" di data pengguna
    penggunaSaatIni.verifiedUntil = new Date().getTime() + tigaPuluhHari;
    
    // Simpan ke memori dan segarkan tampilan untuk memunculkan lencana
    localStorage.setItem('sesiGlobalApp', JSON.stringify(penggunaSaatIni));
    perbaruiTampilanSesuaiLogin();
    tutupUpgrade();
}

// === GERBANG PENGAMAN FITUR (GATEKEEPER) ===
// Panggil fungsi ini di setiap tombol aksi (Like, Comment, Upload, Unduh)
function pastikanLogin(fungsiLanjutan) {
    if (!penggunaSaatIni) {
        bukaLogin(); // Cegat! Munculkan pop-up login
    } else {
        fungsiLanjutan(); // Lanjutkan eksekusi jika aman
    }
}

// === FUNGSI SIMULASI LOGIN ===
function prosesLogin() {
    // Pada implementasi asli, ini akan terhubung ke sistem Google OAuth
    // Untuk saat ini, kita set status memori browser menjadi "berhasil"
    localStorage.setItem('statusLogin', 'berhasil');
    
    // Ubah tampilan tombol untuk memberi tahu user sudah login
    const btn = document.getElementById('btn-login-google');
    if (btn) {
        btn.innerHTML = `<span class="material-symbols-outlined">check_circle</span> Terhubung`;
        btn.style.background = '#31a24c'; // Warna hijau success
    }
    
    alert("Login berhasil disimulasikan! Anda sekarang bisa memberikan komentar.");
}

// === FUNGSI PENGECEKAN KOMENTAR ===
function tambahKomentar(event) {
    // Cek status memori login di browser
    const status = localStorage.getItem('statusLogin'); 
    
    // Cegah pengunjung publik (belum login) untuk komentar
    if (status !== 'berhasil') {
        alert("Akses Ditolak: Silakan Login Google terlebih dahulu untuk memberikan komentar.");
        return; // Hentikan proses eksekusi kode di bawahnya
    }

    // Jika sudah login, lanjutkan ke fitur komentar
    alert("Berhasil! Fitur komentar terbuka karena Anda sudah login.");
    // Kode untuk membuka kotak input komentar bisa ditaruh di sini nantinya...
}

// === FUNGSI PENCARIAN (LIVE SEARCH) ===
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchFeed');
    
    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            const keyword = event.target.value.toLowerCase();
            
            // Logika sederhana untuk mencari postingan 
            // (Nantinya bisa dikembangkan untuk memfilter daftar postingan di layar)
            console.log("Mencari postingan dengan kata kunci: ", keyword);
            
            // Contoh implementasi filter (hanya akan bekerja jika ada banyak kartu postingan)
            const postCards = document.querySelectorAll('.post-card');
            postCards.forEach(card => {
                const textContent = card.innerText.toLowerCase();
                if (textContent.includes(keyword)) {
                    card.style.display = 'block'; // Tampilkan jika cocok
                } else {
                    card.style.display = 'none';  // Sembunyikan jika tidak cocok
                }
            });
        });
    }
});

// === VARIABEL PENYIMPAN POSISI SCROLL ===
let posisiScrollTab = {};
let tabSaatIni = localStorage.getItem('tabFeedTerakhir') || 'post';

// === FUNGSI PERGANTIAN TAB MENU (DENGAN MEMORI SCROLL & SOFT REFRESH) ===
function gantiTab(tabId, element, isLoad = false) {
    
   // LOGIKA KLIK KEDUA: Soft Refresh dengan Animasi Melayang (Tanpa Layar Redup)
    if (!isLoad && element && element.classList.contains('active')) {
        // 1. Gulir ke atas dengan mulus
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // 2. Munculkan animasi berputar
        const spinner = document.getElementById('loading-spinner');
        if (spinner) spinner.style.display = 'flex';
        
        // 3. Matikan animasi setelah proses "memuat" selesai (Contoh: 1.2 detik)
        setTimeout(() => {
            if (spinner) spinner.style.display = 'none'; // Sembunyikan spinner
            
            // CATATAN: Taruh fungsi pemanggil data baru dari database di sini nanti
        }, 1200);
        
        return; // Hentikan fungsi agar tidak menjalankan kode pindah tab
    }

    // === LOGIKA KLIK PERTAMA (PINDAH TAB NORMAL) ===
    
    // 1. Simpan titik kordinat scroll pada tab yang sedang ditinggalkan
    if (!isLoad) {
        posisiScrollTab[tabSaatIni] = window.scrollY;
    }

    // 2. Sembunyikan semua tab konten
    const tabs = document.querySelectorAll('.content-tab');
    tabs.forEach(tab => tab.style.display = 'none');

    // 3. Hapus warna biru (active) dari semua tombol menu
    const menus = document.querySelectorAll('.menu-list li');
    menus.forEach(menu => menu.classList.remove('active'));

    // 4. Tampilkan tab yang sesuai dengan klik
    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) targetTab.style.display = 'block';

    // 5. Berikan warna biru (active) ke tombol menu
    if (element) element.classList.add('active');

    // 6. Perbarui memori tab yang sedang aktif
    tabSaatIni = tabId;
    localStorage.setItem('tabFeedTerakhir', tabId);
    
    // 7. KEMBALIKAN POSISI SCROLL khusus untuk tab yang baru dibuka
    if (!isLoad) {
        // Cek apakah sebelumnya tab ini pernah di-scroll, jika belum (kosong), nilainya 0 (paling atas)
        const posisiTerakhir = posisiScrollTab[tabId] || 0; 
        
        // Kembalikan ke posisi tersebut secara instan (tanpa animasi agar terlihat alami)
        window.scrollTo({ top: posisiTerakhir, behavior: 'instant' });
    }
}

// === KEMBALIKAN KE TAB TERAKHIR SAAT HALAMAN AWAL DIBUKA ===
document.addEventListener('DOMContentLoaded', () => {
    const tabTersimpan = localStorage.getItem('tabFeedTerakhir') || 'post'; 
    const tombolMenu = document.getElementById('menu-' + tabTersimpan);
    
    if (tombolMenu) {
        gantiTab(tabTersimpan, tombolMenu, true);
    } else {
        const menuPost = document.getElementById('menu-post');
        if(menuPost) gantiTab('post', menuPost, true); 
    }
});

// === FUNGSI INTERAKSI POSTINGAN (LIKE, COMMENT, UNDUH) ===
let postKomentarAktif = null; // Pengingat postingan mana yang komentarnya sedang terbuka

function aksiLike(btn) {
    if (!penggunaSaatIni) return bukaLogin(); // Cegat jika belum login
    
    const ikon = btn.querySelector('.material-symbols-outlined');
    
    // Logika Toggle: Jika sudah like, maka unlike. Jika belum, jadikan like.
    if (ikon.style.fontVariationSettings.includes("'FILL' 1")) {
        ikon.style.fontVariationSettings = "'FILL' 0"; // Hati kosong
        ikon.style.color = ""; 
        btn.style.color = "";
    } else {
        ikon.style.fontVariationSettings = "'FILL' 1"; // Hati penuh
        ikon.style.color = "#ef4444";                  // Merah
        btn.style.color = "#ef4444";
        tampilkanToast(`Anda menyukai postingan ini!`, 'favorite', '#ef4444');
    }
}

function aksiKomentar(btn) {
    if (!penggunaSaatIni) return bukaLogin(); 
    
    // Cari elemen pembungkus postingan (GPS)
    const postCard = btn.closest('.post-card'); 
    const namaUploader = postCard.querySelector('.username').innerText;
    
    const panelKomentar = document.getElementById('right-comment-panel');
    const judulKomentar = document.getElementById('comment-panel-title');
    
    // Logika Toggle: Buka & Tutup Panel
    if (panelKomentar.style.display === 'block' && postKomentarAktif === postCard) {
        // Jika ngeklik tombol komen pada postingan yang SAMA, panel akan menutup
        panelKomentar.style.display = 'none';
        postKomentarAktif = null;
    } else {
        // Jika ngeklik postingan LAIN, update nama dan buka panel
        judulKomentar.innerText = `Komentar di pos ${namaUploader}`;
        document.getElementById('comment-my-avatar').src = penggunaSaatIni.fotoCustom || penggunaSaatIni.foto;
        panelKomentar.style.display = 'block';
        postKomentarAktif = postCard;
        
        // Letakkan kursor langsung ke kotak ketikan
        document.getElementById('input-komentar-baru').focus();
    }
}

function tutupKomentarKanan() {
    document.getElementById('right-comment-panel').style.display = 'none';
    postKomentarAktif = null;
}

// === SISTEM KOMENTAR (Teks, Balas, Selengkapnya, & Voice Note) ===

// Fungsi untuk membuat teks "Lihat selengkapnya" jika terlalu panjang
function formatTeksKomentar(teks) {
    const batasKarakter = 100; // Batas karakter sebelum dipotong
    if (teks.length > batasKarakter) {
        const ringkas = teks.substring(0, batasKarakter);
        const sisa = teks.substring(batasKarakter);
        return `
            <span class="teks-ringkas">${ringkas}... <strong style="cursor:pointer; color:#64748b;" onclick="bacaSelengkapnya(this)">Lihat selengkapnya</strong></span>
            <span class="teks-lengkap" style="display:none;">${ringkas}${sisa}</span>
        `;
    }
    return teks;
}

// =====================================================================
// ================== SISTEM KOMENTAR & VOICE NOTE =====================
// =====================================================================

let areaBalasanAktif = null; // Pengingat area balasan Thread

function formatTeksKomentar(teks) {
    const batas = 100;
    if (teks.length > batas) {
        const ringkas = teks.substring(0, batas);
        const sisa = teks.substring(batas);
        return `
            <span class="teks-ringkas">${ringkas}... <strong style="cursor:pointer; color:#64748b;" onclick="bacaSelengkapnya(this)">Lihat selengkapnya</strong></span>
            <span class="teks-lengkap" style="display:none;">${ringkas}${sisa}</span>
        `;
    }
    return teks;
}

function bacaSelengkapnya(elemen) {
    const ringkas = elemen.parentElement;
    const lengkap = ringkas.nextElementSibling;
    ringkas.style.display = 'none';
    lengkap.style.display = 'inline';
}

function balasKomentar(namaOrang, elemenTombol) {
    const inputKomentar = document.getElementById('input-komentar-baru');
    inputKomentar.value = `@${namaOrang} `;
    inputKomentar.focus();

    const komentarWrapper = elemenTombol.closest('.komentar-wrapper');
    if (komentarWrapper) {
        areaBalasanAktif = komentarWrapper.querySelector('.area-balasan');
    }
}

// === MENCETAK KOMENTAR (DENGAN PROTEKSI HAPUS & WAKTU DINAMIS) ===
function cetakKomentarKeLayar(kontenHTML, emailPembuat = penggunaSaatIni.email) {
    const daftarKomentar = document.getElementById('comment-list');
    const avatarSaya = penggunaSaatIni.fotoCustom || penggunaSaatIni.foto;
    
    // Waktu dinamis mengikuti upload
    const waktuTeks = hitungWaktuLalu(Date.now()); 
    
    let tombolHapusHTML = '';
    const isPemilik = (penggunaSaatIni.email === emailPembuat);
    const isAdmin = (penggunaSaatIni.email === ADMIN_EMAIL);
    
    if (isPemilik || isAdmin) {
        tombolHapusHTML = `<span style="cursor: pointer; color: #ef4444; transition: 0.2s;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'" onclick="hapusKomentar(this)">Hapus</span>`;
    }
    
    const isiKomentarHTML = `
        <img src="${avatarSaya}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; position: relative; z-index: 2; cursor: pointer;" onclick="lihatProfil('${penggunaSaatIni.nama}', '${penggunaSaatIni.username.replace('@','')}', '${avatarSaya}', '${penggunaSaatIni.bio}', ${penggunaSaatIni.verifiedUntil ? true : false})">
        <div style="flex: 1; position: relative; z-index: 2;">
            <div style="display: flex; align-items: baseline; gap: 8px;">
                <strong style="font-size: 13px; color: #1e293b; cursor: pointer;" onclick="lihatProfil('${penggunaSaatIni.nama}', '${penggunaSaatIni.username.replace('@','')}', '${avatarSaya}', '${penggunaSaatIni.bio}', ${penggunaSaatIni.verifiedUntil ? true : false})">${penggunaSaatIni.nama}</strong>
                <span style="font-size: 11px; color: #94a3b8;">${waktuTeks}</span>
                ${isAdmin ? `<span style="font-size: 10px; background: #fee2e2; color: #ef4444; padding: 2px 6px; border-radius: 10px; font-weight: bold;">Admin</span>` : ''}
            </div>
            <p style="margin: 3px 0 5px 0; font-size: 13px; color: #475569; line-height: 1.4; word-break: break-word;">
                ${kontenHTML}
            </p>
            <div style="display: flex; gap: 15px; font-size: 11.5px; color: #64748b; font-weight: 600;">
                <span style="cursor: pointer; transition: 0.2s;" onmouseover="this.style.color='#3b82f6'" onmouseout="this.style.color='#64748b'" onclick="balasKomentar('${penggunaSaatIni.nama}', this)">Balas</span>
                ${tombolHapusHTML}
            </div>
        </div>
    `;

    if (areaBalasanAktif) {
        const siblings = areaBalasanAktif.querySelectorAll('.komentar-balasan');
        siblings.forEach(sib => {
            const maskLama = sib.querySelector('.mask-garis');
            if (maskLama) maskLama.remove();
        });

        const divBalasan = document.createElement('div');
        divBalasan.className = 'komentar-balasan';
        divBalasan.style.display = 'flex';
        divBalasan.style.gap = '10px';
        divBalasan.style.position = 'relative'; 
        
        const garisHorizontal = `<div style="position: absolute; top: 15px; left: -20px; width: 12px; height: 2px; background: #cbd5e1; z-index: 1;"></div>`;
        // PERBAIKAN SPASI: bottom diset -20px (Bukan -500px)
        const maskBaru = `<div class="mask-garis" style="position: absolute; left: -22px; top: 17px; bottom: -20px; width: 6px; background: white; z-index: 0;"></div>`;
        
        divBalasan.innerHTML = maskBaru + garisHorizontal + isiKomentarHTML;
        areaBalasanAktif.appendChild(divBalasan);
        areaBalasanAktif = null; 
    } else {
        const divWrapper = document.createElement('div');
        divWrapper.className = 'komentar-wrapper';
        divWrapper.style.display = 'flex';
        divWrapper.style.flexDirection = 'column';
        divWrapper.style.position = 'relative';
        
        divWrapper.innerHTML = `
            <div class="komentar-utama" style="display: flex; gap: 10px;">
                ${isiKomentarHTML}
            </div>
            <div class="area-balasan" style="margin-left: 15px; padding-left: 20px; border-left: 2px solid #cbd5e1; display: flex; flex-direction: column; gap: 12px; margin-top: 5px; padding-top: 5px; position: relative;"></div>
        `;
        daftarKomentar.appendChild(divWrapper);
    }
    daftarKomentar.scrollTop = daftarKomentar.scrollHeight;
}

// === FUNGSI MENGHAPUS KOMENTAR (OTORITAS PEMILIK & ADMIN) ===
function hapusKomentar(btn) {
    if (confirm("Apakah Anda yakin ingin menghapus komentar ini (Takedown)?")) {
        const elemenBalasan = btn.closest('.komentar-balasan');
        const elemenInduk = btn.closest('.komentar-wrapper');
        
        if (elemenBalasan) {
            const wadahBalasan = elemenBalasan.parentElement;
            elemenBalasan.remove(); 
            
            // Pindahkan pelindung spasi garis jika yang dihapus adalah balasan terakhir
            const sisaBalasan = wadahBalasan.querySelectorAll('.komentar-balasan');
            if (sisaBalasan.length > 0) {
                const anakTerakhir = sisaBalasan[sisaBalasan.length - 1];
                if (!anakTerakhir.querySelector('.mask-garis')) {
                    const maskBaru = document.createElement('div');
                    maskBaru.className = 'mask-garis';
                    // PERBAIKAN SPASI SAAT HAPUS: bottom diset -20px
                    maskBaru.style.cssText = 'position: absolute; left: -22px; top: 17px; bottom: -20px; width: 6px; background: white; z-index: 0;';
                    anakTerakhir.appendChild(maskBaru);
                }
            }
        } else if (elemenInduk) {
            elemenInduk.remove(); 
        }
        
        tampilkanToast("Komentar berhasil dihapus", "delete", "#ef4444");
    }
}

// === FUNGSI MENGIRIM TEKS ===
function kirimKomentar() {
    const input = document.getElementById('input-komentar-baru');
    const teks = input.value.trim();
    if (!teks) return; 
    
    cetakKomentarKeLayar(formatTeksKomentar(teks));
    input.value = ''; 
}

// --- KONTROL PEMUTAR VOICE NOTE ---
function togglePlayVN(id) {
    const audio = document.getElementById(id);
    const icon = document.getElementById('icon-' + id);
    
    if (audio.paused) {
        audio.play();
        icon.innerText = 'pause'; 
    } else {
        audio.pause();
        icon.innerText = 'play_arrow'; 
    }
}

function updateProgressVN(id) {
    const audio = document.getElementById(id);
    const progress = document.getElementById('progress-' + id);
    const timeLabel = document.getElementById('time-' + id);
    
    const percent = (audio.currentTime / audio.duration) * 100;
    progress.style.width = percent + '%';
    
    const currentSec = Math.floor(audio.currentTime);
    timeLabel.innerText = `0:${currentSec.toString().padStart(2, '0')}`;
}

function resetVN(id) {
    document.getElementById('icon-' + id).innerText = 'play_arrow';
    document.getElementById('progress-' + id).style.width = '0%';
    document.getElementById('time-' + id).innerText = '0:00';
}

// --- SISTEM REKAM VOICE NOTE ---
let mediaRecorder;
let audioChunks = [];
let isRecordingVN = false;
let vnTimerInterval;
let vnSeconds = 0;

async function toggleRekamVN() {
    const ikonMic = document.getElementById('ikon-mic');
    const indikator = document.getElementById('vn-indicator');
    const labelTimer = document.getElementById('vn-timer');

    if (!isRecordingVN) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                const unikId = 'vn-' + Date.now();
                
                const pemutarAudio = `
                    <div style="display: flex; align-items: center; gap: 10px; background: #eff6ff; padding: 6px 14px; border-radius: 20px; width: fit-content; margin-top: 5px; border: 1px solid #bfdbfe;">
                        <button onclick="togglePlayVN('${unikId}')" style="background: #3b82f6; color: white; border: none; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);">
                            <span id="icon-${unikId}" class="material-symbols-outlined" style="font-size: 16px;">play_arrow</span>
                        </button>
                        <div style="height: 4px; width: 100px; background: #bfdbfe; border-radius: 2px; position: relative;">
                            <div id="progress-${unikId}" style="height: 100%; width: 0%; background: #3b82f6; border-radius: 2px; transition: width 0.1s linear;"></div>
                        </div>
                        <span id="time-${unikId}" style="font-size: 11px; color: #3b82f6; font-weight: bold; min-width: 25px;">0:00</span>
                        <audio id="${unikId}" src="${audioUrl}" ontimeupdate="updateProgressVN('${unikId}')" onended="resetVN('${unikId}')" style="display: none;"></audio>
                    </div>
                `;
                cetakKomentarKeLayar(pemutarAudio);
            };

            mediaRecorder.start();
            isRecordingVN = true;
            
            ikonMic.style.color = '#ef4444'; 
            indikator.style.display = 'block';
            vnSeconds = 0;
            labelTimer.innerText = vnSeconds;
            
            vnTimerInterval = setInterval(() => {
                vnSeconds++;
                labelTimer.innerText = vnSeconds;
                if (vnSeconds >= 30) {
                    toggleRekamVN(); 
                    tampilkanToast('Maksimal VN 30 detik tercapai', 'info', '#3b82f6');
                }
            }, 1000);

        } catch (err) {
            alert("Gagal merekam: Akses mikrofon ditolak atau perangkat tidak ditemukan.");
        }
    } else {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop()); 
        isRecordingVN = false;
        
        ikonMic.style.color = '#64748b'; 
        indikator.style.display = 'none';
        clearInterval(vnTimerInterval);
    }
}


// === SISTEM MEREKAM & MENCETAK VN (Di dalam fungsi toggleRekamVN sebelumnya) ===
// Cukup cari bagian mediaRecorder.onstop = () => { ... } di file Anda, dan GANTI isi onstop-nya dengan ini:

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                const unikId = 'vn-' + Date.now();
                
                // --- DESAIN PEMUTAR AUDIO KUSTOM ---
                const pemutarAudio = `
                    <div style="display: flex; align-items: center; gap: 10px; background: #eff6ff; padding: 6px 14px; border-radius: 20px; width: fit-content; margin-top: 5px; border: 1px solid #bfdbfe;">
                        
                        <button onclick="togglePlayVN('${unikId}')" style="background: #3b82f6; color: white; border: none; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);">
                            <span id="icon-${unikId}" class="material-symbols-outlined" style="font-size: 16px;">play_arrow</span>
                        </button>
                        
                        <div style="height: 4px; width: 100px; background: #bfdbfe; border-radius: 2px; position: relative;">
                            <div id="progress-${unikId}" style="height: 100%; width: 0%; background: #3b82f6; border-radius: 2px; transition: width 0.1s linear;"></div>
                        </div>
                        
                        <span id="time-${unikId}" style="font-size: 11px; color: #3b82f6; font-weight: bold; min-width: 25px;">0:00</span>
                        
                        <!-- File Asli Disembunyikan (Digerakkan oleh JS) -->
                        <audio id="${unikId}" src="${audioUrl}" ontimeupdate="updateProgressVN('${unikId}')" onended="resetVN('${unikId}')" style="display: none;"></audio>
                    </div>
                `;
                cetakKomentarKeLayar(pemutarAudio);
            };

            mediaRecorder.start();
            isRecordingVN = true;
            
            // Ubah UI menjadi Mode Merekam
            ikonMic.style.color = '#ef4444'; // Mic jadi merah
            indikator.style.display = 'block';
            vnSeconds = 0;
            labelTimer.innerText = vnSeconds;
            
            // Jalankan Timer Maksimal 30 Detik
            vnTimerInterval = setInterval(() => {
                vnSeconds++;
                labelTimer.innerText = vnSeconds;
                if (vnSeconds >= 30) {
                    toggleRekamVN(); // Hentikan paksa jika sentuh 30 detik
                    tampilkanToast('Maksimal VN 30 detik tercapai', 'info', '#3b82f6');
                }
            }, 1000);

       

function aksiUnduh(btn) {
    if (!penggunaSaatIni) return bukaLogin(); 
    tampilkanToast(`Memulai proses unduhan...`, 'download', '#fbbf24');
    
    const postCard = btn.closest('.post-card');
    // Cari gambar ATAU video di dalam postingan tersebut
    const mediaEl = postCard.querySelector('.post-body img') || postCard.querySelector('.post-body video');
    
    if (mediaEl) {
        fetch(mediaEl.src)
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = mediaEl.tagName === 'VIDEO' ? 'Reel_Global_App.mp4' : 'Post_Global_App.jpg';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            }).catch(() => tampilkanToast('Gagal mengunduh media.', 'error', '#ef4444'));
    }
}

// === SISTEM NOTIFIKASI TOAST KUSTOM ===
let toastTimeout; // Variabel untuk mencegah bentrok jika notifikasi muncul beruntun

function tampilkanToast(pesan, ikon = 'check_circle', warnaIkon = '#4ade80') {
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    // Atur isi pesan dan ikon
    toastMessage.innerText = pesan;
    toastIcon.innerText = ikon;
    toastIcon.style.color = warnaIkon;

    // Animasi masuk (muncul dari bawah)
    toast.style.bottom = '40px';
    toast.style.opacity = '1';

    // Bersihkan timer lama jika ada, lalu buat timer baru untuk menyembunyikan
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        // Animasi keluar (tenggelam ke bawah)
        toast.style.bottom = '-100px';
        toast.style.opacity = '0';
    }, 3000); // Hilang otomatis setelah 3 detik
}


// === SISTEM WAKTU (TIMESTAMPS YOUTUBE/IG STYLE) ===
function hitungWaktuLalu(timestampMs) {
    const detikLalu = Math.floor((Date.now() - timestampMs) / 1000);
    if (detikLalu < 60) return 'Baru saja';
    const menitLalu = Math.floor(detikLalu / 60);
    if (menitLalu < 60) return `${menitLalu} mnt`;
    const jamLalu = Math.floor(menitLalu / 60);
    if (jamLalu < 24) return `${jamLalu} j`;
    const hariLalu = Math.floor(jamLalu / 24);
    return `${hariLalu} hr`;
}

// === FITUR LIHAT PROFIL (MUNCULKAN MODAL) ===
// === SISTEM KUNJUNGAN PROFIL ===
let tabSebelumKunjungan = null; // Menyimpan memori terakhir kali user ada di tab mana

function lihatProfil(nama, username, avatar, bio, hasCentangBiru) {
    if (!penggunaSaatIni) return bukaLogin(); // Cegat jika belum login (Guest)
    
    // 1. Sembunyikan tab yang sedang terbuka (misal: tab Post atau Reel)
    const semuaTab = document.querySelectorAll('.content-tab');
    semuaTab.forEach(tab => {
        if (tab.style.display !== 'none' && tab.id !== 'tab-profil-kunjungan') {
            tabSebelumKunjungan = tab.id; // Ingat tab ini
            tab.style.display = 'none';   // Sembunyikan
        }
    });
    
    // 2. Isi data halaman profil kunjungan sesuai nama yang diklik
    document.getElementById('visit-avatar').src = avatar;
    const ikonCentang = hasCentangBiru ? `<span class="material-symbols-outlined" style="color: #3b82f6; font-size: 18px; font-variation-settings: 'FILL' 1;">verified</span>` : '';
    document.getElementById('visit-nama').innerHTML = `${nama} ${ikonCentang}`;
    document.getElementById('visit-username').innerText = `@${username}`;
    document.getElementById('visit-bio').innerText = bio;
    
    // 3. Tampilkan halamannya
    document.getElementById('tab-profil-kunjungan').style.display = 'block';
}

function tutupProfilKunjungan() {
    // Sembunyikan halaman profil
    document.getElementById('tab-profil-kunjungan').style.display = 'none';
    
    // Munculkan kembali tab sebelumnya (Post / Reel)
    if (tabSebelumKunjungan) {
        document.getElementById(tabSebelumKunjungan).style.display = 'block'; 
    }
}

function tutupProfilKunjungan() {
    document.getElementById('tab-profil-kunjungan').style.display = 'none';
    if (tabSebelumKunjungan) {
        document.getElementById(tabSebelumKunjungan).style.display = 'block'; // Kembalikan feed semula
    }
}

function tutupLihatProfil() {
    document.getElementById('modal-lihat-profil').style.display = 'none';
}

// === MEMPERBARUI FUNGSI SINKRONISASI TAMPILAN LOGIN ===
// (TIMPA fungsi perbaruiTampilanSesuaiLogin yang lama dengan ini)
function perbaruiTampilanSesuaiLogin() {
    const profileAuth = document.getElementById('profile-auth');
    const profileUnauth = document.getElementById('profile-unauth');
    const panelStatusPengguna = document.getElementById('status-pengguna-panel'); // Ambil elemen sidebar

    if (penggunaSaatIni) {
        if (profileAuth) profileAuth.style.display = 'block';
        if (profileUnauth) profileUnauth.style.display = 'none';
        
        // Tampilkan Panel Status Online karena user sudah login
        if (panelStatusPengguna) panelStatusPengguna.style.display = 'block';

        if (!penggunaSaatIni.username) penggunaSaatIni.username = "@" + penggunaSaatIni.email.split('@')[0];
        if (!penggunaSaatIni.bio) penggunaSaatIni.bio = "Halo, saya menggunakan Global App!";

        let ikonCentangBiru = '';
        const waktuSekarang = new Date().getTime();
        if (penggunaSaatIni.verifiedUntil && waktuSekarang < penggunaSaatIni.verifiedUntil) {
            ikonCentangBiru = `<span class="material-symbols-outlined" style="color: #3b82f6; font-size: 24px; font-variation-settings: 'FILL' 1;">verified</span>`;
        } else if (penggunaSaatIni.verifiedUntil && waktuSekarang > penggunaSaatIni.verifiedUntil) {
            delete penggunaSaatIni.verifiedUntil; 
            localStorage.setItem('sesiGlobalApp', JSON.stringify(penggunaSaatIni));
        }

        const fotoYangDitampilkan = penggunaSaatIni.fotoCustom || penggunaSaatIni.foto;
        document.getElementById('profile-avatar-img').src = fotoYangDitampilkan;
        document.getElementById('profile-name-text').innerHTML = `${penggunaSaatIni.nama} ${ikonCentangBiru}`;
        document.getElementById('profile-username-text').innerText = penggunaSaatIni.username;
        document.getElementById('profile-bio-text').innerText = penggunaSaatIni.bio;
        
        // Render Daftar Online di Sidebar Kanan (Termasuk diri sendiri + Data Simulasi)
        const wadahOnline = document.getElementById('daftar-online');
        if (wadahOnline) {
            document.getElementById('angka-online').innerText = "1,234"; // Simulasi jumlah
            wadahOnline.innerHTML = `
                <!-- Anda (Selalu di atas) -->
                <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;" onclick="gantiTab('profile', document.getElementById('menu-profile'))">
                    <div style="position: relative;">
                        <img src="${fotoYangDitampilkan}" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; border: 1px solid #e2e8f0;">
                        <div style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #22c55e; border-radius: 50%; border: 2px solid white;"></div>
                    </div>
                    <span style="font-size: 13px; font-weight: 700; color: #1e293b;">Anda</span>
                </div>
                <!-- Simulasi Teman Online -->
                <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;" onclick="lihatProfil('Sarah Lestari', 'sarah.ls', 'https://i.pravatar.cc/150?img=5', 'Pecinta senja.', false)">
                    <div style="position: relative;">
                        <img src="https://i.pravatar.cc/150?img=5" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover;">
                        <div style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #22c55e; border-radius: 50%; border: 2px solid white;"></div>
                    </div>
                    <span style="font-size: 13px; font-weight: 600; color: #475569;">Sarah Lestari</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;" onclick="lihatProfil('Ray Hammond', 'ray.hmd', 'https://i.pravatar.cc/150?img=11', 'Fotografer NY.', false)">
                    <div style="position: relative;">
                        <img src="https://i.pravatar.cc/150?img=11" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover;">
                        <div style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #22c55e; border-radius: 50%; border: 2px solid white;"></div>
                    </div>
                    <span style="font-size: 13px; font-weight: 600; color: #475569;">Ray Hammond</span>
                </div>
            `;
        }
        
    } else {
        if (profileAuth) profileAuth.style.display = 'none';
        if (profileUnauth) profileUnauth.style.display = 'block';
        
        // Sembunyikan Panel Status Online jika belum login
        if (panelStatusPengguna) panelStatusPengguna.style.display = 'none';
    }
}