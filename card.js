// =========================================================================
// 1. DATABASE KARTU (Sinkron Otomatis dari Google Sheets)
// =========================================================================
const API_DRIVE_UTAMA = "https://script.google.com/macros/s/AKfycbxF3d5Se1viQG-kFFTuF5823HsFN9R9PaWEY9V6G7LwvaoGxEcCemuMDas-CpyS2fmGtA/exec";
let cardIndexTerpilih = -1;
let dataKartu = [];
let sedangMenggeserKartu = false;

// =========================================================================
// 2. LOGIKA MENCETAK KARTU
// =========================================================================
function cetakBintang(jumlah) {
    let html = "";
    for (let i = 1; i <= 5; i++) {
        if (i <= jumlah) {
            html += `<span class="star active">★</span>`;
        } else {
            html += `<span class="star">★</span>`;
        }
    }
    return html;
}

function muatSemuaKartu() {
    const wadah = document.getElementById('wadah-kartu');
    if (!wadah) return;
    wadah.innerHTML = "";

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
            if (sedangMenggeserKartu) {
                sedangMenggeserKartu = false;
                return;
            }

            // 1. EFEK VISUAL: Main kartu tetap "Primary Card"
            document.querySelectorAll('.card-wrapper').forEach(c => c.classList.remove('active'));
            const kartuUtama = document.querySelectorAll('.card-wrapper')[0];
            if (kartuUtama) {
                kartuUtama.classList.add('active');
                document.getElementById('main-bg').style.backgroundImage = `url('${dataKartu[0].gambar}')`;
            }

            // 2. LOGIKA FITUR: Pop-up login muncul jika kartu memiliki akses database
            if (kartu.hasAccess === true) {
                cardIndexTerpilih = (kartu.cardIndex !== undefined) ? kartu.cardIndex : index;
                bukaModalLogin();

                setTimeout(() => {
                    const inputUsername = document.getElementById('username');
                    if (inputUsername) {
                        inputUsername.value = '';
                        inputUsername.readOnly = false;
                        inputUsername.style.opacity = '1';
                        inputUsername.style.cursor = 'text';
                        inputUsername.focus();
                    }

                    const inputPassword = document.getElementById('password');
                    if (inputPassword) {
                        inputPassword.value = '';
                    }
                }, 50);
            }
        };

        wadah.appendChild(cardWrap);
    });

    if (dataKartu.length > 0) {
        document.getElementById('main-bg').style.backgroundImage = `url('${dataKartu[0].gambar}')`;
    }

    inisialisasiEfekGeser();
}

// =========================================================================
// 3. SISTEM MODAL LOGIN (Tanpa Menyimpan Kredensial di Variabel Global)
// =========================================================================
function bukaModalLogin() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('show');
    const err = document.getElementById('error-msg');
    if (err) err.style.display = 'none';
    const u = document.getElementById('username');
    const p = document.getElementById('password');
    if (u) u.value = '';
    if (p) p.value = '';
}

function closeModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('show');
    const p = document.getElementById('password');
    if (p) p.value = '';
    cardIndexTerpilih = -1;
}

// =========================================================================
// 4. EFEK GESER (DRAG / TOUCH) & PENCARIAN
// =========================================================================
function inisialisasiEfekGeser() {
    const allCards = document.querySelectorAll('.card-wrapper');
    const mainBg = document.getElementById('main-bg');
    const sliderContainer = document.getElementById('wadah-kartu');
    if (!sliderContainer) return;

    allCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const cardBg = card.querySelector('.card').style.backgroundImage;
            if (mainBg && mainBg.style.backgroundImage !== cardBg) {
                mainBg.style.backgroundImage = cardBg;
            }
        });
    });

    if (sliderContainer.dataset.geserReady === "true") return;
    sliderContainer.dataset.geserReady = "true";

    sliderContainer.addEventListener('mouseleave', () => {
        const activeCard = document.querySelector('.card-wrapper.active');
        if (activeCard && mainBg) {
            const activeBg = activeCard.querySelector('.card').style.backgroundImage;
            mainBg.style.backgroundImage = activeBg;
        }
    });

    // Dukungan Drag Mouse khusus Desktop (tanpa membaca offsetLeft berulang kali)
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    sliderContainer.addEventListener('mousedown', (e) => {
        isDown = true;
        sedangMenggeserKartu = false;
        sliderContainer.style.scrollBehavior = 'auto';
        startX = e.pageX;
        scrollLeft = sliderContainer.scrollLeft;
    });

    sliderContainer.addEventListener('mouseleave', () => {
        isDown = false;
        sliderContainer.style.scrollBehavior = 'smooth';
    });

    sliderContainer.addEventListener('mouseup', () => {
        isDown = false;
        sliderContainer.style.scrollBehavior = 'smooth';
        setTimeout(() => { sedangMenggeserKartu = false; }, 50);
    });

    sliderContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const walk = (e.pageX - startX) * 1.8;
        if (Math.abs(walk) > 6) sedangMenggeserKartu = true;
        sliderContainer.scrollLeft = scrollLeft - walk;
    });

    // Scroll Roda Mouse Horizontal di Desktop
    sliderContainer.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            sliderContainer.scrollLeft += e.deltaY;
        }
    }, { passive: true });


    // 2. Dukungan Sentuhan Layar (Mobile / HP)
    sliderContainer.addEventListener('touchstart', (e) => {
        isDown = true;
        sedangMenggeserKartu = false;
        sliderContainer.style.scrollBehavior = 'auto';
        startX = e.touches[0].pageX - sliderContainer.offsetLeft;
        scrollLeft = sliderContainer.scrollLeft;
    }, { passive: true });

    sliderContainer.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        const x = e.touches[0].pageX - sliderContainer.offsetLeft;
        const walk = (x - startX) * 1.5;
        if (Math.abs(walk) > 6) {
            sedangMenggeserKartu = true;
            if (e.cancelable) e.preventDefault();
        }
        sliderContainer.scrollLeft = scrollLeft - walk;
    }, { passive: false });

    sliderContainer.addEventListener('touchend', () => {
        isDown = false;
        sliderContainer.style.scrollBehavior = 'smooth';
        setTimeout(() => { sedangMenggeserKartu = false; }, 50);
    });

    // 3. Dukungan Scroll Roda Mouse Horizontal (Layar Desktop Sempit)
    sliderContainer.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            sliderContainer.scrollLeft += e.deltaY;
        }
    }, { passive: true });
}

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

// =========================================================================
// 5. SINKRONISASI SPREADSHEET & AUTENTIKASI LOGIN
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Hapus cache lama di localStorage yang masih menyimpan username
    localStorage.removeItem('cacheDataKartuGlobal');

    const cacheKartu = sessionStorage.getItem('cacheDataKartuGlobal');
    if (cacheKartu) {
        try {
            const parsed = JSON.parse(cacheKartu);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].cardIndex !== undefined) {
                dataKartu = parsed;
                muatSemuaKartu();
            }
        } catch (e) {}
    }

    sinkronisasiKartuGlobal();
});

async function sinkronisasiKartuGlobal() {
    try {
        const urlDenganCacheBypass = `${API_DRIVE_UTAMA}?action=getKartuUI&t=${Date.now()}`;
        const response = await fetch(urlDenganCacheBypass, { method: 'GET', redirect: 'follow' });
        const result = await response.json();

        if (result.status === 'success') {
            dataKartu = result.data.map((kartu, idx) => ({
                cardIndex: (kartu.cardIndex !== undefined) ? kartu.cardIndex : idx,
                status: kartu.status,
                hasAccess: kartu.hasAccess,
                bintang: kartu.bintang,
                gambar: kartu.gambar,
                icon: kartu.icon,
                apiDrive: API_DRIVE_UTAMA,
                halamanTujuan: "galeri.html",
                password: (kartu.hasAccess === true) ? "Tersedia" : ""
            }));

            sessionStorage.setItem('cacheDataKartuGlobal', JSON.stringify(dataKartu));
            muatSemuaKartu();
        }
    } catch (e) {
        console.error("Gagal menarik data UI dari Spreadsheet.", e);
    }
}

// SHA-256 dengan fallback otomatis jika dibuka via HTTP IP lokal (non-HTTPS)
async function hashPasswordSHA256(text) {
    if (window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    return sha256Fallback(text);
}

function sha256Fallback(ascii) {
    function rightRotate(value, amount) { return (value >>> amount) | (value << (32 - amount)); }
    const mathPow = Math.pow, maxWord = mathPow(2, 32);
    let result = '', words = [], asciiBitLength = ascii.length * 8;
    const hash = [], k = [];
    let primeCounter = 0, isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
            for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
            hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
            k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        }
    }
    ascii += '\x80';
    while (ascii.length % 64 - 56) ascii += '\x00';
    for (let i = 0; i < ascii.length; i++) {
        const j = ascii.charCodeAt(i);
        words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words.length] = (asciiBitLength / maxWord) | 0;
    words[words.length] = asciiBitLength;
    for (let j = 0; j < words.length;) {
        const w = words.slice(j, j += 16), oldHash = hash.slice(0);
        for (let i = 0; i < 64; i++) {
            const w15 = w[i - 15], w2 = w[i - 2];
            const a = hash[0], e = hash[4];
            const temp1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] +
                (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
            const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
            hash.unshift((temp1 + temp2) | 0);
            hash[4] = (hash[4] + temp1) | 0;
            hash.pop();
        }
        for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (let i = 0; i < 8; i++) {
        for (let j = 3; j + 1; j--) {
            const b = (hash[i] >> (j * 8)) & 255;
            result += ((b < 16) ? 0 : '') + b.toString(16);
        }
    }
    return result;
}

async function getBrowserFingerprint() {
    const raw = [
        navigator.userAgent,
        navigator.language,
        screen.width + "x" + screen.height,
        Intl.DateTimeFormat().resolvedOptions().timeZone
    ].join("|");
    return await hashPasswordSHA256(raw);
}

async function handleLogin(event) {
    event.preventDefault();

    const inputUser = document.getElementById('username').value.trim();
    const inputPass = document.getElementById('password').value;
    const pesanError = document.getElementById('error-msg');
    const tombolLogin = event.target.querySelector('button');

    if (cardIndexTerpilih < 0 || !inputUser || !inputPass) {
        pesanError.style.display = 'block';
        pesanError.textContent = "Silakan pilih kartu dan lengkapi kredensial!";
        return;
    }

    const dataUser = dataKartu.find(u => u.cardIndex === cardIndexTerpilih);
    if (!dataUser) return;

    tombolLogin.textContent = "Loading...";
    tombolLogin.disabled = true;

    try {
        const hashedPass = await hashPasswordSHA256(inputPass);
        const fp = await getBrowserFingerprint();

        const urlServer = `${dataUser.apiDrive}?action=login&cardIndex=${cardIndexTerpilih}&username=${encodeURIComponent(inputUser)}&password=${hashedPass}&fp=${fp}&t=${Date.now()}`;
        const response = await fetch(urlServer, { method: 'GET', redirect: 'follow' });
        const result = await response.json();

        if (result.status === 'success') {
            document.getElementById('password').value = '';
            sessionStorage.setItem("statusLogin", "berhasil");
            sessionStorage.setItem("userAktif", result.username);
            sessionStorage.setItem("apiDriveAktif", dataUser.apiDrive);
            sessionStorage.setItem("sessionToken", result.token);
            sessionStorage.setItem("sessionFP", fp);

            window.location.href = dataUser.halamanTujuan;
        } else {
            pesanError.style.display = 'block';
            pesanError.textContent = result.message || "Kredensial tidak valid!";
        }
    } catch (error) {
        pesanError.style.display = 'block';
        pesanError.textContent = "Gagal terhubung ke server. Pastikan koneksi aman.";
    } finally {
        tombolLogin.textContent = "Log In";
        tombolLogin.disabled = false;
    }
}