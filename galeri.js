// ==============================================================================
// 1. SISTEM KEAMANAN & IDENTITAS USER (Kritis - Sinkron dengan sessionStorage)
// ==============================================================================
const USERNAME_AKTIF = sessionStorage.getItem("userAktif");
const API_DRIVE_AKTIF = sessionStorage.getItem("apiDriveAktif");
const SESSION_TOKEN = sessionStorage.getItem("sessionToken");
const SESSION_FP = sessionStorage.getItem("sessionFP");

// Helper parameter keamanan untuk setiap request ke server
function authParams() {
    return `username=${encodeURIComponent(USERNAME_AKTIF)}&token=${encodeURIComponent(SESSION_TOKEN)}&fp=${encodeURIComponent(SESSION_FP || '')}`;
}

let profilAktifFileName = null;
let tingkatDasarAktif = 'Default';

if (!USERNAME_AKTIF || !API_DRIVE_AKTIF || !SESSION_TOKEN || !SESSION_TOKEN.startsWith("TKN-")) {
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
    localStorage.removeItem('cacheUI_' + USERNAME_AKTIF);
    localStorage.removeItem('tabTerakhir_' + USERNAME_AKTIF);
    localStorage.removeItem('cacheStorage_' + USERNAME_AKTIF);
    localStorage.removeItem('savedProfilePic_' + USERNAME_AKTIF);
    sessionStorage.clear();
    try {
        indexedDB.deleteDatabase("GaleriLokalDB_" + USERNAME_AKTIF);
    } catch (e) {}

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
// 3. MANAJEMEN TEMA & TAB
// ==============================================================================
let folderAktif = 'home';

async function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    body.classList.toggle('dark-mode');

    let temaBaru = 'light';
    if (body.classList.contains('dark-mode')) {
        if (themeIcon) themeIcon.innerText = 'light_mode';
        temaBaru = 'dark';
    } else {
        if (themeIcon) themeIcon.innerText = 'dark_mode';
    }

    // Simpan tema ke cache sesi seketika agar langsung tersimpan saat refresh
    try {
        const cacheUIRaw = sessionStorage.getItem('cacheUI_' + USERNAME_AKTIF);
        if (cacheUIRaw) {
            const cacheUI = JSON.parse(cacheUIRaw);
            cacheUI.tema = temaBaru;
            sessionStorage.setItem('cacheUI_' + USERNAME_AKTIF, JSON.stringify(cacheUI));
        }
    } catch (e) {}

    try {
        const urlUtama = API_DRIVE_AKTIF.split('?')[0];
        await fetch(`${urlUtama}?action=updateTheme&${authParams()}&tema=${temaBaru}&t=${Date.now()}`, { method: 'GET', mode: 'no-cors' });
    } catch (e) {}
}

function bukaTab(jenis) {
    folderAktif = jenis;
    const tabIds = ['tab-home', 'tab-foto', 'tab-video', 'tab-loved', 'tab-settings', 'tab-trash'];
    const menuIds = ['menu-home', 'menu-foto', 'menu-video', 'menu-loved', 'menu-settings', 'menu-trash'];
    const fileInput = document.getElementById('fileInput');
    const textUpload = document.getElementById('text-upload');
    const btnUploadMain = document.getElementById('btn-upload-main');

    sessionStorage.setItem('tabTerakhir_' + USERNAME_AKTIF, jenis);

    tabIds.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
    menuIds.forEach(id => { const el = document.getElementById(id); if (el) { el.style.backgroundColor = 'transparent'; el.style.fontWeight = 'normal'; } });

    const tabAktif = document.getElementById(`tab-${jenis}`);
    const menuAktif = document.getElementById(`menu-${jenis}`);

    if (tabAktif) tabAktif.style.display = 'block';
    if (menuAktif) { menuAktif.style.backgroundColor = '#f0f2f5'; menuAktif.style.fontWeight = 'bold'; }

    if (jenis === 'loved' || jenis === 'settings' || jenis === 'trash') {
        if (btnUploadMain) btnUploadMain.style.display = 'none';
    } else {
        if (btnUploadMain) btnUploadMain.style.display = 'flex';
    }

    if (jenis === 'home' || jenis === 'loved') {
        if (fileInput) fileInput.accept = ".jpg, .jpeg, .png, .mp4, .mov";
        if (textUpload) textUpload.innerText = "Upload File";
    } else if (jenis === 'foto') {
        if (fileInput) fileInput.accept = ".jpg, .jpeg, .png";
        if (textUpload) textUpload.innerText = "Upload Foto";
    } else if (jenis === 'video') {
        if (fileInput) fileInput.accept = ".mp4, .mov";
        if (textUpload) textUpload.innerText = "Upload Video";
    }
    periksaIsiKosong(tabAktif);
}

function periksaIsiKosong(folderElemen) {
    if (!folderElemen) return;
    const grid = folderElemen.querySelector('.photo-grid');
    const pesanKosong = folderElemen.querySelector('.pesan-kosong');
    if (!grid) return;

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

            const urlUpload = `${API_DRIVE_AKTIF}?action=upload&${authParams()}`;
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

        if (grid) {
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

            if (pesanKosong) pesanKosong.style.display = 'none';
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

    if (!isVideo) { card.style.backgroundImage = `url('${dataUrl}')`; }
    else { card.innerHTML = `<video src="${dataUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;"></video>`; }

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
// 5. SISTEM DATABASE LOKAL (IndexedDB untuk File Media Besar)
// ==============================================================================
let db;
const request = indexedDB.open("GaleriLokalDB_" + USERNAME_AKTIF, 1);
request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("media")) db.createObjectStore("media", { keyPath: "name" });
};
request.onsuccess = (e) => { db = e.target.result; muatMediaDariDatabase(); };

function simpanKeDatabase(mediaObject) { if (db) db.transaction(["media"], "readwrite").objectStore("media").put(mediaObject); }
function hapusDariDatabase(fileName) { if (db) db.transaction(["media"], "readwrite").objectStore("media").delete(fileName); }
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
        ['home', 'foto', 'video', 'loved', 'trash'].forEach(t => { const g = document.querySelector(`#tab-${t} .photo-grid`); if (g) g.innerHTML = ''; });
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
    if (currentMediaList.length === 0) return closePhoto();
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
        if (nBar) nBar.style.display = 'none'; tBar.style.display = 'flex';
    } else {
        if (nBar) nBar.style.display = 'flex'; tBar.style.display = 'none';
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
    const media = currentMediaList[currentIndex], loveBtn = document.getElementById('btn-love');
    const fileName = media.cardRef.dataset.filename, isNowLoved = !media.cardRef.classList.contains('loved');

    loveBtn.classList.toggle('active-love', isNowLoved);
    document.querySelectorAll(`.photo-card[data-filename="${fileName}"]`).forEach(c => c.classList.toggle('loved', isNowLoved));

    const lovedGrid = document.querySelector('#tab-loved .photo-grid');
    if (isNowLoved) {
        if (lovedGrid && !lovedGrid.querySelector(`.photo-card[data-filename="${fileName}"]`)) {
            const kloning = media.cardRef.cloneNode(true); kloning.onclick = function() { openPhoto(this); }; lovedGrid.prepend(kloning);
        }
    } else {
        document.querySelectorAll(`#tab-loved .photo-card[data-filename="${fileName}"]`).forEach(c => c.remove());
        if (folderAktif === 'loved') closePhoto();
    }
    updateLoveDiDatabase(fileName, isNowLoved); periksaIsiKosong(document.getElementById('tab-loved'));
}

let isConfirmingDelete = false, deleteTimeout;

async function deleteMedia() {
    const tooltip = document.getElementById('delete-tooltip');
    if (!isConfirmingDelete) {
        isConfirmingDelete = true; if (tooltip) { tooltip.classList.add('show'); tooltip.innerText = 'Apakah di hapus?'; }
        clearTimeout(deleteTimeout); deleteTimeout = setTimeout(() => { isConfirmingDelete = false; if (tooltip) tooltip.classList.remove('show'); }, 3000);
        return;
    }

    isConfirmingDelete = false; if (tooltip) tooltip.innerText = 'Memindahkan...';
    const media = currentMediaList[currentIndex], fileName = media.cardRef.dataset.filename, targetSrc = media.cardRef.dataset.src;
    const deleteBtn = document.querySelector('.action-btn[title="Hapus"]');
    const originalIcon = deleteBtn.innerHTML; deleteBtn.innerHTML = 'hourglass_empty'; deleteBtn.style.pointerEvents = 'none';

    try {
        if (fileName) {
            fetch(`${API_DRIVE_AKTIF}?action=deleteFile&${authParams()}&fileName=${encodeURIComponent(fileName)}`, { method: 'GET', mode: 'no-cors' });
            tandaiSampahDiDatabase(fileName, targetSrc);
        }
        document.querySelectorAll(`.photo-card[data-src="${targetSrc}"]`).forEach(c => c.remove());
        tampilkanKeSampahLokal({ name: fileName, size: media.cardRef.dataset.size || 0 }, targetSrc);
        closePhoto(); ['home', 'foto', 'video', 'loved', 'trash'].forEach(t => periksaIsiKosong(document.getElementById(`tab-${t}`)));
        setTimeout(() => updateStorageDisplay(), 1500); tampilkanNotifikasi("File dipindahkan ke Sampah.", "success");
    } catch (e) { tampilkanNotifikasi("Gagal memindahkan file.", "error"); }
    finally { deleteBtn.innerHTML = originalIcon; deleteBtn.style.pointerEvents = 'auto'; if (tooltip) tooltip.classList.remove('show'); }
}

async function restoreMedia() {
    const media = currentMediaList[currentIndex], fileName = media.cardRef.dataset.filename, targetSrc = media.cardRef.dataset.src;
    const restoreBtn = document.querySelector('#trash-action-bar .action-btn');
    const originalIcon = restoreBtn.innerHTML; restoreBtn.innerHTML = 'hourglass_empty'; restoreBtn.style.pointerEvents = 'none';

    try {
        if (fileName) {
            fetch(`${API_DRIVE_AKTIF}?action=restoreFile&${authParams()}&fileName=${encodeURIComponent(fileName)}`, { method: 'GET', mode: 'no-cors' });
            if (db) {
                const req = db.transaction(["media"], "readwrite").objectStore("media").get(fileName);
                req.onsuccess = () => { if (req.result) { req.result.isTrashed = false; db.transaction(["media"], "readwrite").objectStore("media").put(req.result); } };
            }
        }
        media.cardRef.remove(); closePhoto(); tampilkanKeGrid({ name: fileName, size: media.cardRef.dataset.size || 0 }, targetSrc, true, false);
        ['home', 'foto', 'video', 'trash'].forEach(t => periksaIsiKosong(document.getElementById(`tab-${t}`)));
        setTimeout(() => updateStorageDisplay(), 1500); tampilkanNotifikasi("File berhasil dipulihkan!", "success");
    } catch (e) { tampilkanNotifikasi("Gagal memulihkan file.", "error"); }
    finally { restoreBtn.innerHTML = originalIcon; restoreBtn.style.pointerEvents = 'auto'; }
}

let isConfirmingEmptyTrash = false, trashTimeout;

function kosongkanSampah() {
    const confirmText = document.getElementById('trash-confirm-text'), btnText = document.getElementById('trash-btn-text'), btnAction = document.getElementById('btn-kosongkan-sampah');
    if (!confirmText || !btnText || !btnAction) return;

    if (!isConfirmingEmptyTrash) {
        isConfirmingEmptyTrash = true; confirmText.style.opacity = '1'; confirmText.style.transform = 'translateX(0)';
        btnText.innerText = 'Klik untuk menghapus'; btnAction.style.backgroundColor = '#dc2626';
        clearTimeout(trashTimeout); trashTimeout = setTimeout(resetTombolSampah, 4000);
    } else { clearTimeout(trashTimeout); eksekusiKosongkanSampah(btnAction, btnText, confirmText); }
}

function resetTombolSampah() {
    isConfirmingEmptyTrash = false;
    const confirmText = document.getElementById('trash-confirm-text'), btnText = document.getElementById('trash-btn-text'), btnAction = document.getElementById('btn-kosongkan-sampah');
    if (confirmText && btnText && btnAction) {
        confirmText.style.opacity = '0'; confirmText.style.transform = 'translateX(20px)';
        btnText.innerText = 'Kosongkan Sampah'; btnAction.style.backgroundColor = '#ef4444';
    }
}

async function eksekusiKosongkanSampah(btnAction, btnText, confirmText) {
    btnAction.style.pointerEvents = 'none'; btnAction.style.opacity = '0.7'; btnText.innerText = 'Menghapus...'; confirmText.style.opacity = '0';
    try {
        await fetch(`${API_DRIVE_AKTIF.split('?')[0]}?action=emptyTrash&${authParams()}`, { method: 'GET', mode: 'no-cors' });
        document.querySelector('#tab-trash .photo-grid').innerHTML = ''; periksaIsiKosong(document.getElementById('tab-trash'));
        if (db) {
            const req = db.transaction(["media"], "readwrite").objectStore("media").getAll();
            req.onsuccess = () => { req.result.forEach(item => { if (item.isTrashed) db.transaction(["media"], "readwrite").objectStore("media").delete(item.name); }); };
        }
        setTimeout(() => updateStorageDisplay(), 2000); tampilkanNotifikasi("Sampah dikosongkan permanen!", "success");
    } catch (e) { tampilkanNotifikasi("Gagal membersihkan sampah.", "error"); }
    finally { btnAction.style.pointerEvents = 'auto'; btnAction.style.opacity = '1'; resetTombolSampah(); }
}

// ==============================================================================
// 7. SISTEM PROFIL (Sync Langsung ke Server)
// ==============================================================================
// ==============================================================================
// 7. SISTEM PROFIL (Sync Langsung ke Server & Anti-Kedip saat Refresh)
// ==============================================================================
function bukaProfil() {
    const avatar = document.getElementById('sidebar-avatar');
    const bgRaw = avatar ? avatar.style.backgroundImage : '';
    let urlFoto = (bgRaw && bgRaw !== 'none') ? bgRaw.replace(/^url\(["']?/, '').replace(/["']?\)$/, '') : '';

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
    const pBar = document.getElementById('custom-profile-bar'); if (pBar) pBar.style.opacity = '0.5';

    try {
        const base64Data = await new Promise(res => { const reader = new FileReader(); reader.onload = e => res(e.target.result); reader.readAsDataURL(file); });
        document.getElementById('sidebar-avatar').style.backgroundImage = `url('${base64Data}')`;
        document.getElementById('full-image').src = base64Data;
        document.getElementById('full-image').style.backgroundColor = 'transparent';

        profilAktifFileName = 'PROFIL_' + file.name;
        try {
            sessionStorage.setItem('savedProfilePic_' + USERNAME_AKTIF, base64Data);
            sessionStorage.setItem('savedProfileName_' + USERNAME_AKTIF, profilAktifFileName);
            sessionStorage.setItem('savedProfileTime_' + USERNAME_AKTIF, Date.now().toString());
        } catch (e) {}

        const formData = new FormData();
        formData.append('fileName', profilAktifFileName);
        formData.append('mimeType', file.type);
        formData.append('fileData', base64Data.split(',')[1]);

        const urlUpload = `${API_DRIVE_AKTIF}?action=upload&${authParams()}`;
        await fetch(urlUpload, { method: 'POST', mode: 'no-cors', body: formData });

        if (typeof updateStorageDisplay === 'function') updateStorageDisplay();
        tampilkanNotifikasi("Foto profil berhasil diunggah!", "success");

        document.getElementById('btn-upload-profil').style.display = 'none';
        document.getElementById('profil-divider').style.display = 'none';
    } catch (e) { tampilkanNotifikasi("Gagal mengunggah profil.", "error"); }
    finally { if (pBar) pBar.style.opacity = '1'; event.target.value = ''; }
}

let isConfirmingDeleteProfil = false, deleteProfilTimeout;

async function hapusProfil() {
    const tooltip = document.getElementById('delete-profil-tooltip');
    if (!isConfirmingDeleteProfil) {
        isConfirmingDeleteProfil = true; if (tooltip) { tooltip.classList.add('show'); tooltip.innerText = 'Apakah di hapus?'; }
        clearTimeout(deleteProfilTimeout); deleteProfilTimeout = setTimeout(() => { isConfirmingDeleteProfil = false; if (tooltip) tooltip.classList.remove('show'); }, 3000);
        return;
    }

    isConfirmingDeleteProfil = false; if (tooltip) tooltip.innerText = 'Menghapus...';
    const pBar = document.getElementById('custom-profile-bar'); if (pBar) pBar.style.opacity = '0.5';

    const fileName = profilAktifFileName || sessionStorage.getItem('savedProfileName_' + USERNAME_AKTIF);
    document.getElementById('sidebar-avatar').style.backgroundImage = 'none';
    profilAktifFileName = null;
    sessionStorage.removeItem('savedProfilePic_' + USERNAME_AKTIF);
    sessionStorage.removeItem('savedProfileName_' + USERNAME_AKTIF);
    sessionStorage.removeItem('savedProfileTime_' + USERNAME_AKTIF);
    closePhoto();

    if (fileName) {
        try {
            fetch(`${API_DRIVE_AKTIF}?action=deleteFile&${authParams()}&fileName=${encodeURIComponent(fileName)}`, { method: 'GET', mode: 'no-cors' });
            setTimeout(() => updateStorageDisplay(), 1500); tampilkanNotifikasi("Foto profil dihapus.", "success");
        } catch (e) { tampilkanNotifikasi("Terjadi kesalahan sistem.", "error"); }
        finally { if (pBar) pBar.style.opacity = '1'; if (tooltip) tooltip.classList.remove('show'); }
    }
}

// ==============================================================================
// 8. SINKRONISASI DRIVE (Storage, Auto-Sync)
// ==============================================================================
async function updateStorageDisplay() {
    const textElement = document.getElementById('storage-text'), percentElement = document.getElementById('storage-percent'), fillElement = document.getElementById('storage-fill');
    try {
        const response = await fetch(`${API_DRIVE_AKTIF}?action=getStorage&${authParams()}&t=${Date.now()}`, { method: 'GET', redirect: 'follow' });
        const data = await response.json();
        if (data.status === 'error' && data.message && data.message.includes('Unauthorized')) {
            fungsiLogout();
            return;
        }
        let percentage = Math.min((data.used / data.limit) * 100, 100);
        if (fillElement) fillElement.style.width = percentage + '%';
        if (textElement) textElement.innerText = `${(data.used / (1024 * 1024)).toFixed(1)} MB of ${(data.limit / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        if (percentElement) percentElement.innerText = `${percentage % 1 === 0 ? percentage : percentage.toFixed(1)}%`;

        sessionStorage.setItem('cacheStorage_' + USERNAME_AKTIF, JSON.stringify({
            text: textElement ? textElement.innerText : '',
            percent: percentElement ? percentElement.innerText : '',
            width: fillElement ? fillElement.style.width : '0%'
        }));
    } catch (e) {}
}

async function sinkronkanGaleri() {
    const textStorage = document.getElementById('storage-text');
    if (textStorage && !textStorage.innerText.trim()) textStorage.innerText = "Loading...";

    try {
        const response = await fetch(`${API_DRIVE_AKTIF}?action=getFiles&${authParams()}&t=${Date.now()}`, { method: 'GET', redirect: 'follow' });
        const driveFiles = await response.json();
        if (driveFiles.status === 'error' && driveFiles.message && driveFiles.message.includes('Unauthorized')) {
            fungsiLogout();
            return;
        }
        if (driveFiles.error) throw new Error(driveFiles.error);

        const profilDiDrive = driveFiles.find(f => f.name.startsWith('PROFIL_'));
        const sAvatar = document.getElementById('sidebar-avatar');

        if (profilDiDrive) {
            profilAktifFileName = profilDiDrive.name;
            const savedPic = sessionStorage.getItem('savedProfilePic_' + USERNAME_AKTIF);
            const savedName = sessionStorage.getItem('savedProfileName_' + USERNAME_AKTIF);

            sessionStorage.setItem('savedProfileName_' + USERNAME_AKTIF, profilDiDrive.name);

            // Jika belum ada cache atau foto di Drive berbeda/diperbarui, simpan & perbarui tampilan
            if (!savedPic || savedName !== profilDiDrive.name || (!savedPic.startsWith('data:image') && savedPic !== profilDiDrive.url)) {
                sessionStorage.setItem('savedProfilePic_' + USERNAME_AKTIF, profilDiDrive.url);
                if (sAvatar) sAvatar.style.backgroundImage = `url('${profilDiDrive.url}')`;
            }
        } else {
            const waktuUploadTerakhir = parseInt(sessionStorage.getItem('savedProfileTime_' + USERNAME_AKTIF) || '0', 10);
            // Jangan hapus pratinjau jika baru saja diunggah < 15 detik lalu (menunggu indeks Drive)
            if (Date.now() - waktuUploadTerakhir > 15000) {
                profilAktifFileName = null;
                sessionStorage.removeItem('savedProfilePic_' + USERNAME_AKTIF);
                sessionStorage.removeItem('savedProfileName_' + USERNAME_AKTIF);
                if (sAvatar) sAvatar.style.backgroundImage = 'none';
            }
        }

        if (db) {
            const req = db.transaction(["media"], "readwrite").objectStore("media").getAll();
            req.onsuccess = () => {
                let adaPerubahan = false;
                req.result.forEach(dbFile => {
                    if ((!driveFiles.some(d => d.name === dbFile.name) || dbFile.name.startsWith('PROFIL_')) && !dbFile.isTrashed) {
                        db.transaction(["media"], "readwrite").objectStore("media").delete(dbFile.name);
                        adaPerubahan = true;
                    }
                });
                driveFiles.forEach(dFile => {
                    if (dFile.name.startsWith('PROFIL_')) return;
                    const existing = req.result.find(dbFile => dbFile.name === dFile.name);
                    if (!existing) {
                        db.transaction(["media"], "readwrite").objectStore("media").put({ name: dFile.name, url: dFile.url, isTrashed: false, date: Date.now() });
                        adaPerubahan = true;
                    } else if (!existing.fileObj && existing.url !== dFile.url) {
                        existing.url = dFile.url;
                        db.transaction(["media"], "readwrite").objectStore("media").put(existing);
                        adaPerubahan = true;
                    }
                });
                if (adaPerubahan) muatMediaDariDatabase();
            };
        }
        updateStorageDisplay();
    } catch (e) { if (textStorage && textStorage.innerText === "Loading...") textStorage.innerText = "Mode Offline"; }
}

// ==============================================================================
// 9. SISTEM PAKET (Sinkronisasi Murni dari Server Database Google Sheet)
// ==============================================================================
function bukaModalUpgrade() { document.getElementById('upgradeModal')?.classList.add('show'); }
function tutupModalUpgrade() { document.getElementById('upgradeModal')?.classList.remove('show'); }

let paketPending = ''; let timerQrisInterval; let intervalCekBayar;

function tutupModalQRIS() {
    document.getElementById('qrisModal')?.classList.remove('show');
    clearInterval(timerQrisInterval); clearInterval(intervalCekBayar);
}

async function bayarPaketQRIS(namaPaket, harga) {
    paketPending = namaPaket; tutupModalUpgrade();

    const hargaAngka = harga.toString().replace(/[^0-9]/g, '');
    const orderIdUnik = "INV-" + USERNAME_AKTIF + "-" + Date.now();
    const nominalFormatted = new Intl.NumberFormat('id-ID').format(hargaAngka);

    document.getElementById('qris-paket-nama').innerText = namaPaket;
    document.getElementById('qris-paket-harga').innerText = "Rp " + nominalFormatted;

    const timerText = document.getElementById('qris-timer-text'), qrImage = document.querySelector('#qrisModal img');
    if (timerText) { timerText.innerText = `Menghasilkan kode QRIS...`; timerText.style.color = '#f59e0b'; }
    if (qrImage) { qrImage.style.display = "none"; qrImage.src = ""; }

    document.getElementById('qrisModal')?.classList.add('show');

    try {
        const response = await fetch(`${API_DRIVE_AKTIF}?action=createMidtrans&${authParams()}&orderId=${orderIdUnik}&paket=${encodeURIComponent(namaPaket)}`, { method: 'GET', redirect: 'follow' });
        const data = await response.json();

        if (data.status === "success" && data.qr_url) {
            if (qrImage) { qrImage.src = data.qr_url; qrImage.style.display = "block"; qrImage.style.opacity = "1"; }
            if (timerText) timerText.style.color = '#94a3b8';
            mulaiHitungMundurQRIS(60); pantauPembayaranOtomatis(orderIdUnik);
        } else {
            if (timerText) { timerText.innerText = `Error Midtrans:\n ${data.message}`; timerText.style.color = '#ef4444'; timerText.style.fontSize = '0.8rem'; }
            if (qrImage) qrImage.style.display = "none";
        }
    } catch (error) {
        if (timerText) { timerText.innerText = `Gagal terhubung ke API Pembayaran.`; timerText.style.color = '#ef4444'; }
        if (qrImage) qrImage.style.display = "none";
    }
}

function mulaiHitungMundurQRIS(durasiTotalDetik) {
    let sisaWaktu = durasiTotalDetik;
    const timerText = document.getElementById('qris-timer-text');
    clearInterval(timerQrisInterval);

    timerQrisInterval = setInterval(() => {
        sisaWaktu--;
        let menit = Math.floor(sisaWaktu / 60), detik = sisaWaktu % 60;
        if (timerText) timerText.innerText = `Menunggu pembayaran... (${menit.toString().padStart(2, '0')}:${detik.toString().padStart(2, '0')})`;

        if (sisaWaktu <= 0) {
            clearInterval(timerQrisInterval); clearInterval(intervalCekBayar);
            if (timerText) { timerText.innerText = `Waktu habis. Pembayaran dibatalkan.`; timerText.style.color = '#ef4444'; }
            setTimeout(() => { tutupModalQRIS(); tampilkanNotifikasi("Waktu habis. Paket batal diaktifkan.", "error"); }, 2000);
        }
    }, 1000);
}

function pantauPembayaranOtomatis(orderId) {
    clearInterval(intervalCekBayar);
    intervalCekBayar = setInterval(async () => {
        try {
            const res = await fetch(`${API_DRIVE_AKTIF}?action=cekStatus&${authParams()}&orderId=${orderId}`, { method: 'GET', redirect: 'follow' });
            const data = await res.json();
            if (data.status === "settlement" || data.status === "capture") {
                clearInterval(intervalCekBayar); clearInterval(timerQrisInterval); prosesPembayaranSukses();
            }
        } catch (error) {}
    }, 5000);
}

async function konfirmasiSelesai() {
    const btn = document.getElementById('btn-konfirmasi-qris'); if (!btn) return;
    btn.disabled = true; btn.style.pointerEvents = 'none'; btn.innerHTML = `Memverifikasi ke Server...`; btn.style.backgroundColor = '#f59e0b';

    let bintangBaru = paketPending === 'Tingkat lanjut' ? 5 : (paketPending === 'Standar' ? 4 : 1);

    try {
        const updateUrl = `${API_DRIVE_AKTIF}?action=updatePackage&${authParams()}&paket=${encodeURIComponent(paketPending)}&bintang=${bintangBaru}&t=${Date.now()}`;
        await fetch(updateUrl, { method: 'GET', mode: 'no-cors' });

        btn.innerHTML = `Pembayaran Berhasil!`; btn.style.backgroundColor = '#10b981';

        setTimeout(async () => {
            tutupModalQRIS();
            await terapkanPaketSaatIni();
            tampilkanNotifikasi(`Paket ${paketPending} aktif! Bintang ter-update global.`, "success");
        }, 1500);

    } catch (error) {
        tampilkanNotifikasi("Gagal menyinkronkan data ke server.", "error");
        btn.innerHTML = `Coba Lagi`; btn.disabled = false; btn.style.pointerEvents = 'auto';
    }
}

async function prosesPembayaranSukses() {
    const timerText = document.getElementById('qris-timer-text');
    if (timerText) {
        timerText.innerHTML = `<span class="material-symbols-outlined" style="vertical-align: middle;">check_circle</span> Pembayaran Berhasil!`;
        timerText.style.color = '#10b981';
    }

    let bintangBaru = paketPending === 'Tingkat lanjut' ? 5 : (paketPending === 'Standar' ? 4 : 1);

    try {
        const updateUrl = `${API_DRIVE_AKTIF}?action=updatePackage&${authParams()}&paket=${encodeURIComponent(paketPending)}&bintang=${bintangBaru}&t=${Date.now()}`;
        await fetch(updateUrl, { method: 'GET', mode: 'no-cors' });
    } catch (e) {}

    setTimeout(async () => {
        tutupModalQRIS();
        await terapkanPaketSaatIni();
        tampilkanNotifikasi(`Paket ${paketPending} aktif selama 30 Hari!`, "success");
    }, 1500);
}

async function simulasiPaketFree() {
    try {
        const bintangDasar = hitungBintangDasar(tingkatDasarAktif);

        await fetch(`${API_DRIVE_AKTIF}?action=updatePackage&${authParams()}&paket=Free&bintang=${bintangDasar}&t=${Date.now()}`, { method: 'GET', mode: 'no-cors' });

        tutupModalUpgrade();
        await terapkanPaketSaatIni();
        tampilkanNotifikasi("Berhasil mereset kembali ke paket Free secara Global!", "success");
    } catch (e) {
        tampilkanNotifikasi("Gagal melapor ke server.", "error");
    }
}

function hitungBintangDasar(tingkatDasar) {
    const dasar = (tingkatDasar || '').trim().toLowerCase();
    if (dasar === 'regular') return 3;
    if (dasar === 'normal') return 2;
    return 1;
}

// FUNGSI 1: Render UI
function renderUIPaket(paket, bintang, tanggalAktif, tema, teksStatus, tingkatDasar) {
    const sBintang = document.getElementById('bintang-status-kiri');
    const tStatus = document.getElementById('teks-status-user');
    const tPaket = document.getElementById('teks-paket-user');
    const tAktif = document.getElementById('teks-aktif-sejak');
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');

    // 1. Terapkan Tema
    if (tema === 'dark') {
        body.classList.add('dark-mode');
        if (themeIcon) themeIcon.innerText = 'light_mode';
    } else {
        body.classList.remove('dark-mode');
        if (themeIcon) themeIcon.innerText = 'dark_mode';
    }

    // 2. Terapkan Tanggal
    if (tAktif) tAktif.innerText = `Aktif Sejak: ${tanggalAktif}`;

    // 3. Terapkan STATUS (Murni Manual dari Spreadsheet Kolom K)
    if (tStatus) {
        tStatus.innerText = `Status: ${teksStatus}`;
    }

    // 4. Terapkan PAKET (Otomatis berubah jika beli paket, atau gunakan Tingkat Dasar)
    if (tPaket) {
        if (paket === 'Standar' || paket === 'Tingkat lanjut') {
            tPaket.innerText = `Paket: ${paket}`;
        } else {
            tPaket.innerText = `Paket: ${tingkatDasar}`;
        }
    }

    // 5. Terapkan BINTANG
    const warnaOranye = 'color: #f59e0b;';
    if (paket === 'Standar') {
        if (sBintang) sBintang.innerHTML = `<span style="${warnaOranye}">★★★★☆</span>`;
    } else if (paket === 'Tingkat lanjut') {
        if (sBintang) sBintang.innerHTML = `<span style="${warnaOranye}">★★★★★</span>`;
    } else {
        let starHTML = '★☆☆☆☆';
        if (bintang == 3) starHTML = '★★★☆☆';
        else if (bintang == 2) starHTML = '★★☆☆☆';

        if (sBintang) sBintang.innerHTML = `<span style="${warnaOranye}">${starHTML}</span>`;
    }

    // Logika Menu Redup
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

    // Logika Tombol Upgrade
    const bFree = document.getElementById('btn-paket-free'), bStand = document.getElementById('btn-paket-standar'), bLanjut = document.getElementById('btn-paket-lanjut');
    if (bFree) { bFree.className = 'btn-tier-outline'; bFree.innerText = 'Pilih Paket'; bFree.disabled = false; }
    if (bStand) { bStand.className = 'btn-tier-solid'; bStand.innerText = 'Beli paket ini'; bStand.disabled = false; }
    if (bLanjut) { bLanjut.className = 'btn-tier-outline'; bLanjut.innerText = 'Beli paket ini'; bLanjut.disabled = false; }

    if (paket === 'Free' && bFree) { bFree.innerText = 'Paket saat ini'; bFree.disabled = true; }
    else if (paket === 'Standar' && bStand) { bStand.className = 'btn-tier-outline'; bStand.innerText = 'Paket saat ini (Aktif)'; bStand.disabled = true; }
    else if (paket === 'Tingkat lanjut' && bLanjut) { bLanjut.className = 'btn-tier-outline'; bLanjut.innerText = 'Paket saat ini (Aktif)'; bLanjut.disabled = true; }

    const areaUpgrade = document.getElementById('area-upgrade-galeri');
    if (areaUpgrade) {
        if (paket === 'Tingkat lanjut') {
            areaUpgrade.innerHTML = `<button onclick="bukaModalUpgrade()" style="background: linear-gradient(135deg, #ffd700, #f59e0b); color: #000000 !important; padding: 10px 22px; border-radius: 30px; font-weight: 800; font-size: 0.95rem; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3); letter-spacing: 0.5px; transition: 0.2s;">👑 Premium Member</button>`;
        } else {
            areaUpgrade.innerHTML = `<button onclick="bukaModalUpgrade()" class="btn-upgrade-premium">Upgrade Paket</button>`;
        }
    }
}

// FUNGSI 2: Bertanya ke server dan memanggil fungsi render secara diam-diam
async function terapkanPaketSaatIni() {
    try {
        const urlUtama = API_DRIVE_AKTIF.split('?')[0];
        const response = await fetch(`${urlUtama}?action=getUsersStatus&${authParams()}&t=${Date.now()}`, { method: 'GET', redirect: 'follow' });
        const result = await response.json();

        if (result.status === 'error' && result.message && result.message.includes('Unauthorized')) {
            fungsiLogout();
            return;
        }

        if (result.status === 'success' && result.data) {
            const dataUser = result.data[USERNAME_AKTIF] || Object.values(result.data)[0];
            if (dataUser) {
                const dataUI = {
                    paket: dataUser.paket || 'Free',
                    bintang: parseInt(dataUser.bintang) || 1,
                    tanggal: dataUser.tanggal || '-',
                    tema: dataUser.tema || 'dark',
                    teksStatus: dataUser.teksStatus || 'User',
                    tingkatDasar: dataUser.tingkatDasar || 'Default'
                };

                tingkatDasarAktif = dataUI.tingkatDasar;
                sessionStorage.setItem('cacheUI_' + USERNAME_AKTIF, JSON.stringify(dataUI));

                renderUIPaket(
                    dataUI.paket,
                    dataUI.bintang,
                    dataUI.tanggal,
                    dataUI.tema,
                    dataUI.teksStatus,
                    dataUI.tingkatDasar
                );
            }
        }
    } catch (e) {
        console.error("Sinkronisasi server gagal:", e);
    }
}

// ==============================================================================
// 10. PEMUATAN AWAL (INITIALIZATION)
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. KEMBALIKAN TAB TERAKHIR (Tidak reset ke Menu)
    const tabTerakhir = sessionStorage.getItem('tabTerakhir_' + USERNAME_AKTIF) || 'home';
    bukaTab(tabTerakhir);

    // 2. TAMPILKAN NAMA
    const elNama = document.querySelector(".profile-name") || document.getElementById("nama-user-sidebar");
    if (elNama) elNama.textContent = USERNAME_AKTIF.toUpperCase();

    // 3. RENDER FOTO PROFIL DARI CACHE SESI (0 Detik, Tanpa Kedip Putih)
    const savedPic = sessionStorage.getItem('savedProfilePic_' + USERNAME_AKTIF);
    const savedProfileName = sessionStorage.getItem('savedProfileName_' + USERNAME_AKTIF);
    if (savedProfileName) profilAktifFileName = savedProfileName;

    const sAvatar = document.getElementById('sidebar-avatar');
    if (sAvatar) {
        if (savedPic) {
            sAvatar.style.backgroundImage = `url('${savedPic}')`;
        } else {
            sAvatar.style.backgroundImage = 'none';
        }
        sAvatar.innerHTML = '';
    }

    // 4. MUAT PROFIL, PAKET, BINTANG & TEMA DARI CACHE SESI (0 Detik, Tanpa Kedip)
    const cacheUIRaw = sessionStorage.getItem('cacheUI_' + USERNAME_AKTIF);
    if (cacheUIRaw) {
        const cacheUI = JSON.parse(cacheUIRaw);
        tingkatDasarAktif = cacheUI.tingkatDasar || 'Default';
        renderUIPaket(
            cacheUI.paket,
            cacheUI.bintang,
            cacheUI.tanggal,
            cacheUI.tema,
            cacheUI.teksStatus,
            cacheUI.tingkatDasar
        );
    }

    // 5. MUAT TEKS & BAR STORAGE TERAKHIR
    const elStorageText = document.getElementById('storage-text');
    const elStoragePercent = document.getElementById('storage-percent');
    const elStorageFill = document.getElementById('storage-fill');
    const cacheStorage = sessionStorage.getItem('cacheStorage_' + USERNAME_AKTIF);
    if (cacheStorage) {
        const st = JSON.parse(cacheStorage);
        if (elStorageText && st.text) elStorageText.innerText = st.text;
        if (elStoragePercent && st.percent) elStoragePercent.innerText = st.percent;
        if (elStorageFill && st.width) elStorageFill.style.width = st.width;
    }

    // 6. SINKRONISASI DATA TERBARU DARI GOOGLE SHEETS DI LATAR BELAKANG
    terapkanPaketSaatIni();
    updateStorageDisplay();
    sinkronkanGaleri();
});

document.addEventListener('keydown', e => {
    if (document.getElementById('photo-viewer')?.classList.contains('show')) {
        if (e.key === 'ArrowRight') nextMedia(); else if (e.key === 'ArrowLeft') prevMedia(); else if (e.key === 'Escape') closePhoto();
    }
});

// ==============================================================================
// 11. NAVIGASI DRAWER KHUSUS LAYAR HP (Tidak mengganggu tampilan Desktop)
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('aside') || document.querySelector('.sidebar');
    if (!sidebar) return;

    const btnMobileMenu = document.createElement('button');
    btnMobileMenu.id = 'btn-mobile-menu';
    btnMobileMenu.innerHTML = `<span class="material-symbols-outlined">menu</span>`;
    btnMobileMenu.style.cssText = `
        display: none; position: fixed; top: 14px; left: 14px; z-index: 9997;
        width: 40px; height: 40px; border-radius: 10px; border: 1px solid rgba(148,163,184,0.25);
        background: rgba(30, 41, 59, 0.85); color: #fff; backdrop-filter: blur(8px);
        align-items: center; justify-content: center; cursor: pointer;
    `;

    const backdrop = document.createElement('div');
    backdrop.id = 'mobile-sidebar-backdrop';

    document.body.appendChild(btnMobileMenu);
    document.body.appendChild(backdrop);

    const toggleMobileSidebar = (buka) => {
        sidebar.classList.toggle('mobile-open', buka);
        backdrop.classList.toggle('show', buka);
    };

    btnMobileMenu.onclick = () => toggleMobileSidebar(true);
    backdrop.onclick = () => toggleMobileSidebar(false);

    sidebar.querySelectorAll('[id^="menu-"]').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) toggleMobileSidebar(false);
        });
    });

    const cekUkuranLayar = () => {
        btnMobileMenu.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
        if (window.innerWidth > 768) toggleMobileSidebar(false);
    };
    cekUkuranLayar();
    window.addEventListener('resize', cekUkuranLayar);
});

// ==============================================================================
// 12. KEAMANAN IDLE AUTO-LOGOUT (15 MENIT TANPA AKTIVITAS)
// ==============================================================================
(function() {
    const BATAS_DIAM_MS = 15 * 60 * 1000; // 15 menit
    let timerDiam;

    function resetTimerDiam() {
        clearTimeout(timerDiam);
        timerDiam = setTimeout(() => {
            tampilkanNotifikasi("Sesi berakhir otomatis demi keamanan.", "error");
            setTimeout(fungsiLogout, 1500);
        }, BATAS_DIAM_MS);
    }

    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
        document.addEventListener(evt, resetTimerDiam, { passive: true });
    });

    resetTimerDiam();
})();
