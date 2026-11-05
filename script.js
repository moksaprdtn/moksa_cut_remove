/**
 * MOKSA CUT BACKGROUND - Skrip Sisi Klien Terpadu
 * Terintegrasi dengan Supabase Edge Function & Sistem Iklan Hibrida (Online / Offline)
 */

// ==========================================
// 1. FUNGSI GLOBAL (Harus di luar DOMContentLoaded)
// ==========================================
function switchView(targetViewId) {
    const target = document.getElementById(targetViewId);
    
    if (!target) {
        console.warn(`Halaman dengan ID "${targetViewId}" tidak ditemukan.`);
        return;
    }

    document.querySelectorAll('.app-view').forEach(view => {
        view.classList.remove('active-view');
    });

    target.classList.add('active-view');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.querySelectorAll('.nav-links .nav-item').forEach(item => {
        if (item.getAttribute('data-target') === targetViewId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// ==========================================
// 2. INISIALISASI UTAMA KETIKA HALAMAN DIMUAT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Pastikan Supabase sudah dimuat
    if (!window.supabase) {
        console.error("SDK Supabase belum dimuat dengan benar.");
        return;
    }

    const supabaseClient = window.supabase.createClient(window.APP_CONFIG.supabaseUrl, window.APP_CONFIG.supabaseKey);

    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const navPanel = document.getElementById('navPanel');
    const navOverlay = document.getElementById('navOverlay');
    
    const dropArea = document.getElementById('dropArea');
    const imageInput = document.getElementById('imageInput');
    const selectImgBtn = document.getElementById('selectImgBtn');
    const previewContainer = document.getElementById('previewContainer');
    const originalPreview = document.getElementById('originalPreview');
    const resultPreview = document.getElementById('resultPreview');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const removeBgBtn = document.getElementById('removeBgBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    const buyPremiumFormatBtn = document.getElementById('buyPremiumFormatBtn');
    const buyRemoveAdsBtn = document.getElementById('buyRemoveAdsBtn');
    const donateBtn = document.getElementById('donateBtn');
    const activateCodeBtn = document.getElementById('activateCodeBtn');
    const activationCodeInput = document.getElementById('activationCodeInput');
    const activationTypeSelect = document.getElementById('activationTypeSelect');
    const activationMessage = document.getElementById('activationMessage');
    
    const darkModeToggle = document.getElementById('darkModeToggle');
    const statusPremiumFormat = document.getElementById('statusPremiumFormat');
    const statusNoAds = document.getElementById('statusNoAds');

    let currentFile = null;
    let processedImageUrl = null;
    let isPremiumFormatActive = localStorage.getItem('isPremiumFormatActive') === 'true';
    window.isNoAdsActive = localStorage.getItem('isNoAdsActive') === 'true';

    initApp();

    function initApp() {
        const recApp1Img = document.getElementById('recApp1Img');
        const recApp2Img = document.getElementById('recApp2Img');
        const recApp1Link = document.getElementById('recApp1Link');
        const recApp2Link = document.getElementById('recApp2Link');

        if (recApp1Img) recApp1Img.src = window.APP_CONFIG.recApp1Logo;
        if (recApp2Img) recApp2Img.src = window.APP_CONFIG.recApp2Logo;
        if (recApp1Link) recApp1Link.href = window.APP_CONFIG.recApp1Url;
        if (recApp2Link) recApp2Link.href = window.APP_CONFIG.recApp2Url;

        updateLicenseUI();
        updateAdNetworkStatus();

        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-theme');
            if (darkModeToggle) darkModeToggle.checked = true;
        }
    }
    
        // ==========================================
    // KONTROL TEMA GELAP (DARK MODE TOGGLE)
    // ==========================================
    if (darkModeToggle) {
        // Set status awal toggle sesuai kondisi localStorage
        darkModeToggle.checked = document.body.classList.contains('dark-theme');

        darkModeToggle.addEventListener('change', () => {
            if (darkModeToggle.checked) {
                document.body.classList.add('dark-theme');
                localStorage.setItem('darkMode', 'true');
            } else {
                document.body.classList.remove('dark-theme');
                localStorage.setItem('darkMode', 'false');
            }
        });
    }

    function openMenu() {
        if (navPanel) navPanel.classList.add('open');
        if (navOverlay) navOverlay.classList.add('active');
        document.body.classList.add('menu-open');
    }

    function closeMenu() {
        if (navPanel) navPanel.classList.remove('open');
        if (navOverlay) navOverlay.classList.remove('active');
        document.body.classList.remove('menu-open');
    }

    // MEMBLOKIR SENTUHAN SCROLL TEMBUS KE BERANDA SAAT MENU TERBUKA
    document.addEventListener('touchmove', function(e) {
        if (document.body.classList.contains('menu-open')) {
            // Jika jari menyentuh di luar panel menu (.nav-panel), hentikan pergerakan scroll
            if (navPanel && !navPanel.contains(e.target)) {
                e.preventDefault();
            }
        }
    }, { passive: false });

    if (menuToggleBtn) menuToggleBtn.addEventListener('click', openMenu);
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
    if (navOverlay) navOverlay.addEventListener('click', closeMenu);

    document.querySelectorAll('.nav-links .nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = item.getAttribute('data-target');
            if (targetView) {
                switchView(targetView);
                closeMenu();
            }
        });
    });

    const formatOptions = document.querySelectorAll('.format-option');
    formatOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            const format = option.getAttribute('data-format');
            if (format !== 'jpg' && !isPremiumFormatActive) {
                e.preventDefault();
                alert('Format PNG dan JPEG terkunci sepenuhnya! Silakan masukkan kode lisensi premium terlebih dahulu untuk membukanya.');
                switchView('view-activation');
            }
        });
    });

    if (selectImgBtn && imageInput) {
        selectImgBtn.addEventListener('click', () => imageInput.click());
    }
    
    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleSelectedImage(e.target.files[0]);
            }
        });
    }

    if (dropArea) {
        dropArea.addEventListener('dragover', (e) => e.preventDefault());
        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleSelectedImage(e.dataTransfer.files[0]);
            }
        });
    }

    function handleSelectedImage(file) {
        const fileType = file.type.toLowerCase();
        const fileName = file.name.toLowerCase();
        const isJpg = fileType.includes('jpeg') || fileType.includes('jpg') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg');

        if (!isPremiumFormatActive && !isJpg) {
            alert('Akses ditolak! Sebelum lisensi premium diaktifkan, Anda HANYA diperbolehkan mengunggah dan memproses gambar berformat JPG.');
            if (imageInput) imageInput.value = ""; 
            return;
        }

        if (!file.type.match('image.*')) {
            alert('Harap pilih berkas gambar yang valid.');
            return;
        }

        currentFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (originalPreview) originalPreview.src = e.target.result;
            if (previewContainer) previewContainer.classList.remove('hidden');
            if (removeBgBtn) {
                removeBgBtn.classList.remove('hidden');
                removeBgBtn.disabled = false;
            }
            if (resetBtn) resetBtn.classList.remove('hidden');
            if (downloadBtn) downloadBtn.classList.add('hidden');
            if (resultPreview) resultPreview.src = '';
        };
        reader.readAsDataURL(file);
    }

    // ==========================================
    // PROSES HAPUS BACKGROUND DENGAN VALIDASI OFFLINE/ONLINE
    // ==========================================
    if (removeBgBtn) {
        removeBgBtn.addEventListener('click', async () => {
            if (!currentFile) return;

            if (!navigator.onLine) {
                alert('Koneksi internet terputus. Fitur penghapusan latar belakang memerlukan koneksi internet yang aktif.');
                return;
            }

            if (loadingIndicator) loadingIndicator.classList.remove('hidden');
            removeBgBtn.disabled = true;

            try {
                const base64String = await convertFileToBase64(currentFile);
                const base64Data = base64String.split(',')[1];

                const functionUrl = `${window.APP_CONFIG.supabaseUrl}/functions/v1/moksa-remove`;

                const response = await fetch(functionUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${window.APP_CONFIG.supabaseKey}`
                    },
                    body: JSON.stringify({ imageBase64: base64Data })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(errText || 'Gagal memproses gambar di server.');
                }

                const blob = await response.blob();
                
                if (blob.size < 100) {
                    throw new Error('Data gambar yang dikembalikan kosong.');
                }

                processedImageUrl = URL.createObjectURL(blob);
                if (resultPreview) resultPreview.src = processedImageUrl;
                
                if (downloadBtn) downloadBtn.classList.remove('hidden');
                if (resetBtn) resetBtn.classList.remove('hidden');

            } catch (error) {
                console.error('Kesalahan Pemrosesan:', error);
                alert(`Gagal memproses gambar: ${error.message}`);
            } finally {
                if (loadingIndicator) loadingIndicator.classList.add('hidden');
                removeBgBtn.disabled = false;
            }
        });
    }

    function convertFileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (!processedImageUrl) return;

            const selectedFormatInput = document.querySelector('input[name="imageFormat"]:checked');
            const selectedFormat = selectedFormatInput ? selectedFormatInput.value : 'jpg';

            if (!isPremiumFormatActive && selectedFormat !== 'jpg') {
                alert('Format PNG dan JPEG terkunci! Anda hanya diperbolehkan mengunduh dalam format JPG.');
                switchView('view-activation');
                return;
            }

            const a = document.createElement('a');
            a.href = processedImageUrl;
            a.download = `moksacut-bg.${selectedFormat}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            currentFile = null;
            processedImageUrl = null;
            if (originalPreview) originalPreview.src = '';
            if (resultPreview) resultPreview.src = '';
            if (previewContainer) previewContainer.classList.add('hidden');
            if (removeBgBtn) removeBgBtn.classList.add('hidden');
            if (downloadBtn) downloadBtn.classList.add('hidden');
            if (resetBtn) resetBtn.classList.add('hidden');
            if (imageInput) imageInput.value = '';
        });
    }

    // Sistem Aktivasi Kode Unik dengan Proteksi Mode Offline
    if (activateCodeBtn) {
        activateCodeBtn.addEventListener('click', async () => {
            const code = activationCodeInput ? activationCodeInput.value.trim() : '';
            const targetCategory = activationTypeSelect ? activationTypeSelect.value : '';

            if (code.length < 16) {
                showActivationMessage('Kode unik minimal harus 16 karakter.', 'error');
                return;
            }

            if (!navigator.onLine) {
                showActivationMessage('Tidak ada koneksi internet. Aktivasi kode unik memerlukan koneksi online.', 'error');
                return;
            }

            try {
                const { data, error } = await supabaseClient
                    .from('licenses')
                    .select('*')
                    .eq('code', code)
                    .single();

                if (error || !data) {
                    throw new Error('Kode unik tidak ditemukan dalam database.');
                }

                if (data.category !== targetCategory) {
                    throw new Error(`Kode ini adalah kategori ${data.category}, tidak dapat digunakan untuk ${targetCategory}.`);
                }

                if (data.status === 'SUDAH DIGUNAKAN') {
                    throw new Error('Kode unik ini sudah pernah digunakan sebelumnya.');
                }

                const activatedAt = new Date().toISOString();
                const { error: updateError } = await supabaseClient
                    .from('licenses')
                    .update({ 
                        status: 'SUDAH DIGUNAKAN', 
                        activated_at: activatedAt 
                    })
                    .eq('code', code);

                if (updateError) {
                    throw new Error('Gagal memperbarui status aktivasi di database.');
                }

                showActivationMessage(`Aktivasi berhasil untuk ${data.category}!`, 'success');

                if (targetCategory === 'PREMIUM FORMAT') {
                    unlockFormatOptions();
                } else if (targetCategory === 'REMOVE ADS FOREVER') {
                    window.isNoAdsActive = true;
                    localStorage.setItem('isNoAdsActive', 'true');
                    document.querySelectorAll('.ad-card-box').forEach(el => el.classList.add('hidden'));
                }
                updateLicenseUI();

            } catch (err) {
                console.error("Detail Error Aktivasi:", err.message || err);
                showActivationMessage(err.message || 'Terjadi kesalahan sistem.', 'error');
            }
        });
    }

    function unlockFormatOptions() {
        isPremiumFormatActive = true;
        localStorage.setItem('isPremiumFormatActive', 'true');

        document.querySelectorAll('.format-option').forEach(el => {
            el.classList.remove('locked');
            el.style.cursor = 'pointer';
            el.style.opacity = '1';
            const radio = el.querySelector('input');
            if (radio) radio.disabled = false;
            const lockIcon = el.querySelector('.lock-icon');
            if (lockIcon) lockIcon.remove();

            const desc = el.querySelector('.format-desc');
            if (desc && el.getAttribute('data-format') !== 'jpg') {
                desc.textContent = 'Terbuka (Versi Premium)';
            }
        });
    }

    function updateLicenseUI() {
        if (isPremiumFormatActive) {
            unlockFormatOptions();
            if (statusPremiumFormat) {
                statusPremiumFormat.textContent = 'Aktif (Permanen)';
                statusPremiumFormat.style.color = '#10b981';
            }
        }
        if (window.isNoAdsActive) {
            if (statusNoAds) {
                statusNoAds.textContent = 'Aktif (Bebas Iklan)';
                statusNoAds.style.color = '#10b981';
            }
            document.querySelectorAll('.ad-card-box').forEach(el => el.classList.add('hidden'));
        }
    }

    function showActivationMessage(text, type) {
        if (activationMessage) {
            activationMessage.textContent = text;
            activationMessage.className = `activation-message ${type}`;
        }
    }

    // Tombol Buka Format Premium mengarah ke URL Shop 1
    if (buyPremiumFormatBtn) {
        buyPremiumFormatBtn.addEventListener('click', () => {
            window.open(window.APP_CONFIG.socialBuzzShopUrl1, '_blank');
        });
    }

    // Tombol Hapus Iklan Selamanya mengarah ke URL Shop 2
    if (buyRemoveAdsBtn) {
        buyRemoveAdsBtn.addEventListener('click', () => {
            window.open(window.APP_CONFIG.socialBuzzShopUrl2, '_blank');
        });
    }

    if (donateBtn) {
        donateBtn.addEventListener('click', () => {
            window.open(window.APP_CONFIG.socialBuzzDonasiUrl, '_blank');
        });
    }

    // ==========================================
    // SISTEM IKLAN HIBRIDA (ONLINE <-> OFFLINE)
    // ==========================================
    function updateAdNetworkStatus() {
        const onlineAds = document.querySelectorAll('#onlineAd');
        const offlineAds = document.querySelectorAll('#offlineAd');
        const adContainers = document.querySelectorAll('#dynamicAdContainer');

        if (typeof window.isNoAdsActive !== 'undefined' && window.isNoAdsActive) {
            adContainers.forEach(container => container.classList.add('hidden'));
            return;
        }

        if (navigator.onLine) {
            onlineAds.forEach(el => el.style.display = 'block');
            offlineAds.forEach(el => el.style.display = 'none');
        } else {
            onlineAds.forEach(el => el.style.display = 'none');
            offlineAds.forEach(el => el.style.display = 'block');
        }
    }

    window.addEventListener('load', updateAdNetworkStatus);
    window.addEventListener('online', updateAdNetworkStatus);
    window.addEventListener('offline', updateAdNetworkStatus);

});