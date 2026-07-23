//////////////////////////////////////////////////
// INFINITY HEAX V2 - ĐẦY ĐỦ ÂM THANH + HIỆU ỨNG
//////////////////////////////////////////////////

// ============================================
// CONFIG
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
let isSyncing = false;

// ============================================
// ÂM THANH SYSTEM
// ============================================
function playSound(type) {
    if (!soundEnabled) return;
    
    try {
        let audio = null;
        switch(type) {
            case 'click':
                audio = document.getElementById('audio-click');
                break;
            case 'success':
                audio = document.getElementById('audio-success');
                break;
            case 'error':
                audio = document.getElementById('audio-error');
                break;
            case 'warning':
                audio = document.getElementById('audio-warning');
                break;
            case 'toggle':
                audio = document.getElementById('audio-toggle');
                break;
            default:
                return;
        }
        
        if (audio) {
            audio.currentTime = 0;
            audio.volume = 0.3;
            audio.play().catch(() => {});
        }
    } catch (e) {}
}

function playBeep(freq = 800, dur = 150, type = 'sine') {
    if (!soundEnabled) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = type;
        gain.gain.value = 0.1;
        osc.start();
        osc.stop(ctx.currentTime + dur / 1000);
        setTimeout(() => ctx.close(), dur + 100);
    } catch (e) {}
}

function playSuccessBeep() {
    playBeep(1200, 120);
    setTimeout(() => playBeep(1500, 120), 120);
    setTimeout(() => playBeep(1800, 150), 240);
}

function playErrorBeep() {
    playBeep(300, 400, 'sawtooth');
}

function playWarningBeep() {
    playBeep(700, 250);
    setTimeout(() => playBeep(500, 250), 200);
}

// ============================================
// KEY MANAGEMENT
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

async function syncKeys() {
    if (isSyncing) return false;
    
    isSyncing = true;
    
    try {
        const response = await fetch(JSON_FILE + '?t=' + Date.now());
        if (!response.ok) {
            isSyncing = false;
            return false;
        }
        
        const data = await response.json();
        
        const botKeys = {};
        Object.keys(data).forEach(k => {
            if (k.startsWith('NEXORA-')) {
                botKeys[k] = data[k];
            }
        });
        
        localStorage.setItem(STORAGE_CUSTOM, JSON.stringify(botKeys));
        
        const count = Object.keys(botKeys).length;
        renderKeyList();
        
        terminalLog(`✅ Đồng bộ thành công! Có ${count} key từ bot`, 'success');
        playSound('success');
        
        isSyncing = false;
        return true;
        
    } catch (e) {
        terminalLog(`❌ Lỗi đồng bộ: ${e.message}`, 'error');
        playSound('error');
        isSyncing = false;
        return false;
    }
}

function renderKeyList() {
    // Không hiển thị key list trên màn hình khóa nữa
    // Chỉ cập nhật số lượng key nếu cần
    const allKeys = getAllKeys();
    const keys = Object.keys(allKeys);
    // Có thể thêm logic hiển thị ở đây nếu muốn
}

function startAutoSync() {
    setTimeout(() => { syncKeys(); }, 500);
    setInterval(() => { syncKeys(); }, 10000);
}

// ============================================
// PARTICLES
// ============================================
function createParticles() {
    const container = document.getElementById('particles-container');
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.width = (2 + Math.random() * 3) + 'px';
        particle.style.height = particle.style.width;
        particle.style.animationDuration = (5 + Math.random() * 15) + 's';
        particle.style.animationDelay = (Math.random() * 10) + 's';
        particle.style.opacity = 0.2 + Math.random() * 0.4;
        container.appendChild(particle);
    }
}

// ============================================
// KEY SYSTEM
// ============================================

let savedKey = localStorage.getItem(STORAGE_KEY);
let expire = localStorage.getItem(STORAGE_EXPIRE);

window.onload = function() {
    createParticles();
    startAutoSync();
    updateClock();
    setInterval(updateClock, 1000);
    
    if (savedKey) {
        if (expire == 0 || !expire || Date.now() < Number(expire)) {
            openApp(savedKey);
            playSound('success');
        }
    }
    
    loadFuncs();
    loadBoosts();
    startMonitor();
};

function updateClock() {
    const now = new Date();
    document.getElementById('sysTime').textContent = now.toLocaleTimeString('vi-VN');
}

// ============================================
// KIỂM TRA KEY HẾT HẠN - TỰ ĐỘNG VĂNG APP
// ============================================

function checkKey() {
    let exp = localStorage.getItem(STORAGE_EXPIRE);
    if (exp && exp != 0) {
        if (Date.now() > Number(exp)) {
            // ⛔ KEY HẾT HẠN!
            terminalLog('⛔ KEY ĐÃ HẾT HẠN!', 'error');
            playErrorBeep();
            playSound('error');
            
            setTimeout(() => {
                alert('🔒 KEY HẾT HẠN! Vui lòng nhập KEY mới.');
            }, 300);
            
            // Xóa key khỏi localStorage
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(STORAGE_EXPIRE);
            
            // Reload về màn hình khóa
            setTimeout(() => {
                location.reload();
            }, 500);
        }
    }
}

// Chạy kiểm tra mỗi 1 giây
setInterval(checkKey, 1000);

// Cảnh báo khi key sắp hết hạn (còn 3 ngày)
setInterval(() => {
    let exp = localStorage.getItem(STORAGE_EXPIRE);
    if (exp && exp != 0) {
        const daysLeft = Math.ceil((Number(exp) - Date.now()) / (24 * 60 * 60 * 1000));
        if (daysLeft === 3) {
            terminalLog(`⚠️ CẢNH BÁO: KEY CÒN 3 NGÀY SỬ DỤNG!`, 'warning');
            playWarningBeep();
        } else if (daysLeft === 1) {
            terminalLog(`⚠️ CẢNH BÁO: KEY CÒN 1 NGÀY SỬ DỤNG!`, 'warning');
            playWarningBeep();
        }
    }
}, 60000);

// ============================================
// LOGIN
// ============================================

function loginKey() {
    const keyInput = document.getElementById('keyInput');
    const key = keyInput.value.trim();
    const msg = document.getElementById('lockMsg');
    
    playSound('click');
    
    if (!key || key.length < 10) {
        msg.innerHTML = '❌ KEY KHÔNG HỢP LỆ';
        msg.className = 'lock-msg error';
        keyInput.classList.add('error');
        playSound('error');
        setTimeout(() => keyInput.classList.remove('error'), 500);
        return;
    }
    
    if (!keyExists(key)) {
        msg.innerHTML = '🔄 ĐANG TÌM KEY TỪ BOT...';
        msg.className = 'lock-msg warning';
        
        syncKeys().then((success) => {
            if (success && keyExists(key)) {
                msg.innerHTML = '✅ KEY HỢP LỆ!';
                msg.className = 'lock-msg success';
                keyInput.classList.add('valid');
                playSound('success');
                setTimeout(() => keyInput.classList.remove('valid'), 500);
                processLogin(key);
            } else {
                msg.innerHTML = '❌ KEY KHÔNG TỒN TẠI! VUI LÒNG TẠO KEY TỪ BOT.';
                msg.className = 'lock-msg error';
                keyInput.classList.add('error');
                playSound('error');
                setTimeout(() => keyInput.classList.remove('error'), 500);
                terminalLog(`❌ Key "${key}" không tồn tại`, 'error');
            }
        });
        return;
    }
    
    msg.innerHTML = '✅ KEY HỢP LỆ!';
    msg.className = 'lock-msg success';
    keyInput.classList.add('valid');
    playSound('success');
    setTimeout(() => keyInput.classList.remove('valid'), 500);
    processLogin(key);
}

function processLogin(key) {
    const keyData = getKeyData(key);
    let time = 0;
    
    if (keyData) {
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
    openApp(key);
    
    playSuccessBeep();
    terminalLog(`✅ Đăng nhập thành công: ${key}`, 'success');
}

function openApp(key) {
    document.getElementById('lockScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    document.getElementById('currentKey').innerHTML = key;
    document.getElementById('keyBadge').innerHTML = '🔑 ' + key;
    document.getElementById('profileKey').innerHTML = key;
    updateKeyInfo();
}

// ============================================================
// UPDATE KEY INFO
// ============================================================
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

// ============================================================
// LOGOUT
// ============================================================
function logoutKey() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        playSound('click');
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_EXPIRE);
        currentKey = '';
        keyExpiry = null;
        setTimeout(() => {
            location.reload();
        }, 300);
    }
}

// ============================================================
// TAB
// ============================================================
function tab(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.nav-btn[data-tab="${id}"]`).classList.add('active');
    
    playSound('click');
}

// ============================================================
// TERMINAL
// ============================================================
function terminalLog(msg, type = 'info') {
    const output = document.getElementById('terminalOutput');
    if (!output) return;
    
    const colors = {
        success: '#00ff88',
        error: '#ff4757',
        warning: '#ffaa00',
        info: '#66ccff'
    };
    const prefix = {
        success: '✅ ',
        error: '❌ ',
        warning: '⚠️ ',
        info: 'ℹ️ '
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
        terminalLog('📖 DANH SÁCH LỆNH:', 'info');
        terminalLog('  help       - Trợ giúp', 'info');
        terminalLog('  status     - Trạng thái', 'info');
        terminalLog('  key list   - Danh sách key', 'info');
        terminalLog('  key info   - Thông tin key', 'info');
        terminalLog('  sync       - Đồng bộ với bot', 'info');
        terminalLog('  clear      - Xóa terminal', 'info');
        terminalLog('  sound      - Bật/tắt âm thanh', 'info');
        terminalLog('  logout     - Đăng xuất', 'info');
        return;
    }
    
    if (lower === 'sync') {
        syncKeys();
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
            terminalLog('⚠️ Chưa có key nào', 'warning');
            return;
        }
        terminalLog(`📋 DANH SÁCH KEY (${keys.length}):`, 'info');
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
        terminalLog(`🔑 KEY: ${currentKey}`, 'info');
        terminalLog(`📌 Loại: ${keyData?.type || 'Không xác định'}`, 'info');
        terminalLog(`⏳ Còn ${daysLeft} ngày`, daysLeft <= 3 ? 'warning' : 'success');
        return;
    }
    
    if (lower === 'sound') {
        soundEnabled = !soundEnabled;
        terminalLog(`🔊 Âm thanh: ${soundEnabled ? 'BẬT' : 'TẮT'}`, 'info');
        if (soundEnabled) playSound('success');
        return;
    }
    
    if (lower === 'logout') {
        logoutKey();
        return;
    }
    
    terminalLog(`❌ Không hiểu lệnh: ${cmd}`, 'error');
    playSound('error');
}

// ============================================================
// FUNC
// ============================================================
function loadFuncs() {
    const funcs = [
        { name: 'Auto Headshot', icon: 'fa-crosshairs' },
        { name: 'Wall Hack', icon: 'fa-eye' },
        { name: 'Speed Boost', icon: 'fa-forward' },
        { name: 'Aimbot Pro', icon: 'fa-bullseye' },
        { name: 'Skin Unlock', icon: 'fa-palette' },
        { name: 'AntiBan', icon: 'fa-shield' },
        { name: 'ESP', icon: 'fa-radar' },
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
        playSound('toggle');
        playBeep(1000, 80);
        setTimeout(() => playBeep(1300, 80), 80);
    } else {
        playSound('toggle');
        playBeep(800, 80);
        setTimeout(() => playBeep(600, 80), 80);
    }
}

// ============================================================
// BOOST
// ============================================================
function loadBoosts() {
    const boosts = [
        'CPU Turbo', 'RAM Cleaner', 'Network Optimizer',
        'GPU Overclock', 'FPS Booster', 'Latency Fix'
    ];
    
    const list = document.getElementById('boostList');
    list.innerHTML = boosts.map(b => `
        <div class="boost-item">
            <div class="boost-header">
                <span><i class="fas fa-bolt"></i> ${b}</span>
                <span class="boost-value" id="boost_${b.replace(/\s/g, '_')}_val">50%</span>
            </div>
            <input type="range" class="boost-slider" min="0" max="100" value="50"
                   oninput="onBoostChange(this, 'boost_${b.replace(/\s/g, '_')}_val')">
        </div>
    `).join('');
}

function onBoostChange(el, id) {
    const val = el.value;
    document.getElementById(id).textContent = val + '%';
    playBeep(400 + Math.floor(val / 2), 60);
}

// ============================================================
// MONITOR
// ============================================================
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
    setTimeout(() => {
        document.getElementById('consoleLog').textContent = '✅ RAM đã được dọn sạch!';
        document.getElementById('ram').textContent = '18%';
        document.getElementById('ramBar').style.width = '18%';
        playSound('success');
    }, 1500);
}

function clearConsole() {
    document.getElementById('consoleLog').textContent = '🧹 Console cleared...';
    playSound('click');
}

function resetSystem() {
    document.getElementById('consoleLog').textContent = '🔄 Đang reset hệ thống...';
    playSound('warning');
    setTimeout(() => {
        document.getElementById('consoleLog').textContent = '✅ Hệ thống đã được reset!';
        playSound('success');
    }, 1200);
}

// ============================================================
// GAME
// ============================================================
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

// ============================================================
// SETTINGS
// ============================================================
function changeColor(color, btn) {
    document.documentElement.style.setProperty('--primary', color);
    document.documentElement.style.setProperty('--primary-dark', color);
    document.documentElement.style.setProperty('--primary-glow', color + '44');
    document.documentElement.style.setProperty('--primary-glow-strong', color + '88');
    
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    
    playSound('click');
    playBeep(500, 100);
}

function toggleSetting(el) {
    const isChecked = el.checked;
    if (isChecked) {
        playSound('toggle');
        playBeep(1000, 60);
        setTimeout(() => playBeep(1300, 60), 60);
    } else {
        playSound('toggle');
        playBeep(800, 60);
        setTimeout(() => playBeep(600, 60), 60);
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
        document.documentElement.style.setProperty('--bg-card', 'rgba(10, 15, 25, 0.8)');
        document.documentElement.style.setProperty('--bg-input', 'rgba(0, 0, 0, 0.6)');
        document.documentElement.style.setProperty('--text', '#e8ecf1');
        document.documentElement.style.setProperty('--text-muted', '#7a8aaa');
        document.documentElement.style.setProperty('--text-dim', '#3a4a6a');
        document.documentElement.style.setProperty('--border', 'rgba(255, 255, 255, 0.06)');
    }
    
    playSound('toggle');
    playBeep(600, 150);
}

// ============================================================
// SOCIAL
// ============================================================
function openLink(type) {
    const links = {
        fb: 'https://facebook.com',
        zl: 'http://zalo.me/84822439761',
        tt: 'https://www.tiktok.com/@phucbanfile.lovetiktok',
        yt: 'https://youtube.com',
        github: 'https://github.com'
    };
    window.open(links[type] || '#', '_blank');
    playSound('click');
}

// ============================================================
// EXPOSE
// ============================================================
window.loginKey = loginKey;
window.logoutKey = logoutKey;
window.tab = tab;
window.execTerminal = execTerminal;
window.clearTerminal = clearTerminal;
window.syncKeys = syncKeys;
window.cleanRam = cleanRam;
window.clearConsole = clearConsole;
window.resetSystem = resetSystem;
window.openGame = openGame;
window.changeColor = changeColor;
window.toggleSetting = toggleSetting;
window.toggleDarkMode = toggleDarkMode;
window.openLink = openLink;
window.onBoostChange = onBoostChange;
window.toggleFunc = toggleFunc;

console.log('🚀 INFINITY HEAX V2 - ĐẦY ĐỦ ÂM THANH + HIỆU ỨNG');
console.log('📂 File JSON:', JSON_FILE);
console.log('🔄 Tự động đồng bộ mỗi 10 giây');
console.log('🎵 Đã bật âm thanh cho mọi thao tác');
console.log('✨ Hiệu ứng hình ảnh đã được kích hoạt');