//////////////////////////////////////////////////
// INFINITY HEAX V2 - ĐÃ XÓA HIỂN THỊ KEY
//////////////////////////////////////////////////

// ============================================
// CẤU HÌNH
// ============================================
const JSON_FILE = 'keys.json';
const STORAGE_KEY = 'INFINITY_KEY';
const STORAGE_EXPIRE = 'INFINITY_EXPIRE';
const STORAGE_CUSTOM = 'INFINITY_CUSTOM_KEYS';

// ============================================
// STATE
// ============================================
let currentKey = '';
let keyExpiry = null;
let soundEnabled = true;
let darkMode = false;
let terminalHistory = [];

// ============================================
// ÂM THANH
// ============================================
function playSound(type) {
    if (!soundEnabled) return;
    try {
        let audio = null;
        let volume = 0.3;
        switch (type) {
            case 'click':
                audio = document.getElementById('audio-click');
                volume = 0.25;
                break;
            case 'success':
                audio = document.getElementById('audio-success');
                volume = 0.35;
                break;
            case 'error':
                audio = document.getElementById('audio-error');
                volume = 0.4;
                break;
            case 'warning':
                audio = document.getElementById('audio-warning');
                volume = 0.3;
                break;
            case 'toggle':
                audio = document.getElementById('audio-toggle');
                volume = 0.25;
                break;
            case 'levelup':
                audio = document.getElementById('audio-levelup');
                volume = 0.3;
                break;
            case 'notification':
                audio = document.getElementById('audio-notification');
                volume = 0.3;
                break;
            default:
                return;
        }
        if (audio) {
            audio.currentTime = 0;
            audio.volume = volume;
            audio.play().catch(() => {});
        }
    } catch (e) {}
}

function playBeep(freq = 800, dur = 150, type = 'sine') {
    if (!soundEnabled) return;
    try {
        const ctx = new(window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = type;
        gain.gain.value = 0.12;
        osc.start();
        osc.stop(ctx.currentTime + dur / 1000);
        setTimeout(() => ctx.close(), dur + 100);
    } catch (e) {}
}

function playSuccessBeep() {
    playBeep(1200, 100);
    setTimeout(() => playBeep(1500, 100), 100);
    setTimeout(() => playBeep(1800, 150), 200);
    playSound('success');
}

function playErrorBeep() {
    playBeep(300, 400, 'sawtooth');
    playSound('error');
}

function playWarningBeep() {
    playBeep(700, 250);
    setTimeout(() => playBeep(500, 250), 200);
    playSound('warning');
}

function playToggleOn() {
    playBeep(1000, 60);
    setTimeout(() => playBeep(1300, 60), 60);
    setTimeout(() => playBeep(1600, 80), 120);
    playSound('toggle');
}

function playToggleOff() {
    playBeep(800, 60);
    setTimeout(() => playBeep(600, 60), 60);
    setTimeout(() => playBeep(400, 80), 120);
    playSound('toggle');
}

function playLoginSound() {
    playBeep(800, 80);
    setTimeout(() => playBeep(1000, 80), 80);
    setTimeout(() => playBeep(1200, 80), 160);
    setTimeout(() => playBeep(1500, 120), 240);
    playSound('levelup');
}

// ============================================
// KEY MANAGEMENT - KHÔNG HIỂN THỊ KEY
// ============================================

function getAllKeys() {
    let customKeys = {};
    try {
        const saved = localStorage.getItem(STORAGE_CUSTOM);
        if (saved) {
            customKeys = JSON.parse(saved);
        }
    } catch (e) {
        customKeys = {};
    }
    return customKeys;
}

function keyExists(key) {
    const allKeys = getAllKeys();
    return allKeys[key] !== undefined;
}

function getKeyData(key) {
    const allKeys = getAllKeys();
    return allKeys[key] || null;
}

// === ĐỌC KEY TỪ JSON (CHỈ LƯU, KHÔNG HIỂN THỊ) ===
async function loadKeysFromBot() {
    try {
        const response = await fetch(JSON_FILE + '?t=' + Date.now());
        if (!response.ok) {
            document.getElementById('syncStatus').className = 'fas fa-exclamation-triangle';
            return false;
        }

        const data = await response.json();

        const botKeys = {};
        Object.keys(data).forEach(k => {
            if (k.startsWith('NEXORA-')) {
                botKeys[k] = data[k];
            }
        });

        if (Object.keys(botKeys).length > 0) {
            localStorage.setItem(STORAGE_CUSTOM, JSON.stringify(botKeys));
            document.getElementById('syncStatus').className = 'fas fa-check-circle';
            document.getElementById('syncStatus').style.color = '#00cc66';
            document.getElementById('sysKeyCount').textContent = Object.keys(botKeys).length;
            console.log('✅ Đã load key từ bot:', Object.keys(botKeys));
            playSound('notification');
            return true;
        } else {
            document.getElementById('syncStatus').className = 'fas fa-exclamation-circle';
            document.getElementById('syncStatus').style.color = '#ffaa00';
            document.getElementById('sysKeyCount').textContent = '0';
            return false;
        }
    } catch (e) {
        document.getElementById('syncStatus').className = 'fas fa-times-circle';
        document.getElementById('syncStatus').style.color = '#ff4757';
        document.getElementById('sysKeyCount').textContent = '0';
        console.log('❌ Lỗi load key:', e.message);
        return false;
    }
}

// === IMPORT KEY (KHÔNG HIỂN THỊ DANH SÁCH) ===
function importKeysFromJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = JSON.parse(ev.target.result);

                const botKeys = {};
                Object.keys(data).forEach(k => {
                    if (k.startsWith('NEXORA-')) {
                        botKeys[k] = data[k];
                    }
                });

                if (Object.keys(botKeys).length > 0) {
                    let currentKeys = {};
                    try {
                        const saved = localStorage.getItem(STORAGE_CUSTOM);
                        if (saved) currentKeys = JSON.parse(saved);
                    } catch (e) {}

                    const merged = { ...currentKeys, ...botKeys };
                    localStorage.setItem(STORAGE_CUSTOM, JSON.stringify(merged));

                    document.getElementById('syncStatus').className = 'fas fa-check-circle';
                    document.getElementById('syncStatus').style.color = '#00cc66';
                    document.getElementById('sysKeyCount').textContent = Object.keys(merged).length;
                    playSuccessBeep();
                    alert('✅ Import thành công ' + Object.keys(botKeys).length + ' key!');

                    setTimeout(() => location.reload(), 1000);
                } else {
                    alert('❌ Không tìm thấy key NEXORA-XXXX trong file!');
                    playErrorBeep();
                }
            } catch (err) {
                alert('❌ Lỗi đọc file: ' + err.message);
                playErrorBeep();
            }
        };
        reader.readAsText(file);
    };
    input.click();
    playSound('click');
}

// ============================================
// KEY SYSTEM
// ============================================

let savedKey = localStorage.getItem(STORAGE_KEY);
let expire = localStorage.getItem(STORAGE_EXPIRE);

window.onload = function() {
    loadKeysFromBot();

    updateClock();
    setInterval(updateClock, 1000);

    if (savedKey) {
        if (expire == 0 || !expire || Date.now() < Number(expire)) {
            openApp(savedKey);
        }
    }

    loadFuncs();
    loadBoosts();
    startMonitor();

    terminalLog('🚀 INFINITY HEAX V2 - SẴN SÀNG', 'success');
    terminalLog('📥 Gõ "import" để import key từ bot', 'info');
    terminalLog('💡 Gõ "help" để xem lệnh', 'info');
};

function updateClock() {
    const now = new Date();
    document.getElementById('sysTime').innerHTML = '<i class="fas fa-clock"></i> ' + now.toLocaleTimeString('vi-VN');
}

// === KIỂM TRA KEY HẾT HẠN ===
function checkKey() {
    let exp = localStorage.getItem(STORAGE_EXPIRE);
    if (exp && exp != 0) {
        if (Date.now() > Number(exp)) {
            terminalLog('⛔ KEY ĐÃ HẾT HẠN!', 'error');
            playErrorBeep();

            setTimeout(() => {
                alert('🔒 KEY HẾT HẠN! Vui lòng nhập KEY mới.');
            }, 300);

            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(STORAGE_EXPIRE);

            setTimeout(() => {
                location.reload();
            }, 500);
        }
    }
}

setInterval(checkKey, 1000);

// Cảnh báo sắp hết hạn
setInterval(() => {
    let exp = localStorage.getItem(STORAGE_EXPIRE);
    if (exp && exp != 0) {
        const daysLeft = Math.ceil((Number(exp) - Date.now()) / (24 * 60 * 60 * 1000));
        if (daysLeft === 3) {
            terminalLog('⚠️ CẢNH BÁO: KEY CÒN 3 NGÀY SỬ DỤNG!', 'warning');
            playWarningBeep();
        } else if (daysLeft === 1) {
            terminalLog('⚠️ CẢNH BÁO: KEY CÒN 1 NGÀY SỬ DỤNG!', 'warning');
            playWarningBeep();
        }
    }
}, 60000);

// === LOGIN ===
function loginKey() {
    const keyInput = document.getElementById('keyInput');
    const key = keyInput.value.trim();
    const msg = document.getElementById('lockMsg');
    const loginBtn = document.getElementById('loginBtn');

    playSound('click');

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ĐANG KIỂM TRA...';

    if (!key || key.length < 10) {
        msg.innerHTML = '❌ KEY KHÔNG HỢP LỆ';
        msg.className = 'lock-msg error';
        keyInput.classList.add('error');
        playErrorBeep();
        setTimeout(() => keyInput.classList.remove('error'), 500);
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-unlock"></i> KÍCH HOẠT';
        return;
    }

    if (!keyExists(key)) {
        msg.innerHTML = '❌ KEY KHÔNG TỒN TẠI! HÃY IMPORT KEY TỪ BOT.';
        msg.className = 'lock-msg error';
        keyInput.classList.add('error');
        playErrorBeep();
        setTimeout(() => keyInput.classList.remove('error'), 500);
        terminalLog(`❌ Key "${key}" không tồn tại`, 'error');
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-unlock"></i> KÍCH HOẠT';
        return;
    }

    const keyData = getKeyData(key);
    let time = 0;
    let typeName = 'Không xác định';

    if (keyData) {
        typeName = keyData.type || 'Không xác định';
        const type = keyData.type;
        if (type === '1 Giờ') time = Date.now() + 3600000;
        else if (type === '1 Ngày') time = Date.now() + 86400000;
        else if (type === '7 Ngày') time = Date.now() + 604800000;
        else if (type === '30 Ngày') time = Date.now() + 2592000000;
        else if (type === 'Vĩnh Viễn') time = 0;
        else time = Date.now() + 86400000;
    } else {
        time = Date.now() + 86400000;
    }

    localStorage.setItem(STORAGE_KEY, key);
    localStorage.setItem(STORAGE_EXPIRE, time);
    currentKey = key;
    keyExpiry = time;

    msg.innerHTML = '✅ KEY HỢP LỆ! (' + typeName + ')';
    msg.className = 'lock-msg success';
    keyInput.classList.add('valid');
    playLoginSound();
    setTimeout(() => keyInput.classList.remove('valid'), 500);

    openApp(key);
    terminalLog(`✅ Đăng nhập thành công: ${key}`, 'success');

    loginBtn.disabled = false;
    loginBtn.innerHTML = '<i class="fas fa-unlock"></i> KÍCH HOẠT';
}

function openApp(key) {
    document.getElementById('lockScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    document.getElementById('currentKey').innerHTML = key;
    document.getElementById('keyBadge').innerHTML = '<i class="fas fa-key"></i> ' + key;
    document.getElementById('profileKey').innerHTML = key;
    updateKeyInfo();
}

// === UPDATE KEY INFO ===
function updateKeyInfo() {
    if (!currentKey || !keyExpiry) return;

    const now = Date.now();
    const daysLeft = Math.ceil((keyExpiry - now) / (24 * 60 * 60 * 1000));
    const keyData = getKeyData(currentKey);
    const totalDays = keyData?.days || 30;
    const progress = Math.max(0, Math.min(100, (daysLeft / totalDays) * 100));

    document.getElementById('daysLeft').innerHTML = daysLeft + ' ngày';
    document.getElementById('profileDays').innerHTML = daysLeft + 'd';
    document.getElementById('expiryDate').innerHTML = new Date(keyExpiry).toLocaleString('vi-VN');
    document.getElementById('profileExpiry').innerHTML = new Date(keyExpiry).toLocaleDateString('vi-VN');
    document.getElementById('expiryProgress').style.width = progress + '%';
    document.getElementById('progressPercent').innerHTML = Math.round(progress) + '%';

    if (keyData) {
        document.getElementById('keyType').innerHTML = keyData.type || '--';
    }

    const status = document.getElementById('keyStatus');
    if (daysLeft <= 0) {
        status.className = 'key-status expired';
        status.innerHTML = '<i class="fas fa-times-circle"></i> Đã hết hạn';
    } else if (daysLeft <= 3) {
        status.className = 'key-status warning';
        status.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Sắp hết hạn (' + daysLeft + ' ngày)';
    } else {
        status.className = 'key-status';
        status.innerHTML = '<i class="fas fa-check-circle"></i> Hoạt động (' + daysLeft + ' ngày)';
    }
}

// === LOGOUT ===
function logoutKey() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        playSound('click');
        playBeep(600, 150);
        setTimeout(() => playBeep(400, 200), 150);
        setTimeout(() => playBeep(300, 300), 350);

        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_EXPIRE);
        currentKey = '';
        keyExpiry = null;
        setTimeout(() => {
            location.reload();
        }, 300);
    }
}

// ============================================
// TAB
// ============================================
function tab(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.nav-btn[data-tab="${id}"]`).classList.add('active');

    playSound('click');
}

// ============================================
// TERMINAL
// ============================================
function terminalLog(msg, type = 'info') {
    const output = document.getElementById('terminalOutput');
    if (!output) return;

    const colors = {
        success: '#00ff88',
        error: '#ff4757',
        warning: '#ffaa00',
        info: '#66ccff',
        vip: '#ff6b9d'
    };
    const prefix = {
        success: '✅ ',
        error: '❌ ',
        warning: '⚠️ ',
        info: 'ℹ️ ',
        vip: '✨ '
    };

    const line = document.createElement('div');
    line.style.color = colors[type] || '#00ff88';
    line.className = type;
    line.innerHTML = (prefix[type] || '') + msg;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

function clearTerminal() {
    document.getElementById('terminalOutput').innerHTML = '';
    terminalLog('🧹 Đã xóa terminal', 'info');
    playSound('click');
}

function execTerminal() {
    const input = document.getElementById('terminalInput');
    const cmd = input.value.trim();
    if (!cmd) return;

    terminalLog('> ' + cmd, 'info');
    input.value = '';
    playSound('click');

    const lower = cmd.toLowerCase();

    if (lower === 'help') {
        terminalLog('📖 DANH SÁCH LỆNH:', 'vip');
        terminalLog('  help       - Trợ giúp', 'info');
        terminalLog('  status     - Trạng thái', 'info');
        terminalLog('  key list   - Danh sách key', 'info');
        terminalLog('  key info   - Thông tin key', 'info');
        terminalLog('  import     - Import key từ bot', 'info');
        terminalLog('  clear      - Xóa terminal', 'info');
        terminalLog('  sound      - Bật/tắt âm thanh', 'info');
        terminalLog('  logout     - Đăng xuất', 'info');
        return;
    }

    if (lower === 'import') {
        importKeysFromJSON();
        return;
    }

    if (lower === 'status') {
        if (!currentKey) {
            terminalLog('🔴 Chưa đăng nhập', 'error');
            return;
        }
        const daysLeft = Math.ceil((keyExpiry - Date.now()) / (24 * 60 * 60 * 1000));
        terminalLog(`🟢 ONLINE | KEY: ${currentKey}`, 'success');
        terminalLog(`⏳ Còn ${daysLeft} ngày`, daysLeft <= 3 ? 'warning' : 'success');
        return;
    }

    if (lower === 'key list') {
        const allKeys = getAllKeys();
        const keys = Object.keys(allKeys);
        if (!keys.length) {
            terminalLog('⚠️ Chưa có key nào! Gõ "import" để import.', 'warning');
            return;
        }
        terminalLog(`📋 DANH SÁCH KEY (${keys.length}):`, 'vip');
        keys.forEach(k => {
            const data = allKeys[k];
            const type = data?.type || 'Không xác định';
            terminalLog(`  🔑 ${k} (${type})`, 'info');
        });
        return;
    }

    if (lower === 'key info') {
        if (!currentKey) {
            terminalLog('❌ Chưa đăng nhập', 'error');
            return;
        }
        const daysLeft = Math.ceil((keyExpiry - Date.now()) / (24 * 60 * 60 * 1000));
        const keyData = getKeyData(currentKey);
        terminalLog(`🔑 KEY: ${currentKey}`, 'vip');
        terminalLog(`📌 Loại: ${keyData?.type || 'Không xác định'}`, 'info');
        terminalLog(`⏳ Còn ${daysLeft} ngày`, daysLeft <= 3 ? 'warning' : 'success');
        return;
    }

    if (lower === 'sound') {
        soundEnabled = !soundEnabled;
        terminalLog(`🔊 Âm thanh: ${soundEnabled ? 'BẬT' : 'TẮT'}`, 'info');
        if (soundEnabled) playSuccessBeep();
        return;
    }

    if (lower === 'logout') {
        logoutKey();
        return;
    }

    terminalLog(`❌ Không hiểu lệnh: ${cmd}`, 'error');
    playErrorBeep();
}

// ============================================
// FUNC
// ============================================
function loadFuncs() {
    const funcs = [
        { name: 'AIMLOCK', icon: 'fa-crosshairs' },
        { name: 'STABILITY ASSIST', icon: 'fa-eye' },
        { name: 'AIM HOLD', icon: 'fa-forward' },
        { name: 'AIM LOCKDOWN', icon: 'fa-bullseye' },
        { name: 'HEADSHOT FIX', icon: 'fa-palette' },
        { name: 'SENVIBITY BOOSTER', icon: 'fa-shield' },
        { name: 'AIM DRAG VIP', icon: 'fa-radar' },
        { name: 'No Recoil', icon: 'fa-gun' }
    ];

    const list = document.getElementById('funcList');
    list.innerHTML = funcs.map(f => `
        <div class="func-item">
            <span><i class="fas ${f.icon}"></i> ${f.name}</span>
            <label class="func-toggle">
                <input type="checkbox" onchange="toggleFunc(this)">
                <span class="slider"></span>
            </label>
        </div>
    `).join('');
}

function toggleFunc(el) {
    const isChecked = el.checked;
    if (isChecked) {
        playToggleOn();
        terminalLog('✅ Bật chức năng', 'success');
    } else {
        playToggleOff();
        terminalLog('⛔ Tắt chức năng', 'warning');
    }
}

// ============================================
// BOOST
// ============================================
function loadBoosts() {
    const boosts = [
        'AIMLOCK', 'STABILITY ASSIST', 'AIM HOLD',
        'HEADSHOT FIX', 'BULLET ALIGN', 'Latency Fix'
    ];

    const list = document.getElementById('boostList');
    list.innerHTML = boosts.map(b => `
        <div class="boost-item">
            <div class="boost-header">
                <span><i class="fas fa-bolt"></i> ${b}</span>
                <span class="boost-value" id="boost_${b.replace(/\s/g, '_')}_val">0%</span>
            </div>
            <input type="range" class="boost-slider" min="0" max="100" value="0"
                   oninput="onBoostChange(this, 'boost_${b.replace(/\s/g, '_')}_val')">
        </div>
    `).join('');
}

function onBoostChange(el, id) {
    const val = el.value;
    document.getElementById(id).textContent = val + '%';
    const freq = 400 + Math.floor(val / 2);
    playBeep(freq, 50);

    if (val == 100) {
        playSound('levelup');
        terminalLog('⚡ Đạt mức tối đa!', 'success');
    } else if (val == 0) {
        terminalLog('⛔ Đã tắt boost', 'warning');
    }
}

// ============================================
// MONITOR
// ============================================
function startMonitor() {
    const canvas = document.getElementById('chart');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth - 20;
    canvas.height = 70;

    let data = [];

    setInterval(() => {
        const ram = Math.floor(30 + Math.random() * 50);
        const cpu = Math.floor(30 + Math.random() * 40);
        const temp = Math.floor(35 + Math.random() * 20);
        const fps = Math.floor(80 + Math.random() * 40);

        document.getElementById('ram').textContent = ram + '%';
        document.getElementById('cpu').textContent = cpu + '%';
        document.getElementById('temp').textContent = temp + '°C';
        document.getElementById('fps').textContent = fps;

        document.getElementById('ramBar').style.width = ram + '%';
        document.getElementById('cpuBar').style.width = cpu + '%';
        document.getElementById('tempBar').style.width = (temp / 60 * 100) + '%';
        document.getElementById('fpsBar').style.width = (fps / 120 * 100) + '%';

        data.push(Math.random() * 50 + 10);
        if (data.length > 25) data.shift();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();

        data.forEach((v, i) => {
            const x = i * (canvas.width / 25);
            const y = canvas.height - v;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });

        const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#ff2020';
        ctx.strokeStyle = primary;
        ctx.lineWidth = 2;
        ctx.shadowColor = primary + '44';
        ctx.shadowBlur = 10;
        ctx.stroke();

        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fillStyle = primary + '11';
        ctx.fill();

    }, 1500);
}

function cleanRam() {
    document.getElementById('consoleLog').textContent = '🧹 Đang dọn RAM...';
    playSound('click');
    playBeep(600, 100);
    setTimeout(() => {
        document.getElementById('consoleLog').textContent = '✅ RAM đã được dọn sạch!';
        document.getElementById('ram').textContent = '18%';
        document.getElementById('ramBar').style.width = '18%';
        playSuccessBeep();
    }, 1500);
}

function clearConsole() {
    document.getElementById('consoleLog').textContent = '🧹 Console cleared...';
    playSound('click');
}

function resetSystem() {
    document.getElementById('consoleLog').textContent = '🔄 Đang reset hệ thống...';
    playSound('warning');
    playBeep(700, 300);
    setTimeout(() => {
        document.getElementById('consoleLog').textContent = '✅ Hệ thống đã được reset!';
        playSuccessBeep();
    }, 1200);
}

function systemInfo() {
    const log = document.getElementById('consoleLog');
    const allKeys = getAllKeys();
    const info = `📊 INFINITY HEAX V2 | KEY: ${currentKey || 'None'} | RAM: ${document.getElementById('ram').textContent} | CPU: ${document.getElementById('cpu').textContent} | Tổng key: ${Object.keys(allKeys).length}`;
    log.textContent = info;
    terminalLog(info, 'vip');
    playSound('notification');
}

// ============================================
// GAME
// ============================================
function openGame(type) {
    const games = {
        ffmax: { app: 'freefiremax://', store: 'https://apps.apple.com/app/free-fire-max/id1480516829' },
        ffth: { app: 'freefire://', store: 'https://apps.apple.com/app/garena-free-fire/id1300146617' },
        ff: { app: 'freefire://', store: 'https://apps.apple.com/app/garena-free-fire/id1300146617' }
    };

    const game = games[type] || games.ff;
    terminalLog(`🎮 Đang mở ${type.toUpperCase()}...`, 'info');
    playSound('click');
    playBeep(900, 200);

    const start = Date.now();
    window.location.href = game.app;

    setTimeout(() => {
        if (document.visibilityState === 'visible') {
            window.location.href = game.store;
            terminalLog(`📱 Mở App Store: ${type.toUpperCase()}`, 'info');
        }
    }, 2500);
}

// ============================================
// SETTINGS
// ============================================
function changeColor(color, btn) {
    document.documentElement.style.setProperty('--primary', color);
    document.documentElement.style.setProperty('--primary-dark', color);
    document.documentElement.style.setProperty('--primary-glow', color + '44');

    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    playSound('click');
    playBeep(500, 100);
    terminalLog(`🎨 Đổi màu sang: ${color}`, 'info');
}

function toggleSetting(el) {
    const isChecked = el.checked;
    if (isChecked) {
        playToggleOn();
        terminalLog('⚙️ Bật cài đặt', 'success');
    } else {
        playToggleOff();
        terminalLog('⚙️ Tắt cài đặt', 'warning');
    }
}

function toggleDarkMode(el) {
    const isDark = el.checked;
    darkMode = isDark;

    if (isDark) {
        document.documentElement.style.setProperty('--bg', '#ffffff');
        document.documentElement.style.setProperty('--bg-card', 'rgba(240, 240, 245, 0.9)');
        document.documentElement.style.setProperty('--bg-input', 'rgba(255, 255, 255, 0.8)');
        document.documentElement.style.setProperty('--text', '#1a1a2e');
        document.documentElement.style.setProperty('--text-muted', '#555');
        document.documentElement.style.setProperty('--text-dim', '#888');
        document.documentElement.style.setProperty('--border', 'rgba(0, 0, 0, 0.08)');
    } else {
        document.documentElement.style.setProperty('--bg', '#05080f');
        document.documentElement.style.setProperty('--bg-card', 'rgba(10, 15, 25, 0.85)');
        document.documentElement.style.setProperty('--bg-input', 'rgba(0, 0, 0, 0.6)');
        document.documentElement.style.setProperty('--text', '#e8ecf1');
        document.documentElement.style.setProperty('--text-muted', '#7a8aaa');
        document.documentElement.style.setProperty('--text-dim', '#3a4a6a');
        document.documentElement.style.setProperty('--border', 'rgba(255, 255, 255, 0.06)');
    }

    playSound('toggle');
    playBeep(600, 150);
    terminalLog(`🌙 Dark Mode: ${isDark ? 'BẬT' : 'TẮT'}`, 'info');
}

// ============================================
// SOCIAL
// ============================================
function openLink(type) {
    const links = {
        fb: 'https://facebook.com',
        zl: 'http://zalo.me/84822439761',
        tt: 'https://www.tiktok.com/@phucbanfile.lovetiktok',
        yt: 'https://youtube.com',
        github: 'https://github.com',
        discord: 'https://discord.com'
    };
    window.open(links[type] || '#', '_blank');
    playSound('click');
    terminalLog(`🔗 Mở ${type.toUpperCase()}`, 'info');
}

// ============================================
// EXPOSE
// ============================================
window.loginKey = loginKey;
window.logoutKey = logoutKey;
window.tab = tab;
window.execTerminal = execTerminal;
window.clearTerminal = clearTerminal;
window.importKeysFromJSON = importKeysFromJSON;
window.loadKeysFromBot = loadKeysFromBot;
window.cleanRam = cleanRam;
window.clearConsole = clearConsole;
window.resetSystem = resetSystem;
window.systemInfo = systemInfo;
window.openGame = openGame;
window.changeColor = changeColor;
window.toggleSetting = toggleSetting;
window.toggleDarkMode = toggleDarkMode;
window.openLink = openLink;
window.onBoostChange = onBoostChange;
window.toggleFunc = toggleFunc;

console.log('🚀 INFINITY HEAX V2 - ĐÃ XÓA HIỂN THỊ KEY');
console.log('📥 Gõ "import" để import key từ bot');
console.log('📂 File JSON:', JSON_FILE);