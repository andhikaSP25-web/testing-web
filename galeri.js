// ==============================================================================
// 1. SISTEM KEAMANAN & IDENTITAS USER (Kritis)
// ==============================================================================
const USERNAME_AKTIF = localStorage.getItem("userAktif") || "tamu";
const API_DRIVE_AKTIF = localStorage.getItem("apiDriveAktif");
const SESSION_TOKEN = localStorage.getItem("sessionToken");

// URL Rahasia untuk proteksi hapus/restore file
const PIN_SISTEM = "kuliahunpkediri2026";

// SECURITY LEVEL: Pengecekan Token Valid (Mencegah bypass inspect element)
if (!API_DRIVE_AKTIF || !SESSION_TOKEN || !SESSION_TOKEN.startsWith("TKN-")) {
    document.documentElement.innerHTML = `
        <head>
            <title>Akses Ditolak</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
            <style>
                body { margin: 0; padding: 0; background: #0f172a; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; overflow: hidden; }
                .security-box { background: #1e293b; padding: 40px; border-radius: 16px; text-align: center; max-width: 400px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border: 1px solid #334155; }
                .icon-bad { font-size: 64px; color: #ef4444; margin-bottom: 16px; }
                h2 { color: #f8fafc; margin: 0 0 12px 0; font-size: 1.5rem; }
                p { color: #94a3b8; margin: 0 0 28px 0; line-height: 1.6; font-size: 0.95rem; }
                button { background: #ef4444; color: white; border: none; padding: 14px 24px; border-radius: 8px; font-weight: 600; width: 100%; cursor: pointer; transition: all 0.2s; }
                button:hover { background: #dc2626; }
            </style>
        </head>
        <body>
            <div class="security-box">
                <span class="material-symbols-outlined icon-bad">gpp_bad</span>
                <h2>Akses Ditolak!</h2>
                <p>Jalur tidak resmi terdeteksi atau koneksi terputus. Silakan login kembali lewat halaman Card.</p>
                <button onclick="window.location.href = 'card.html'">Kembali ke Login</button>
            </div>
        </body>
    `;
    throw new Error("Akses ditolak, menghentikan eksekusi script galeri.");
}

function fungsiLogout() {
    localStorage.removeItem("statusLogin"); 
    localStorage.removeItem("userAktif");
    localStorage.removeItem("apiDriveAktif");
    localStorage.removeItem("sessionToken");
    window.location.href = "card.html"; 
}

// ==============================================================================
// 2. UI HELPERS & LOADING SCREEN
// ==============================================================================
function tampilkanNotifikasi(pesan, tipe = 'success') {
    let toast = document.getElementById('custom-toast');
    if (!toast) {
        const style = document.createElement('style');
        style.innerHTML = `
            #custom-toast { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.8); background: rgba(15, 23, 42, 0.95); color: white; padding: 30px 45px; border-radius: 20px; font-size: 1.1rem; font-weight: 500; z-index: 999999; opacity: 0; visibility: hidden; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; flex-direction: column; align-items: center; gap: 15px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px); text-align: center; }
            #custom-toast.show { opacity: 1; visibility: visible; transform: translate(-50%, -50%) scale(1); }
            #custom-toast .icon { font-size: 65px; }
            #custom-toast.success .icon { color: #27c93f; }
            #custom-toast.error .icon { color: #ef4444; }
        `;
        document.head.appendChild(style);
        toast = document.createElement('div');
        toast.id = 'custom-toast';
        document.body.appendChild(toast);
    }
    
    toast.className = tipe; 
    const iconName = tipe === 'success' ? 'check_circle' : 'error';
    toast.innerHTML = `<span class="material-symbols-outlined icon">${iconName}</span><span>${pesan}</span>`;
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => toast.classList.remove('show'), 3000);
}

window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.classList.add('hidden');
});

// ==============================================================================
// 3. MANAJEMEN TEMA & TAB (Terisolasi per User)
// ==============================================================================
let folderAktif = 'home'; 

function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        themeIcon.innerText = 'light_mode';
        localStorage.setItem('savedTheme_' + USERNAME_AKTIF, 'dark');
    } else {
        themeIcon.innerText = 'dark_mode';
        localStorage.setItem('savedTheme_' + USERNAME_AKTIF, 'light');
    }
}

function bukaTab(jenis) {
    folderAktif = jenis;
    const tabIds = ['tab-home', 'tab-foto', 'tab-video', 'tab-loved', 'tab-settings', 'tab-trash'];
    const menuIds = ['menu-home', 'menu-foto', 'menu-video', 'menu-loved', 'menu-settings', 'menu-trash'];
    const fileInput = document.getElementById('fileInput');
    const textUpload = document.getElementById('text-upload');
    const btnUploadMain = document.getElementById('btn-upload-main');

    localStorage.setItem('tabTerakhir_' + USERNAME_AKTIF, jenis);

    tabIds.forEach(id => { const el = document.getElementById(id); if(el) el.style.display = 'none'; });
    menuIds.forEach(id => { const el = document.getElementById(id); if(el) { el.style.backgroundColor = 'transparent'; el.style.fontWeight = 'normal'; }});

    const tabAktif = document.getElementById(`tab-${jenis}`);
    const menuAktif = document.getElementById(`menu-${jenis}`);
    
    if(tabAktif) tabAktif.style.display = 'block';
    if(menuAktif) { menuAktif.style.backgroundColor = '#f0f2f5'; menuAktif.style.fontWeight = 'bold'; }

    if (jenis === 'loved' || jenis === 'settings' || jenis === 'trash') {
        if(btnUploadMain) btnUploadMain.style.display = 'none'; 
    } else {
        if(btnUploadMain) btnUploadMain.style.display = 'flex'; 
    }

    if (jenis === 'home' || jenis === 'loved') {
        if(fileInput) fileInput.accept = ".jpg, .jpeg, .png, .mp4, .mov";
        if(textUpload) textUpload.innerText = "Upload File";
    } else if (jenis === 'foto') {
        if(fileInput) fileInput.accept = ".jpg, .jpeg, .png";
        if(textUpload) textUpload.innerText = "Upload Foto";
    } else if (jenis === 'video') {
        if(fileInput) fileInput.accept = ".mp4, .mov";
        if(textUpload) textUpload.innerText = "Upload Video";
    }

    periksaIsiKosong(tabAktif);
}

function periksaIsiKosong(folderElemen) {
    if(!folderElemen) return;
    const grid = folderElemen.querySelector('.photo-grid');
    const pesanKosong = folderElemen.querySelector('.pesan-kosong');
    if(!grid) return;
    
    const jumlahFile = grid.querySelectorAll('.photo-card').length;
    if (jumlahFile === 0) {
        grid.style.display = 'none';
        if (pesanKosong) pesanKosong.style.display = 'block';
    } else {
        grid.style.display = 'grid'; 
        if (pesanKosong) pesanKosong.style.display = 'none';
    }
}

// ==============================================================================
// 4. SISTEM UPLOAD & RENDER GRID
// ==============================================================================
document.getElementById('fileInput').addEventListener('change', async function(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    if (files.length > 10) { tampilkanNotifikasi("Maksimal 10 file sekaligus!", "error"); event.target.value = ''; return; }

    const btnUpload = document.getElementById('btn-upload-main');
    const originalText = btnUpload.innerHTML;
    btnUpload.disabled = true;

    let suksesCount = 0, gagalCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name.toLowerCase();
        const validFoto = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png');
        const validVideo = fileName.endsWith('.mp4') || fileName.endsWith('.mov'); 

        if (folderAktif === 'foto' && !validFoto) { gagalCount++; continue; }
        if (folderAktif === 'video' && !validVideo) { gagalCount++; continue; }
        if ((folderAktif === 'home' || folderAktif === 'loved') && !validFoto && !validVideo) { gagalCount++; continue; }

        btnUpload.innerHTML = `<span class="material-symbols-outlined">hourglass_empty</span> Mengunggah (${i + 1}/${files.length})...`;

        try {
            const localPreviewUrl = URL.createObjectURL(file);
            const base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result.split(',')[1]);
                reader.onerror = err => reject(err);
                reader.readAsDataURL(file);
            });

            const formData = new FormData();
            formData.append('fileName', file.name);
            formData.append('mimeType', file.type);
            formData.append('fileData', base64Data);

            // Wajib sertakan action dan username agar Code.gs tahu tujuan folder
            const urlUpload = `${API_DRIVE_AKTIF}?action=upload&username=${encodeURIComponent(USERNAME_AKTIF)}`;
            await fetch(urlUpload, { method: 'POST', mode: 'no-cors', body: formData });
            
            tampilkanKeGrid(file, localPreviewUrl);
            if (typeof simpanKeDatabase === 'function') simpanKeDatabase({ name: file.name, fileObj: file, date: Date.now() });
            if (typeof updateStorageDisplay === 'function') updateStorageDisplay();
            suksesCount++;
        } catch (error) { gagalCount++; }
    }

    if (suksesCount > 0 && gagalCount === 0) {
        tampilkanNotifikasi(`Selesai! ${suksesCount} file berhasil diunggah.`, "success");
        btnUpload.innerHTML = `<span class="material-symbols-outlined">check_circle</span> Upload Berhasil!`;
        btnUpload.style.backgroundColor = '#27c93f'; 
    } else if (suksesCount > 0 && gagalCount > 0) {
        tampilkanNotifikasi(`Selesai. ${suksesCount} berhasil, ${gagalCount} diblokir.`, "success");
        btnUpload.innerHTML = `<span class="material-symbols-outlined">check_circle</span> Sebagian Berhasil`;
        btnUpload.style.backgroundColor = '#ffbd2e';
    } else {
        tampilkanNotifikasi("Semua file gagal diunggah.", "error");
        btnUpload.innerHTML = `<span class="material-symbols-outlined">error</span> Gagal!`;
        btnUpload.style.backgroundColor = '#ff5f56'; 
    }

    setTimeout(() => {
        btnUpload.innerHTML = originalText;
        btnUpload.style.backgroundColor = '#5b8df8'; 
        btnUpload.disabled = false;
    }, 4000);
    event.target.value = ''; 
});

function tampilkanKeGrid(file, dataUrl, isDariDatabase = false, isLoved = false) {
    const isVideo = file.name.toLowerCase().endsWith('.mp4') || file.name.toLowerCase().endsWith('.mov');
    const targetGrids = isDariDatabase ? ['home', (isVideo ? 'video' : 'foto')] : [folderAktif, 'home'];
    if (isLoved) targetGrids.push('loved'); 

    [...new Set(targetGrids)].forEach(tabId => {
        const grid = document.querySelector(`#tab-${tabId} .photo-grid`);
        const pesanKosong = document.querySelector(`#tab-${tabId} .pesan-kosong`);
        const sortOrder = document.getElementById(`sort-${tabId}`)?.value || 'new';

        if(grid) {
            const card = document.createElement('div');
            card.classList.add('photo-card');
            if (isLoved) card.classList.add('loved'); 
            card.dataset.src = dataUrl;
            card.dataset.type = isVideo ? 'video' : 'image';
            card.dataset.size = file.size || 0; 
            card.dataset.filename = file.name; 
            
            if (!isVideo) { 
                card.style.backgroundImage = `url('${dataUrl}')`; 
            } else { 
                card.innerHTML = `<video src="${dataUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;" muted loop onmouseover="this.play()" onmouseout="this.pause()" preload="metadata"></video>`; 
            }
            card.onclick = function() { openPhoto(this); };

            if(pesanKosong) pesanKosong.style.display = 'none';
            grid.style.display = 'grid';
            if (sortOrder === 'new') grid.prepend(card); else grid.append(card); 
        }
    });
}

function tampilkanKeSampahLokal(file, dataUrl) {
    const isVideo = file.name.toLowerCase().endsWith('.mp4') || file.name.toLowerCase().endsWith('.mov');
    const trashGrid = document.querySelector('#tab-trash .photo-grid');
    if (!trashGrid) return;

    const card = document.createElement('div');
    card.classList.add('photo-card');
    card.dataset.src = dataUrl;
    card.dataset.filename = file.name;
    card.dataset.type = isVideo ? 'video' : 'image';
    card.dataset.size = file.size || 0;
    card.dataset.trashed = 'true'; 
    card.style.opacity = '0.5'; card.style.pointerEvents = 'auto'; card.style.cursor = 'pointer';

    if (!isVideo) { 
        card.style.backgroundImage = `url('${dataUrl}')`; 
    } else { 
        card.innerHTML = `<video src="${dataUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;"></video>`; 
    }

    card.onclick = function() { openPhoto(this); }; 
    trashGrid.prepend(card);
}

document.querySelectorAll('.sort-dropdown').forEach(dropdown => {
    dropdown.addEventListener('change', function() {
        const grid = this.closest('section').querySelector('.photo-grid');
        if (!grid) return;
        const cards = Array.from(grid.querySelectorAll('.photo-card')).reverse();
        grid.innerHTML = ''; cards.forEach(c => grid.appendChild(c));
    });
});

// ==============================================================================
// 5. SISTEM DATABASE LOKAL (Terisolasi per User)
// ==============================================================================
let db;
const request = indexedDB.open("GaleriLokalDB_" + USERNAME_AKTIF, 1);
request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("media")) db.createObjectStore("media", { keyPath: "name" });
};
request.onsuccess = (e) => { db = e.target.result; muatMediaDariDatabase(); };

function simpanKeDatabase(mediaObject) {
    if (db) db.transaction(["media"], "readwrite").objectStore("media").put(mediaObject);
}
function hapusDariDatabase(fileName) {
    if (db) db.transaction(["media"], "readwrite").objectStore("media").delete(fileName);
}
function updateLoveDiDatabase(fileName, isLoved) {
    if (!db) return;
    const store = db.transaction(["media"], "readwrite").objectStore("media");
    const req = store.get(fileName);
    req.onsuccess = () => { if (req.result) { req.result.isLoved = isLoved; store.put(req.result); } };
}
function tandaiSampahDiDatabase(fileName, targetSrc) {
    if (!db) return;
    const store = db.transaction(["media"], "readwrite").objectStore("media");
    const req = store.get(fileName);
    req.onsuccess = () => {
        let data = req.result;
        if (data) { data.isTrashed = true; if (!data.fileObj) data.url = targetSrc; store.put(data); }
        else { store.put({ name: fileName, url: targetSrc, isTrashed: true, date: Date.now() }); }
    };
}
function muatMediaDariDatabase() {
    if (!db) return;
    const req = db.transaction(["media"], "readonly").objectStore("media").getAll();
    req.onsuccess = () => {
        const hasil = req.result.sort((a, b) => a.date - b.date); 
        ['home', 'foto', 'video', 'loved', 'trash'].forEach(t => {
            const g = document.querySelector(`#tab-${t} .photo-grid`); if(g) g.innerHTML = '';
        });
        hasil.forEach(item => {
            let mediaUrl = item.fileObj ? (URL.createObjectURL(item.fileObj) || item.url) : item.url;
            if (!mediaUrl) return;
            if (item.isTrashed) tampilkanKeSampahLokal({ name: item.name, size: item.size || 0 }, mediaUrl);
            else tampilkanKeGrid({ name: item.name, size: item.size || 0 }, mediaUrl, true, item.isLoved || false);
        });
        ['home', 'foto', 'video', 'loved', 'trash'].forEach(t => periksaIsiKosong(document.getElementById(`tab-${t}`)));
    };
}

// ==============================================================================
// 6. SISTEM VIEWER (LIGHTBOX) & AKSI FILE
// ==============================================================================
let currentMediaList = [], currentIndex = 0;

function openPhoto(element) {
    const cards = Array.from(document.querySelector(`#tab-${folderAktif} .photo-grid`).querySelectorAll('.photo-card'));
    currentMediaList = cards.map(c => ({ type: c.dataset.type, src: c.dataset.src, cardRef: c }));
    currentIndex = Math.max(0, cards.indexOf(element));
    renderViewer();
    document.getElementById('photo-viewer').classList.add('show');
}

function renderViewer() {
    if(currentMediaList.length === 0) return closePhoto();
    const media = currentMediaList[currentIndex];
    const imgEl = document.getElementById('full-image'), vidEl = document.getElementById('full-video');
    const dlBtn = document.getElementById('download-btn'), loveBtn = document.getElementById('btn-love');

    if (media.type === 'image') {
        imgEl.src = media.src; imgEl.style.display = 'block'; vidEl.style.display = 'none'; vidEl.pause();
    } else {
        imgEl.style.display = 'none'; vidEl.style.display = 'block'; vidEl.src = media.src; vidEl.play().catch(e => {});
    }

    dlBtn.href = media.src;
    loveBtn.classList.toggle('active-love', media.cardRef.classList.contains('loved'));

    const leftArr = document.querySelector('.nav-arrow.left'), rightArr = document.querySelector('.nav-arrow.right');
    if (leftArr) leftArr.style.display = currentIndex === 0 ? 'none' : 'block';
    if (rightArr) rightArr.style.display = currentIndex === currentMediaList.length - 1 ? 'none' : 'block';

    const nBar = document.querySelector('.action-bar:not(#trash-action-bar)');
    let tBar = document.getElementById('trash-action-bar');
    if (!tBar) {
        tBar = document.createElement('div'); tBar.id = 'trash-action-bar'; tBar.className = 'action-bar';
        tBar.innerHTML = `<span class="material-symbols-outlined action-btn" onclick="restoreMedia()" title="Pulihkan File">restore_from_trash</span>`;
        if (nBar) nBar.parentNode.insertBefore(tBar, nBar.nextSibling);
    }

    if (media.cardRef.dataset.trashed === 'true' || folderAktif === 'trash') {
        if(nBar) nBar.style.display = 'none'; tBar.style.display = 'flex';
    } else {
        if(nBar) nBar.style.display = 'flex'; tBar.style.display = 'none';
    }
}

function nextMedia() { if (currentIndex < currentMediaList.length - 1) { currentIndex++; renderViewer(); } }
function prevMedia() { if (currentIndex > 0) { currentIndex--; renderViewer(); } }

function closePhoto() {
    document.getElementById('photo-viewer').classList.remove('show');
    document.getElementById('full-video').pause();
    document.getElementById('full-image').classList.remove('mode-profil');
    
    const nBar = document.querySelector('.action-bar:not(#trash-action-bar)');
    if (nBar) nBar.style.cssText = 'display: flex;';
    const tBar = document.getElementById('trash-action-bar');
    if (tBar) tBar.style.display = 'none';
    const pBar = document.getElementById('custom-profile-bar');
    if (pBar) pBar.style.display = 'none';
    
    isConfirmingDelete = false; isConfirmingDeleteProfil = false;
    document.getElementById('delete-tooltip')?.classList.remove('show');
}

function toggleLove() {
    const media = currentMediaList[currentIndex];
    const loveBtn = document.getElementById('btn-love');
    const fileName = media.cardRef.dataset.filename;
    const isNowLoved = !media.cardRef.classList.contains('loved');
    
    loveBtn.classList.toggle('active-love', isNowLoved);
    document.querySelectorAll(`.photo-card[data-filename="${fileName}"]`).forEach(c => c.classList.toggle('loved', isNowLoved));
    
    const lovedGrid = document.querySelector('#tab-loved .photo-grid');
    if (isNowLoved) {
        if (lovedGrid && !lovedGrid.querySelector(`.photo-card[data-filename="${fileName}"]`)) {
            const kloning = media.cardRef.cloneNode(true);
            kloning.onclick = function() { openPhoto(this); };
            lovedGrid.prepend(kloning);
        }
    } else {
        document.querySelectorAll(`#tab-loved .photo-card[data-filename="${fileName}"]`).forEach(c => c.remove());
        if(folderAktif === 'loved') closePhoto();
    }
    
    updateLoveDiDatabase(fileName, isNowLoved);
    periksaIsiKosong(document.getElementById('tab-loved'));
}

// === PENGHAPUSAN DAN PEMULIHAN FILE (SINKRON DRIVE MULTI-FOLDER) ===
let isConfirmingDelete = false, deleteTimeout;

async function deleteMedia() {
    const tooltip = document.getElementById('delete-tooltip');
    if (!isConfirmingDelete) {
        isConfirmingDelete = true;
        if(tooltip) { tooltip.classList.add('show'); tooltip.innerText = 'Apakah di hapus?'; }
        clearTimeout(deleteTimeout); deleteTimeout = setTimeout(() => { isConfirmingDelete = false; if(tooltip) tooltip.classList.remove('show'); }, 3000);
        return; 
    }
    
    isConfirmingDelete = false; if(tooltip) tooltip.innerText = 'Memindahkan...'; 
    const media = currentMediaList[currentIndex], fileName = media.cardRef.dataset.filename, targetSrc = media.cardRef.dataset.src; 
    const deleteBtn = document.querySelector('.action-btn[title="Hapus"]');
    const originalIcon = deleteBtn.innerHTML; deleteBtn.innerHTML = 'hourglass_empty'; deleteBtn.style.pointerEvents = 'none'; 

    try {
        if (fileName) {
            fetch(`${API_DRIVE_AKTIF}?action=deleteFile&username=${encodeURIComponent(USERNAME_AKTIF)}&fileName=${encodeURIComponent(fileName)}&pin=${PIN_SISTEM}`, { method: 'GET', mode: 'no-cors' });
            tandaiSampahDiDatabase(fileName, targetSrc);
        }
        document.querySelectorAll(`.photo-card[data-src="${targetSrc}"]`).forEach(c => c.remove());
        tampilkanKeSampahLokal({ name: fileName, size: media.cardRef.dataset.size || 0 }, targetSrc);
        closePhoto(); 
        ['home', 'foto', 'video', 'loved', 'trash'].forEach(t => periksaIsiKosong(document.getElementById(`tab-${t}`)));
        setTimeout(() => updateStorageDisplay(), 1500);
        tampilkanNotifikasi("File dipindahkan ke Sampah.", "success");
    } catch (e) { tampilkanNotifikasi("Gagal memindahkan file.", "error"); } 
    finally { deleteBtn.innerHTML = originalIcon; deleteBtn.style.pointerEvents = 'auto'; if(tooltip) tooltip.classList.remove('show'); }
}

async function restoreMedia() {
    const media = currentMediaList[currentIndex], fileName = media.cardRef.dataset.filename, targetSrc = media.cardRef.dataset.src;
    const restoreBtn = document.querySelector('#trash-action-bar .action-btn');
    const originalIcon = restoreBtn.innerHTML; restoreBtn.innerHTML = 'hourglass_empty'; restoreBtn.style.pointerEvents = 'none';

    try {
        if (fileName) {
            fetch(`${API_DRIVE_AKTIF}?action=restoreFile&username=${encodeURIComponent(USERNAME_AKTIF)}&fileName=${encodeURIComponent(fileName)}&pin=${PIN_SISTEM}`, { method: 'GET', mode: 'no-cors' });
            if (db) {
                const req = db.transaction(["media"], "readwrite").objectStore("media").get(fileName);
                req.onsuccess = () => { if (req.result) { req.result.isTrashed = false; db.transaction(["media"], "readwrite").objectStore("media").put(req.result); } };
            }
        }
        media.cardRef.remove(); closePhoto();
        tampilkanKeGrid({ name: fileName, size: media.cardRef.dataset.size || 0 }, targetSrc, true, false);
        ['home', 'foto', 'video', 'trash'].forEach(t => periksaIsiKosong(document.getElementById(`tab-${t}`)));
        setTimeout(() => updateStorageDisplay(), 1500);
        tampilkanNotifikasi("File berhasil dipulihkan!", "success");
    } catch (e) { tampilkanNotifikasi("Gagal memulihkan file.", "error"); } 
    finally { restoreBtn.innerHTML = originalIcon; restoreBtn.style.pointerEvents = 'auto'; }
}

// Variabel untuk melacak status tombol
let isConfirmingEmptyTrash = false;
let trashTimeout;

// 1. FUNGSI TRIGGER TOMBOL (Animasi dari Kiri ke Kanan)
function kosongkanSampah() {
    const confirmText = document.getElementById('trash-confirm-text');
    const btnText = document.getElementById('trash-btn-text');
    const btnAction = document.getElementById('btn-kosongkan-sampah');

    // Mencegah error jika elemen tidak ditemukan di HTML
    if (!confirmText || !btnText || !btnAction) return;

    if (!isConfirmingEmptyTrash) {
        // STATE 1: PERTAMA KALI DIKLIK (MUNCULKAN KONFIRMASI)
        isConfirmingEmptyTrash = true;
        
        // Animasi memunculkan teks dari kiri ke kanan
        confirmText.style.opacity = '1';
        confirmText.style.transform = 'translateX(0)';
        
        // Ubah tulisan tombol
        btnText.innerText = 'Klik untuk menghapus';
        btnAction.style.backgroundColor = '#dc2626'; // Warna merah lebih gelap saat hover state aktif

        // Kembalikan ke keadaan semula jika pengguna tidak jadi mengklik dalam 4 detik
        clearTimeout(trashTimeout);
        trashTimeout = setTimeout(resetTombolSampah, 4000);
    } else {
        // STATE 2: DIKLIK KEDUA KALINYA (EKSEKUSI HAPUS PERMANEN)
        clearTimeout(trashTimeout);
        eksekusiKosongkanSampah(btnAction, btnText, confirmText);
    }
}

// 2. FUNGSI RESET TOMBOL (Kembali ke keadaan awal)
function resetTombolSampah() {
    isConfirmingEmptyTrash = false;
    
    const confirmText = document.getElementById('trash-confirm-text');
    const btnText = document.getElementById('trash-btn-text');
    const btnAction = document.getElementById('btn-kosongkan-sampah');
    
    if (confirmText && btnText && btnAction) {
        // Animasi menyembunyikan teks kembali ke kiri
        confirmText.style.opacity = '0';
        confirmText.style.transform = 'translateX(20px)';
        
        // Kembalikan tulisan tombol
        btnText.innerText = 'Kosongkan Sampah';
        btnAction.style.backgroundColor = '#ef4444'; 
    }
}

// 3. FUNGSI EKSEKUSI PENGHAPUSAN KE SERVER
async function eksekusiKosongkanSampah(btnAction, btnText, confirmText) {
    // Ubah status UI menjadi sedang memuat (Loading)
    btnAction.style.pointerEvents = 'none';
    btnAction.style.opacity = '0.7';
    btnText.innerText = 'Menghapus...';
    confirmText.style.opacity = '0';

    try {
        // Panggil API Drive untuk menghapus permanen (Support Multi-Drive)
        await fetch(`${API_DRIVE_AKTIF.split('?')[0]}?action=emptyTrash&username=${encodeURIComponent(USERNAME_AKTIF)}&pin=${PIN_SISTEM}`, { method: 'GET', mode: 'no-cors' });
        
        // Bersihkan UI Galeri
        document.querySelector('#tab-trash .photo-grid').innerHTML = '';
        periksaIsiKosong(document.getElementById('tab-trash'));
        
        // Bersihkan Database Lokal IndexedDB
        if (db) {
            const req = db.transaction(["media"], "readwrite").objectStore("media").getAll();
            req.onsuccess = () => { 
                req.result.forEach(item => { 
                    if (item.isTrashed) db.transaction(["media"], "readwrite").objectStore("media").delete(item.name); 
                }); 
            }
        }
        
        // Perbarui sisa storage Drive
        setTimeout(() => updateStorageDisplay(), 2000);
        tampilkanNotifikasi("Sampah dikosongkan permanen!", "success");
    } catch (e) { 
        tampilkanNotifikasi("Gagal membersihkan sampah.", "error"); 
    } finally { 
        // Kembalikan tombol ke keadaan normal
        btnAction.style.pointerEvents = 'auto';
        btnAction.style.opacity = '1';
        resetTombolSampah();
    }
}

// ==============================================================================
// 7. SISTEM PROFIL (Terisolasi per User)
// ==============================================================================
function bukaProfil() {
    const avatar = document.getElementById('sidebar-avatar');
    let urlFoto = avatar.style.backgroundImage !== 'none' ? avatar.style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '') : '';

    const imgEl = document.getElementById('full-image'), vidEl = document.getElementById('full-video');
    document.querySelector('.action-bar')?.style.setProperty('display', 'none', 'important');

    imgEl.classList.add('mode-profil'); imgEl.src = urlFoto; imgEl.style.display = 'block'; imgEl.style.backgroundColor = urlFoto ? 'transparent' : '#ddd';
    vidEl.style.display = 'none'; vidEl.pause();
    document.querySelector('.nav-arrow.left')?.style.setProperty('display', 'none');
    document.querySelector('.nav-arrow.right')?.style.setProperty('display', 'none');
    
    let pBar = document.getElementById('custom-profile-bar');
    if (!pBar) {
        pBar = document.createElement('div'); pBar.id = 'custom-profile-bar';
        pBar.innerHTML = `<div id="delete-profil-tooltip" class="tooltip-merah" style="position:absolute; top:-45px; background:#ff4d4d; color:white; padding:6px 12px; border-radius:8px; opacity:0; transition:0.2s;">Hapus?</div><label class="action-btn" id="btn-upload-profil" style="cursor:pointer; display:flex; align-items:center;"><span class="material-symbols-outlined" style="color:#fff;">upload</span><input type="file" accept=".jpg, .jpeg, .png" style="display:none;" onchange="updateProfil(event)"></label><div id="profil-divider" style="width:1px; height:18px; background:rgba(255,255,255,0.3); margin:0 5px;"></div><span class="action-btn" onclick="hapusProfil()" style="cursor:pointer; display:flex; align-items:center;"><span class="material-symbols-outlined" style="color:#ff4d4d;">delete</span></span>`;
        pBar.style.cssText = 'position:absolute; bottom:25px; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:15px; background:rgba(0,0,0,0.8); padding:8px 20px; border-radius:30px; border:1px solid rgba(255,255,255,0.15); backdrop-filter:blur(10px); z-index:100005;';
        document.querySelector('.photo-container').appendChild(pBar);
    }
    
    document.getElementById('btn-upload-profil').style.display = urlFoto ? 'none' : 'flex';
    document.getElementById('profil-divider').style.display = urlFoto ? 'none' : 'block';
    
    isConfirmingDeleteProfil = false; document.getElementById('delete-profil-tooltip')?.classList.remove('show');
    pBar.style.display = 'flex'; document.getElementById('photo-viewer').classList.add('show');
}

async function updateProfil(event) {
    const file = event.target.files[0]; if (!file) return;
    const pBar = document.getElementById('custom-profile-bar'); if(pBar) pBar.style.opacity = '0.5'; 

    try {
        const base64Data = await new Promise(res => { const reader = new FileReader(); reader.onload = e => res(e.target.result); reader.readAsDataURL(file); });
        document.getElementById('sidebar-avatar').style.backgroundImage = `url('${base64Data}')`;
        document.getElementById('full-image').src = base64Data;
        document.getElementById('full-image').style.backgroundColor = 'transparent';
        
        localStorage.setItem('savedProfilePic_' + USERNAME_AKTIF, base64Data);
        localStorage.setItem('profileFileName_' + USERNAME_AKTIF, 'PROFIL_' + file.name);

        const formData = new FormData();
        formData.append('fileName', 'PROFIL_' + file.name);
        formData.append('mimeType', file.type);
        formData.append('fileData', base64Data.split(',')[1]);

        // Upload ke folder spesifik milik user yang sedang aktif
        const urlUpload = `${API_DRIVE_AKTIF}?action=upload&username=${encodeURIComponent(USERNAME_AKTIF)}`;
        await fetch(urlUpload, { method: 'POST', mode: 'no-cors', body: formData });
        
        if (typeof updateStorageDisplay === 'function') updateStorageDisplay(); 
        tampilkanNotifikasi("Foto profil berhasil diunggah!", "success");
        
        document.getElementById('btn-upload-profil').style.display = 'none';
        document.getElementById('profil-divider').style.display = 'none';
    } catch (e) { tampilkanNotifikasi("Gagal mengunggah profil.", "error"); } 
    finally { if(pBar) pBar.style.opacity = '1'; event.target.value = ''; }
}

let isConfirmingDeleteProfil = false, deleteProfilTimeout;

async function hapusProfil() {
    const tooltip = document.getElementById('delete-profil-tooltip');
    if (!isConfirmingDeleteProfil) {
        isConfirmingDeleteProfil = true; if(tooltip) { tooltip.classList.add('show'); tooltip.innerText = 'Apakah di hapus?'; }
        clearTimeout(deleteProfilTimeout); deleteProfilTimeout = setTimeout(() => { isConfirmingDeleteProfil = false; if(tooltip) tooltip.classList.remove('show'); }, 3000);
        return; 
    }

    isConfirmingDeleteProfil = false; if(tooltip) tooltip.innerText = 'Menghapus...'; 
    const pBar = document.getElementById('custom-profile-bar'); if(pBar) pBar.style.opacity = '0.5'; 

    const fileName = localStorage.getItem('profileFileName_' + USERNAME_AKTIF);
    localStorage.removeItem('savedProfilePic_' + USERNAME_AKTIF);
    localStorage.removeItem('profileFileName_' + USERNAME_AKTIF);
    document.getElementById('sidebar-avatar').style.backgroundImage = 'none';
    closePhoto(); 

    if (fileName) {
        try {
            fetch(`${API_DRIVE_AKTIF}?action=deleteFile&username=${encodeURIComponent(USERNAME_AKTIF)}&fileName=${encodeURIComponent(fileName)}&pin=${PIN_SISTEM}`, { method: 'GET', mode: 'no-cors' });
            setTimeout(() => updateStorageDisplay(), 1500);
            tampilkanNotifikasi("Foto profil dihapus.", "success");
        } catch (e) { tampilkanNotifikasi("Terjadi kesalahan sistem.", "error"); } 
        finally { if(pBar) pBar.style.opacity = '1'; if(tooltip) tooltip.classList.remove('show'); }
    }
}


// ==============================================================================
// 8. SINKRONISASI DRIVE (Storage, Auto-Sync)
// ==============================================================================
async function updateStorageDisplay() {
    const textElement = document.getElementById('storage-text'), percentElement = document.getElementById('storage-percent'), fillElement = document.getElementById('storage-fill');
    try {
        const response = await fetch(`${API_DRIVE_AKTIF}?action=getStorage&username=${encodeURIComponent(USERNAME_AKTIF)}&pin=${PIN_SISTEM}`);
        const data = await response.json();
        let percentage = Math.min((data.used / data.limit) * 100, 100);
        if(fillElement) fillElement.style.width = percentage + '%';
        if(textElement) textElement.innerText = `${(data.used / (1024*1024)).toFixed(1)} MB of ${(data.limit / (1024*1024*1024)).toFixed(2)} GB`;
        if(percentElement) percentElement.innerText = `${percentage % 1 === 0 ? percentage : percentage.toFixed(1)}%`;
    } catch (e) {}
}

async function sinkronkanGaleri() {
    const textStorage = document.getElementById('storage-text');
    if(textStorage) textStorage.innerText = "Menyinkronkan...";

    try {
        const response = await fetch(`${API_DRIVE_AKTIF}?action=getFiles&username=${encodeURIComponent(USERNAME_AKTIF)}`);
        const driveFiles = await response.json();
        if (driveFiles.error) throw new Error(driveFiles.error);

        const profilDiDrive = driveFiles.find(f => f.name.startsWith('PROFIL_'));
        
        if (profilDiDrive) {
            localStorage.setItem('profileFileName_' + USERNAME_AKTIF, profilDiDrive.name);
        }

        // AUTO-SYNC FILE MEDIA
        if (db) {
            const req = db.transaction(["media"], "readwrite").objectStore("media").getAll();
            req.onsuccess = () => {
                let adaPerubahan = false;
                req.result.forEach(dbFile => {
                    if ((!driveFiles.some(d => d.name === dbFile.name) || dbFile.name.startsWith('PROFIL_')) && !dbFile.isTrashed) {
                        db.transaction(["media"], "readwrite").objectStore("media").delete(dbFile.name); adaPerubahan = true; 
                    }
                });
                driveFiles.forEach(dFile => {
                    if (dFile.name.startsWith('PROFIL_')) return; 
                    if (!req.result.some(dbFile => dbFile.name === dFile.name)) {
                        db.transaction(["media"], "readwrite").objectStore("media").put({ name: dFile.name, url: dFile.url, isTrashed: false, date: Date.now() });
                        adaPerubahan = true; 
                    }
                });
                if (adaPerubahan) muatMediaDariDatabase(); 
            };
        }
        updateStorageDisplay();
    } catch (e) { 
        if(textStorage) textStorage.innerText = "Mode Offline"; 
    }
}

// ==============================================================================
// 9. SISTEM PAKET & PEMBAYARAN MIDTRANS OTOMATIS
// ==============================================================================
function bukaModalUpgrade() { document.getElementById('upgradeModal')?.classList.add('show'); }
function tutupModalUpgrade() { document.getElementById('upgradeModal')?.classList.remove('show'); }

let paketPending = ''; 
let timerQrisInterval;
let intervalCekBayar;

function tutupModalQRIS() { 
    document.getElementById('qrisModal')?.classList.remove('show');
    clearInterval(timerQrisInterval); 
    clearInterval(intervalCekBayar); 
}
async function bayarPaketQRIS(namaPaket, harga) {
    paketPending = namaPaket; 
    tutupModalUpgrade(); 
    
    const hargaAngka = harga.toString().replace(/[^0-9]/g, '');
    const orderIdUnik = "INV-" + USERNAME_AKTIF + "-" + Date.now();
    const nominalFormatted = new Intl.NumberFormat('id-ID').format(hargaAngka);
    
    document.getElementById('qris-paket-nama').innerText = namaPaket;
    document.getElementById('qris-paket-harga').innerText = "Rp " + nominalFormatted;
    
    const timerText = document.getElementById('qris-timer-text');
    const qrImage = document.querySelector('#qrisModal img');
    
    if (timerText) {
        timerText.innerText = `Menghasilkan kode QRIS...`;
        timerText.style.color = '#f59e0b';
    }
    
    // PEMAKSAAN UI: Sembunyikan total elemen <img> saat loading
    if (qrImage) {
        qrImage.style.display = "none";
        qrImage.src = ""; 
    }
    
    document.getElementById('qrisModal')?.classList.add('show');
    
    try {
        const response = await fetch(`${API_DRIVE_AKTIF}?action=createMidtrans&username=${encodeURIComponent(USERNAME_AKTIF)}&orderId=${orderIdUnik}&paket=${namaPaket}`);
        const data = await response.json();

        if (data.status === "success" && data.qr_url) {
            // MUNCULKAN KEMBALI HANYA JIKA ADA URL QRIS
            if (qrImage) {
                qrImage.src = data.qr_url;
                qrImage.style.display = "block";
                qrImage.style.opacity = "1";
            }
            if (timerText) timerText.style.color = '#94a3b8';

            mulaiHitungMundurQRIS(60); // waktu qris 60 detik
            pantauPembayaranOtomatis(orderIdUnik);
        } else {
            // TAMPILKAN ERROR ASLI MIDTRANS
            if (timerText) {
                timerText.innerText = `Error Midtrans:\n ${data.message}`;
                timerText.style.color = '#ef4444';
                timerText.style.fontSize = '0.8rem'; // Dikecilkan agar error panjang bisa terbaca
            }
            if (qrImage) qrImage.style.display = "none";
        }
    } catch (error) {
        if (timerText) {
            timerText.innerText = `Gagal terhubung ke API Pembayaran.`;
            timerText.style.color = '#ef4444';
        }
        if (qrImage) qrImage.style.display = "none";
    }
}

// Memperbaiki logika matematika waktu mundur QRIS
function mulaiHitungMundurQRIS(durasiTotalDetik) {
    let sisaWaktu = durasiTotalDetik;
    const timerText = document.getElementById('qris-timer-text');
    
    // Pastikan interval yang lama dibersihkan agar timer tidak tumpang tindih (berjalan ganda)
    clearInterval(timerQrisInterval);

    timerQrisInterval = setInterval(() => {
        sisaWaktu--;
        
        // RUMUS YANG BENAR: Pembagi mutlak harus angka 60 (karena 1 menit = 60 detik)
        let menit = Math.floor(sisaWaktu / 60); 
        let detik = sisaWaktu % 60; 
        
        if (timerText) {
            // padStart(2, '0') memastikan angka di bawah 10 selalu diawali angka nol (misal '09' bukan '9')
            timerText.innerText = `Menunggu pembayaran... (${menit.toString().padStart(2, '0')}:${detik.toString().padStart(2, '0')})`;
        }

        // Ketika waktu mencapai angka nol
        if (sisaWaktu <= 0) {
            clearInterval(timerQrisInterval);
            clearInterval(intervalCekBayar); // Hentikan pencarian status pembayaran ke server
            
            if (timerText) { 
                timerText.innerText = `Waktu habis. Pembayaran dibatalkan.`; 
                timerText.style.color = '#ef4444'; // Ubah teks menjadi merah
            }
            
            // Tutup pop-up secara otomatis setelah 2 detik
            setTimeout(() => { 
                tutupModalQRIS(); 
                tampilkanNotifikasi("Waktu habis. Paket batal diaktifkan.", "error"); 
            }, 2000);
        }
    }, 1000); // 1000 milidetik = Berjalan tepat 1 detik sekali
}

function pantauPembayaranOtomatis(orderId) {
    clearInterval(intervalCekBayar);
    intervalCekBayar = setInterval(async () => {
        try {
            const res = await fetch(`${API_DRIVE_AKTIF}?action=cekStatus&username=${encodeURIComponent(USERNAME_AKTIF)}&orderId=${orderId}`);
            const data = await res.json();
            
            if (data.status === "settlement" || data.status === "capture") {
                clearInterval(intervalCekBayar);
                clearInterval(timerQrisInterval);
                prosesPembayaranSukses(); 
            }
        } catch (error) {
            console.error("Mengecek status pembayaran...");
        }
    }, 5000);
}

function prosesPembayaranSukses() {
    const timerText = document.getElementById('qris-timer-text');
    if (timerText) {
        timerText.innerHTML = `<span class="material-symbols-outlined" style="vertical-align: middle;">check_circle</span> Pembayaran Berhasil!`;
        timerText.style.color = '#10b981'; 
    }

    localStorage.setItem('paketAktif_' + USERNAME_AKTIF, paketPending);
    localStorage.setItem('paketExpired_' + USERNAME_AKTIF, Date.now() + (30 * 24 * 60 * 60 * 1000));
    
    setTimeout(() => { tutupModalQRIS(); terapkanPaketSaatIni(); tampilkanNotifikasi(`Paket ${paketPending} aktif selama 30 Hari!`, "success"); }, 1500);
}

function terapkanPaketSaatIni() {
    const paket = localStorage.getItem('paketAktif_' + USERNAME_AKTIF) || 'Free';
    const expired = localStorage.getItem('paketExpired_' + USERNAME_AKTIF);

    if (expired && Date.now() > parseInt(expired)) {
        localStorage.setItem('paketAktif_' + USERNAME_AKTIF, 'Free'); localStorage.removeItem('paketExpired_' + USERNAME_AKTIF);
        tampilkanNotifikasi("Masa aktif paket habis. Kembali ke paket Free.", "error");
        return terapkanPaketSaatIni(); 
    }

    const sBintang = document.getElementById('bintang-status-kiri'), tStatus = document.getElementById('teks-status-user'), tAktif = document.getElementById('teks-aktif-sejak');
    const mBintang = localStorage.getItem('basePaketManual_' + USERNAME_AKTIF) || 'default', mStatus = localStorage.getItem('teksStatusManual_' + USERNAME_AKTIF) || 'User Biasa', mAktif = localStorage.getItem('tanggalAktif_' + USERNAME_AKTIF) || '-';

    if (tAktif) tAktif.innerText = 'Aktif Sejak: ' + mAktif;
    let bCard = 1; 

    if (paket === 'Standar') {
        if (sBintang) sBintang.innerText = '★★★★☆'; if (tStatus) tStatus.innerText = 'Status: Member'; bCard = 4;
    } else if (paket === 'Tingkat lanjut') {
        if (sBintang) sBintang.innerText = '★★★★★'; if (tStatus) tStatus.innerText = 'Status: VIP Member'; bCard = 5;
    } else {
        if (sBintang) { if (mBintang === 'normal') { sBintang.innerText = '★★☆☆☆'; bCard = 2; } else if (mBintang === 'regular') { sBintang.innerText = '★★★☆☆'; bCard = 3; } else { sBintang.innerText = '★☆☆☆☆'; bCard = 1; } }
        if (tStatus) tStatus.innerText = 'Status: ' + mStatus; 
    }
    
    localStorage.setItem('userStarsSync_' + USERNAME_AKTIF, bCard);

    // --- TAMBAHAN KUNCI: LAPOR KE SERVER (SHOPEE STYLE) ---
    // Diam-diam mengirim data bintang terbaru ke server tanpa merusak UI Galeri
    try {
        fetch(`${API_DRIVE_AKTIF}?action=updatePackage&username=${USERNAME_AKTIF}&paket=${encodeURIComponent(paket)}&bintang=${bCard}&t=${Date.now()}`, { method: 'GET', mode: 'no-cors' });
    } catch(e) {}
    // -------------------------------------------------------

    const mLoved = document.getElementById('menu-loved'), mFoto = document.getElementById('menu-foto'), mVideo = document.getElementById('menu-video');
    if (mLoved) {
        if (paket === 'Tingkat lanjut') { mLoved.style.opacity = '1'; mLoved.style.pointerEvents = 'auto'; } 
        else { mLoved.style.opacity = '0.4'; mLoved.style.pointerEvents = 'none'; if (folderAktif === 'loved') bukaTab('home'); }
    }
    if (mFoto && mVideo) {
        if (paket === 'Free') {
            mFoto.style.opacity = '0.4'; mFoto.style.pointerEvents = 'none'; mVideo.style.opacity = '0.4'; mVideo.style.pointerEvents = 'none';
            if (folderAktif === 'foto' || folderAktif === 'video') bukaTab('home');
        } else {
            mFoto.style.opacity = '1'; mFoto.style.pointerEvents = 'auto'; mVideo.style.opacity = '1'; mVideo.style.pointerEvents = 'auto';
        }
    }

    const bFree = document.getElementById('btn-paket-free'), bStand = document.getElementById('btn-paket-standar'), bLanjut = document.getElementById('btn-paket-lanjut');
    if(bFree) { bFree.className = 'btn-tier-outline'; bFree.innerText = 'Pilih Paket'; bFree.disabled = false; }
    if(bStand) { bStand.className = 'btn-tier-solid'; bStand.innerText = 'Beli paket ini'; bStand.disabled = false; }
    if(bLanjut) { bLanjut.className = 'btn-tier-outline'; bLanjut.innerText = 'Beli paket ini'; bLanjut.disabled = false; }
    
    if (paket === 'Free' && bFree) { bFree.innerText = 'Paket saat ini'; bFree.disabled = true; } 
    else if (paket === 'Standar' && bStand) { bStand.className = 'btn-tier-outline'; bStand.innerText = 'Paket saat ini (Aktif)'; bStand.disabled = true; } 
    else if (paket === 'Tingkat lanjut' && bLanjut) { bLanjut.className = 'btn-tier-outline'; bLanjut.innerText = 'Paket saat ini (Aktif)'; bLanjut.disabled = true; }
    
    const areaUpgrade = document.getElementById('area-upgrade-galeri');
    if (areaUpgrade) {
        if (paket === 'Tingkat lanjut' || mBintang === 'VIP') {
            areaUpgrade.innerHTML = `<button onclick="bukaModalUpgrade()" style="background: linear-gradient(135deg, #ffd700, #f59e0b); color: #000000 !important; padding: 10px 22px; border-radius: 30px; font-weight: 800; font-size: 0.95rem; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3); letter-spacing: 0.5px; transition: 0.2s;">👑 Premium Member</button>`;
        } else {
            areaUpgrade.innerHTML = `<button onclick="bukaModalUpgrade()" class="btn-upgrade-premium">Upgrade Paket</button>`;
        }
    }
}

function renderProfilSidebar() {
    const user = USERNAME_AKTIF;
    const teksStatus = localStorage.getItem("teksStatusManual_" + user) || "Admin";
    const tanggalAktif = localStorage.getItem("tanggalAktif_" + user) || "Aktif";

    const elNama = document.querySelector(".profile-name") || document.getElementById("nama-user-sidebar");
    const elStatus = document.querySelector(".profile-status") || document.getElementById("status-user");
    
    if (elNama) elNama.textContent = user.toUpperCase();
    if (elStatus) elStatus.textContent = `Status: ${teksStatus} | Aktif: ${tanggalAktif}`;
}


// ==============================================================================
// 10. PEMUATAN AWAL (INITIALIZATION)
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
    bukaTab(localStorage.getItem('tabTerakhir_' + USERNAME_AKTIF) || 'home');

    const savedPic = localStorage.getItem('savedProfilePic_' + USERNAME_AKTIF);
    if (savedPic) { const sAvatar = document.getElementById('sidebar-avatar'); if(sAvatar) sAvatar.style.backgroundImage = `url('${savedPic}')`; }

    if (localStorage.getItem('savedTheme_' + USERNAME_AKTIF) === 'dark') {
        document.body.classList.add('dark-mode');
        const themeIcon = document.getElementById('theme-icon'); if(themeIcon) themeIcon.innerText = 'light_mode';
    }
    
    renderProfilSidebar();
    terapkanPaketSaatIni();
    updateStorageDisplay();
    sinkronkanGaleri();
});

document.addEventListener('keydown', e => {
    if (document.getElementById('photo-viewer')?.classList.contains('show')) {
        if (e.key === 'ArrowRight') nextMedia(); else if (e.key === 'ArrowLeft') prevMedia(); else if (e.key === 'Escape') closePhoto(); 
    }
});

async function konfirmasiSelesai() {
    const btn = document.getElementById('btn-konfirmasi-qris'); 
    if(!btn) return;
    
    btn.disabled = true; 
    btn.style.pointerEvents = 'none'; 
    btn.innerHTML = `Memverifikasi ke Server...`; 
    btn.style.backgroundColor = '#f59e0b'; 

    let bintangBaru = 1;
    if (paketPending === 'Standar') bintangBaru = 4;
    else if (paketPending === 'Tingkat lanjut') bintangBaru = 5;

    try {
        // Lempar data paket ke Server (Database Google)
        const updateUrl = `${API_DRIVE_AKTIF}?action=updatePackage&username=${USERNAME_AKTIF}&paket=${encodeURIComponent(paketPending)}&bintang=${bintangBaru}&t=${Date.now()}`;
        await fetch(updateUrl, { method: 'GET', mode: 'no-cors' });

        btn.innerHTML = `Pembayaran Berhasil!`; 
        btn.style.backgroundColor = '#10b981'; 
        
        // PENGAMANAN LOKAL: Timpa nilai bintang agar sinkron dengan server
        localStorage.setItem('paketAktif_' + USERNAME_AKTIF, paketPending);
        localStorage.setItem('paketExpired_' + USERNAME_AKTIF, Date.now() + (30 * 24 * 60 * 60 * 1000));
        localStorage.setItem('userStarsSync_' + USERNAME_AKTIF, bintangBaru); // WAJIB ADA AGAR TIDAK TERTINGGAL

        setTimeout(async () => { 
            tutupModalQRIS(); 
            // Panggil ulang fungsi yang bertanya ke server agar UI diperbarui
            await terapkanPaketSaatIni(); 
            tampilkanNotifikasi(`Paket ${paketPending} aktif! Bintang ter-update global.`, "success"); 
        }, 1500);

    } catch (error) {
        tampilkanNotifikasi("Gagal menyinkronkan data ke server.", "error");
        btn.innerHTML = `Coba Lagi`; 
        btn.disabled = false;
        btn.style.pointerEvents = 'auto'; 
    }
}

async function simulasiPaketFree() {
    try {
        // Melaporkan reset data langsung ke server (Global Sync) dengan anti-cache
        await fetch(`${API_DRIVE_AKTIF}?action=updatePackage&username=${USERNAME_AKTIF}&paket=Free&bintang=1&t=${Date.now()}`, { method: 'GET', mode: 'no-cors' });
        
        // PENGAMANAN LOKAL: Reset nilai bintang dan paket
        localStorage.setItem('paketAktif_' + USERNAME_AKTIF, 'Free');
        localStorage.removeItem('paketExpired_' + USERNAME_AKTIF);
        localStorage.setItem('userStarsSync_' + USERNAME_AKTIF, 1); // WAJIB ADA
        
        tutupModalUpgrade();
        await terapkanPaketSaatIni(); 
        tampilkanNotifikasi("Berhasil mereset kembali ke paket Free secara Global!", "success");
    } catch(e) {
        tampilkanNotifikasi("Gagal melapor ke server.", "error");
    }
}
