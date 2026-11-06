/**
 * 林擎帥Qiunshuai Lin // Artist Blog, Drag-and-Drop Uploader & Portfolio
 * White & Iridescent Rainbow Liquid Glass Studio
 */

const DB_NAME = 'AetheriaLiquidGlassDB';
const DB_VERSION = 1;
const STORE_ITEMS = 'atelier_items';
const CUSTOM_CAT_STORAGE_KEY = 'AetheriaCustomCategories';
const OWNER_PWD_STORAGE_KEY = 'AetheriaOwnerPassword';
const OWNER_SESSION_KEY = 'AetheriaOwnerSession';
const ARTIST_EMAIL_STORAGE_KEY = 'ArtistReceivingEmail_v2';
const DEFAULT_OWNER_PWD = '0622';
const DEFAULT_ARTIST_EMAIL = 'linjinchuan7777@gmail.com';

const DEFAULT_CATEGORIES = [];

// Generate procedural SVG data URLs for crisp, offline-ready Liquid Glass Artworks
function createLiquidArtDataURI(variant = 1, label = '林擎帥Qiunshuai Lin') {
  const palettes = {
    1: ['#ff6b9d', '#ffa647', '#ffe866', '#5ce1e6', '#7b7fda'],
    2: ['#5ce1e6', '#7b7fda', '#e066ff', '#ff6b9d', '#ffffff'],
    3: ['#ffe866', '#ff6b9d', '#e066ff', '#5ce1e6', '#f4f8ff'],
    4: ['#7b7fda', '#5ce1e6', '#9fffe0', '#ffe866', '#ff85b3'],
    5: ['#ff85b3', '#ffc371', '#67e8f9', '#a78bfa', '#ffffff']
  };
  const c = palettes[variant] || palettes[1];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900">
    <defs>
      <linearGradient id="bg${variant}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="50%" stop-color="#f2f6ff"/>
        <stop offset="100%" stop-color="#fdf4ff"/>
      </linearGradient>
      <radialGradient id="orbA${variant}" cx="35%" cy="35%" r="55%">
        <stop offset="0%" stop-color="${c[0]}" stop-opacity="0.85"/>
        <stop offset="55%" stop-color="${c[1]}" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="${c[2]}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="orbB${variant}" cx="70%" cy="60%" r="55%">
        <stop offset="0%" stop-color="${c[3]}" stop-opacity="0.85"/>
        <stop offset="55%" stop-color="${c[4]}" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="glassShell${variant}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.88"/>
        <stop offset="45%" stop-color="#ffffff" stop-opacity="0.28"/>
        <stop offset="80%" stop-color="${c[3]}" stop-opacity="0.38"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.92"/>
      </linearGradient>
      <filter id="blur${variant}" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="45"/>
      </filter>
    </defs>
    <rect width="1200" height="900" fill="url(#bg${variant})"/>
    <circle cx="420" cy="340" r="360" fill="url(#orbA${variant})" filter="url(#blur${variant})"/>
    <circle cx="800" cy="540" r="390" fill="url(#orbB${variant})" filter="url(#blur${variant})"/>
    <path d="M290,460 C270,250 490,150 670,240 C860,330 960,260 930,480 C900,690 680,750 490,690 C310,630 310,670 290,460 Z"
          fill="url(#glassShell${variant})" stroke="#ffffff" stroke-width="4"/>
    <ellipse cx="480" cy="310" rx="140" ry="52" transform="rotate(-18 480 310)" fill="#ffffff" fill-opacity="0.65"/>
    <circle cx="730" cy="560" r="115" fill="url(#glassShell${variant})" stroke="#ffffff" stroke-width="2.5"/>
    <text x="64" y="836" font-family="Georgia, serif" font-size="24" fill="#4a536b" letter-spacing="4" opacity="0.75">${label}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const DEFAULT_ITEMS = [];

// ==========================================
// Application State
// ==========================================
const state = {
  items: [],
  customCategories: [],
  isOwner: false, // Default: Visitor Read-Only Mode
  currentView: 'all', // 'all' | 'portfolio' | 'blog' | 'studio'
  publishMode: 'blog', // 'blog' | 'portfolio'
  portfolioFilter: 'all',
  blogFilter: 'all',
  searchQuery: '',
  stagedFiles: [] // Files currently dragged/selected in the studio uploader
};

// ==========================================
// Artist Owner Authentication & Permissions
// ==========================================
function getOwnerPassword() {
  try {
    return localStorage.getItem(OWNER_PWD_STORAGE_KEY) || DEFAULT_OWNER_PWD;
  } catch {
    return DEFAULT_OWNER_PWD;
  }
}

function setOwnerPassword(newPwd) {
  try {
    localStorage.setItem(OWNER_PWD_STORAGE_KEY, newPwd);
  } catch (err) {
    console.warn('Unable to save password:', err);
  }
}

function getArtistEmail() {
  try {
    return localStorage.getItem(ARTIST_EMAIL_STORAGE_KEY) || DEFAULT_ARTIST_EMAIL;
  } catch {
    return DEFAULT_ARTIST_EMAIL;
  }
}

function setArtistEmail(newEmail) {
  try {
    localStorage.setItem(ARTIST_EMAIL_STORAGE_KEY, newEmail.trim());
  } catch (err) {
    console.warn('Unable to save artist email:', err);
  }
}

function hasCustomOwnerPassword() {
  try {
    return Boolean(localStorage.getItem(OWNER_PWD_STORAGE_KEY));
  } catch {
    return false;
  }
}

function loadOwnerSession() {
  try {
    return sessionStorage.getItem(OWNER_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveOwnerSession(isAuth) {
  try {
    if (isAuth) {
      sessionStorage.setItem(OWNER_SESSION_KEY, 'true');
    } else {
      sessionStorage.removeItem(OWNER_SESSION_KEY);
    }
  } catch (err) {
    console.warn('Session storage error:', err);
  }
}

function applyAuthPermissionsUI() {
  const isOwner = state.isOwner;

  // Toggle all .owner-only elements
  document.querySelectorAll('.owner-only').forEach((el) => {
    if (el.id === 'studio-section') {
      const shouldShowStudio = isOwner && (state.currentView === 'all' || state.currentView === 'studio');
      el.classList.toggle('hidden', !shouldShowStudio);
    } else {
      el.classList.toggle('hidden', !isOwner);
    }
  });

  // Toggle visitor CTA group
  const visitorCta = document.getElementById('visitor-cta-group');
  if (visitorCta) {
    visitorCta.classList.toggle('hidden', isOwner);
  }

  // Update Hero description & badge
  const heroDesc = document.getElementById('hero-description-text');
  const roleBadge = document.getElementById('role-mode-badge');
  const footerNote = document.getElementById('footer-mode-note');

  if (isOwner) {
    if (heroDesc) {
      heroDesc.textContent =
        '您目前已登入「藝術家創作者模式」。您可以隨時在下方拖移檔案快速上傳新作品、新增分類，或撰寫圖文並茂的藝術家誌。';
    }
    if (roleBadge) {
      roleBadge.textContent = 'CREATOR STUDIO // 藝術家管理模式已解鎖';
    }
    if (footerNote) {
      footerNote.textContent = '目前已解鎖藝術家創作者模式 · 點擊右上角「創作者模式 (登出)」可隨時切換回訪客唯讀視角';
    }
  } else {
    if (heroDesc) {
      heroDesc.textContent =
        '歡迎來到個人藝術創作空間。這裡收錄了數位流體雕塑、光學攝影與日常創作手記，邀請您細細瀏覽每一件作品與創作背後的故事。';
    }
    if (roleBadge) {
      roleBadge.textContent = 'VISUAL ARTIST & CREATIVE JOURNAL';
    }
    if (footerNote) {
      footerNote.textContent = '目前為訪客唯讀瀏覽模式 · 僅藝術家本人登入後可發佈與管理作品';
    }
  }

  // Update Navbar Auth Button
  const authBtn = document.getElementById('auth-toggle-btn');
  const authLabel = document.getElementById('auth-toggle-label');
  const authIcon = document.getElementById('auth-icon-lock');

  if (authBtn && authLabel && authIcon) {
    authBtn.classList.toggle('owner-active', isOwner);
    if (isOwner) {
      authLabel.textContent = '創作者模式 (登出)';
      authBtn.title = '點擊切換回訪客唯讀視角（登出）';
      authIcon.innerHTML = `
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
      `;
    } else {
      authLabel.textContent = '藝術家登入';
      authBtn.title = '藝術家本人登入以發佈作品與文章';
      authIcon.innerHTML = `
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      `;
    }
  }

  // If logged out while on 'studio' view, return to 'all' view
  if (!isOwner && state.currentView === 'studio') {
    switchView('all');
  }
}

function openAuthModal(mode = 'login') {
  const modal = document.getElementById('auth-modal');
  const loginForm = document.getElementById('artist-login-form');
  const changeForm = document.getElementById('change-pwd-form');
  const pwdInput = document.getElementById('artist-pwd-input');

  if (pwdInput) {
    pwdInput.placeholder = '請輸入藝術家通行密碼';
    pwdInput.value = '';
  }

  if (mode === 'change') {
    loginForm.classList.add('hidden');
    changeForm.classList.remove('hidden');
    document.getElementById('new-pwd-input').value = '';
    document.getElementById('confirm-pwd-input').value = '';
  } else {
    changeForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    if (mode === 'change') {
      document.getElementById('new-pwd-input').focus();
    } else {
      pwdInput.focus();
    }
  }, 60);
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

// ==========================================
// Category Persistence & Management
// ==========================================
function loadCustomCategories() {
  try {
    const raw = localStorage.getItem(CUSTOM_CAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustomCategories() {
  try {
    localStorage.setItem(CUSTOM_CAT_STORAGE_KEY, JSON.stringify(state.customCategories));
  } catch (err) {
    console.warn('Unable to save custom categories to localStorage:', err);
  }
  saveItemToDB({
    id: '__meta_custom_categories__',
    categories: [...state.customCategories]
  });
}

function getAllCategories() {
  const seen = new Set();
  const list = [];

  for (const d of DEFAULT_CATEGORIES) {
    if (d && d.value && !seen.has(d.value)) {
      seen.add(d.value);
      list.push(d);
    }
  }

  for (const c of state.customCategories) {
    const trimmed = String(c || '').trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      list.push({ value: trimmed, label: trimmed, isCustom: true });
    }
  }

  return list;
}

function renderCategoriesUI(selectedValue) {
  const selectEl = document.getElementById('post-category');
  const allCats = getAllCategories();
  const fallbackVal = allCats.length > 0 ? allCats[0].value : '一般創作';
  const currentVal = selectedValue || selectEl.value || fallbackVal;

  // 1. Populate <select id="post-category">
  const optionsHTML =
    allCats.length > 0
      ? allCats
          .map(
            (cat) =>
              `<option value="${escapeHTML(cat.value)}">${escapeHTML(cat.label)}</option>`
          )
          .join('')
      : `<option value="一般創作">一般創作（可於右側新增自訂分類）</option>`;

  selectEl.innerHTML =
    optionsHTML + `<option value="__ADD_NEW__">＋ 新增自訂分類類別...</option>`;

  if (allCats.some((c) => c.value === currentVal)) {
    selectEl.value = currentVal;
  } else {
    selectEl.value = fallbackVal;
  }

  // 2. Render Custom Categories management chips
  const customWrap = document.getElementById('custom-categories-wrap');
  const customList = document.getElementById('custom-categories-list');
  if (state.customCategories.length === 0) {
    customWrap.classList.add('hidden');
    customList.innerHTML = '';
  } else {
    customWrap.classList.remove('hidden');
    customList.innerHTML = state.customCategories
      .map(
        (cat, idx) => `
        <span class="custom-cat-chip" data-select-cat="${escapeHTML(cat)}" style="cursor:pointer;" title="點擊選取此分類">
          <span>${escapeHTML(cat)}</span>
          <button type="button" class="custom-cat-remove" data-remove-cat="${idx}" title="刪除此自訂分類">×</button>
        </span>
      `
      )
      .join('');
  }

  // 3. Populate Portfolio Filter Bar
  const portfolioFiltersEl = document.getElementById('portfolio-filters');
  portfolioFiltersEl.innerHTML =
    `<button class="filter-chip ${state.portfolioFilter === 'all' ? 'active' : ''}" data-filter="all">全部作品</button>` +
    allCats
      .map(
        (cat) => `
        <button class="filter-chip ${state.portfolioFilter === cat.value ? 'active' : ''}" data-filter="${escapeHTML(cat.value)}">
          ${escapeHTML(cat.value)}
        </button>
      `
      )
      .join('');

  // 4. Populate Blog Filter Bar
  const blogFiltersEl = document.getElementById('blog-filters');
  blogFiltersEl.innerHTML =
    `<button class="filter-chip ${state.blogFilter === 'all' ? 'active' : ''}" data-blog-filter="all">所有文章</button>` +
    allCats
      .map(
        (cat) => `
        <button class="filter-chip ${state.blogFilter === cat.value ? 'active' : ''}" data-blog-filter="${escapeHTML(cat.value)}">
          ${escapeHTML(cat.value)}
        </button>
      `
      )
      .join('');
}

function addNewCategory(rawName) {
  const parts = String(rawName || '')
    .split(/[,，]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    showToast('請先輸入要新增的分類類別名稱');
    document.getElementById('new-category-input').focus();
    return false;
  }

  let lastAdded = '';
  let addedCount = 0;

  for (const trimmed of parts) {
    const exists = state.customCategories.some(
      (c) => String(c).toLowerCase() === trimmed.toLowerCase()
    );
    if (!exists) {
      state.customCategories.push(trimmed);
      addedCount++;
    }
    lastAdded = trimmed;
  }

  saveCustomCategories();
  renderCategoriesUI(lastAdded);

  if (addedCount > 0) {
    showToast(`已成功新增分類標籤：「${parts.join('、')}」（目前共 ${state.customCategories.length} 個分類）`);
  } else {
    showToast(`分類「${lastAdded}」已經存在，已為您自動選取`);
  }
  return true;
}

// ==========================================
// IndexedDB Storage Helper
// ==========================================
function openDatabase() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_ITEMS)) {
        db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadAllItemsFromDB() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readonly');
      const store = tx.objectStore(STORE_ITEMS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB unavailable, using memory fallback:', err);
    return [];
  }
}

async function saveItemToDB(item) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readwrite');
      const store = tx.objectStore(STORE_ITEMS);
      store.put(item);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save item to IndexedDB:', err);
  }
}

async function deleteItemFromDB(id) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readwrite');
      const store = tx.objectStore(STORE_ITEMS);
      store.delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to delete item from IndexedDB:', err);
  }
}

async function clearAndSeedDB() {
  try {
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readwrite');
      const store = tx.objectStore(STORE_ITEMS);
      store.clear();
      for (const item of DEFAULT_ITEMS) {
        store.put(item);
      }
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Seed error:', err);
  }
}

// ==========================================
// Utility Functions
// ==========================================
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(isoStr) {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return isoStr;
  }
}

function escapeHTML(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Lightweight Markdown renderer for blog articles & artwork notes
function renderFormattedText(raw = '') {
  const safe = escapeHTML(raw);
  const lines = safe.split('\n');
  let html = '';
  let inList = false;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      continue;
    }

    let formatted = trimmed
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');

    if (formatted.startsWith('## ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h2>${formatted.slice(3)}</h2>`;
    } else if (formatted.startsWith('&gt; ')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<blockquote>${formatted.slice(5)}</blockquote>`;
    } else if (formatted.startsWith('- ') || formatted.startsWith('• ')) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${formatted.slice(2)}</li>`;
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<p>${formatted}</p>`;
    }
  }
  if (inList) html += '</ul>';
  return html;
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast-item liquid-glass-heavy';
  toast.innerHTML = `<span class="rainbow-pulse"></span><span>${escapeHTML(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 260);
  }, 3400);
}

// ==========================================
// File Reading & Drag-and-Drop Handling
// ==========================================
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl: reader.result
      });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function handleIncomingFiles(fileList, autoScrollToStudio = false) {
  if (!fileList || fileList.length === 0) return;
  const filesArray = Array.from(fileList);

  for (const file of filesArray) {
    try {
      const processed = await readFileAsDataURL(file);
      state.stagedFiles.push(processed);
    } catch (err) {
      console.error('Error reading file:', err);
    }
  }

  // In portfolio mode, auto-fill optional artwork title if empty
  const artworkTitleInput = document.getElementById('artwork-title');
  if (
    state.publishMode === 'portfolio' &&
    artworkTitleInput &&
    !artworkTitleInput.value.trim() &&
    state.stagedFiles.length > 0
  ) {
    const rawName = state.stagedFiles[0].name.replace(/\.[^/.]+$/, '');
    artworkTitleInput.value = rawName.replace(/[-_]/g, ' ');
  }

  renderStagedFilePreviews();
  showToast(`已載入 ${filesArray.length} 個檔案至創作工作台`);

  if (autoScrollToStudio) {
    const studioEl = document.getElementById('studio-section');
    if (studioEl) {
      studioEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

function renderStagedFilePreviews() {
  const wrap = document.getElementById('upload-preview-wrap');
  const list = document.getElementById('upload-preview-list');
  const countLabel = document.getElementById('preview-count-label');

  if (state.stagedFiles.length === 0) {
    wrap.classList.add('hidden');
    list.innerHTML = '';
    return;
  }

  wrap.classList.remove('hidden');
  countLabel.textContent = `已準備 ${state.stagedFiles.length} 個檔案（點擊右上角 × 可移除）`;

  list.innerHTML = state.stagedFiles
    .map((file, idx) => {
      let mediaPreview = '';
      if (file.type.startsWith('image/')) {
        mediaPreview = `<img src="${file.dataUrl}" alt="${escapeHTML(file.name)}" />`;
      } else if (file.type.startsWith('video/')) {
        mediaPreview = `<video src="${file.dataUrl}" muted playsinline></video>`;
      } else {
        const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
        mediaPreview = `<div class="preview-file-badge"><span>${escapeHTML(ext)}</span><small>${formatBytes(file.size)}</small></div>`;
      }

      return `
        <div class="preview-item">
          ${mediaPreview}
          <button type="button" class="preview-remove" data-remove-idx="${idx}" aria-label="移除檔案">×</button>
          <div class="preview-meta" title="${escapeHTML(file.name)}">${escapeHTML(file.name)}</div>
        </div>
      `;
    })
    .join('');
}

// ==========================================
// Rendering Portfolio & Blog Sections
// ==========================================
function updateCounters() {
  const portfolioItems = state.items.filter((i) => i.type === 'portfolio');
  const blogItems = state.items.filter((i) => i.type === 'blog');
  const totalMedia = state.items.reduce((acc, item) => acc + (item.files ? item.files.length : 0), 0);

  const navPortfolioCount = document.getElementById('nav-portfolio-count');
  const navBlogCount = document.getElementById('nav-blog-count');
  const statPortfolio = document.getElementById('stat-portfolio');
  const statBlog = document.getElementById('stat-blog');
  const statMedia = document.getElementById('stat-media');

  if (navPortfolioCount) navPortfolioCount.textContent = portfolioItems.length;
  if (navBlogCount) navBlogCount.textContent = blogItems.length;
  if (statPortfolio) statPortfolio.textContent = portfolioItems.length;
  if (statBlog) statBlog.textContent = blogItems.length;
  if (statMedia) statMedia.textContent = totalMedia;
}

function matchesSearch(item) {
  if (!state.searchQuery) return true;
  const q = state.searchQuery.toLowerCase();
  const inTitle = item.title?.toLowerCase().includes(q);
  const inContent = item.content?.toLowerCase().includes(q);
  const inCategory = item.category?.toLowerCase().includes(q);
  const inTags = (item.tags || []).some((t) => t.toLowerCase().includes(q));
  return inTitle || inContent || inCategory || inTags;
}

function renderPrimaryMediaThumb(item, fallbackIdx = 1) {
  const files = item.files || [];
  const altLabel = item.title || item.category || '林擎帥Qiunshuai Lin Creation';
  if (files.length === 0) {
    const uri = createLiquidArtDataURI((fallbackIdx % 5) + 1, item.category);
    return `<img src="${uri}" alt="${escapeHTML(altLabel)}" loading="lazy" />`;
  }
  const primary = files[0];
  if (primary.type.startsWith('image/')) {
    return `<img src="${primary.dataUrl}" alt="${escapeHTML(altLabel)}" loading="lazy" />`;
  }
  if (primary.type.startsWith('video/')) {
    return `<video src="${primary.dataUrl}" muted loop playsinline onmouseover="this.play()" onmouseout="this.pause()"></video>`;
  }
  const uri = createLiquidArtDataURI((fallbackIdx % 5) + 1, primary.name);
  return `<img src="${uri}" alt="${escapeHTML(altLabel)}" loading="lazy" />`;
}

function renderPortfolio() {
  const grid = document.getElementById('portfolio-grid');
  const filtered = state.items
    .filter((item) => item.type === 'portfolio')
    .filter((item) => state.portfolioFilter === 'all' || item.category === state.portfolioFilter)
    .filter(matchesSearch)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state liquid-glass">
        <h3>目前此分類尚無作品</h3>
        <p>您可以直接將圖片或作品檔拖移至視窗，或點擊上方「新增創作」上傳您的第一件作品。</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered
    .map((item, idx) => {
      const fileCount = item.files ? item.files.length : 0;
      const plainExcerpt = (item.content || '').replace(/[#>*`-]/g, '').trim();
      return `
        <article class="portfolio-card liquid-glass" data-open-id="${item.id}" tabindex="0" role="button" aria-label="查看作品詳情">
          <div class="portfolio-media-wrap">
            ${renderPrimaryMediaThumb(item, idx)}
            <span class="media-overlay-badge liquid-glass-pill">${escapeHTML(item.category)}</span>
            ${fileCount > 1 ? `<span class="media-count-badge liquid-glass-pill">+${fileCount} 檔案</span>` : ''}
          </div>
          <div class="portfolio-info">
            <div class="portfolio-meta-top">
              <span class="blog-category-pill">${escapeHTML(item.category)}</span>
              <span>${escapeHTML(item.year || formatDate(item.createdAt))}</span>
            </div>
            ${item.title ? `<h3 class="portfolio-title">${escapeHTML(item.title)}</h3>` : ''}
            <p class="portfolio-excerpt">${escapeHTML(plainExcerpt)}</p>
            <div class="tag-row">
              ${(item.tags || [])
                .slice(0, 4)
                .map((tag) => `<span class="tag-chip">#${escapeHTML(tag)}</span>`)
                .join('')}
            </div>
            <span class="portfolio-click-hint">點擊查看完整內文與作品 →</span>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderBlog() {
  const grid = document.getElementById('blog-grid');
  const filtered = state.items
    .filter((item) => item.type === 'blog')
    .filter((item) => state.blogFilter === 'all' || item.category === state.blogFilter)
    .filter(matchesSearch)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state liquid-glass">
        <h3>找不到符合條件的部落格文章</h3>
        <p>前往上方「創作發佈與拖移上傳工作台」撰寫您的最新創作日誌吧！</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered
    .map((item, idx) => {
      const plainSnippet = (item.content || '').replace(/[#>*`-]/g, '').trim();
      const charCount = (item.content || '').length;
      const readMin = Math.max(1, Math.round(charCount / 250));

      return `
        <article class="blog-card liquid-glass" data-open-id="${item.id}" tabindex="0">
          <div class="blog-cover">
            ${renderPrimaryMediaThumb(item, idx + 2)}
          </div>
          <div class="blog-body">
            <div class="blog-date-row">
              <span class="blog-category-pill">${escapeHTML(item.category)}</span>
              <span>${formatDate(item.createdAt)} · 約 ${readMin} 分鐘閱讀</span>
            </div>
            <p class="blog-snippet">${escapeHTML(plainSnippet)}</p>
            <div class="tag-row">
              ${(item.tags || [])
                .map((tag) => `<span class="tag-chip">#${escapeHTML(tag)}</span>`)
                .join('')}
            </div>
            <div class="blog-footer">
              <span class="read-more-link">閱讀完整日誌與附件 →</span>
              <span>${item.files?.length || 0} 個附件檔案</span>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderAll() {
  updateCounters();
  renderPortfolio();
  renderBlog();
}

// ==========================================
// Detail Modal (Lightbox & Full Blog Reader)
// ==========================================
function openDetailModal(id) {
  const item = state.items.find((i) => i.id === id);
  if (!item) return;

  const modal = document.getElementById('detail-modal');
  const body = document.getElementById('modal-body-content');

  const mediaGalleryHTML = (item.files || [])
    .map((file) => {
      if (file.type.startsWith('image/')) {
        return `<img src="${file.dataUrl}" alt="${escapeHTML(file.name)}" />`;
      }
      if (file.type.startsWith('video/')) {
        return `<video src="${file.dataUrl}" controls playsinline></video>`;
      }
      if (file.type.startsWith('audio/')) {
        return `
          <div class="liquid-glass-inset" style="padding:18px; border-radius:16px;">
            <p style="font-weight:600; margin-bottom:8px;">🎵 音訊檔案：${escapeHTML(file.name)}</p>
            <audio src="${file.dataUrl}" controls style="width:100%;"></audio>
          </div>
        `;
      }
      return `
        <div class="liquid-glass-inset" style="padding:16px 20px; border-radius:16px; display:flex; align-items:center; justify-content:space-between;">
          <div>
            <strong>📎 附件檔案：${escapeHTML(file.name)}</strong>
            <div style="font-size:0.8rem; color:#4a536b;">${formatBytes(file.size)}</div>
          </div>
          <a href="${file.dataUrl}" download="${escapeHTML(file.name)}" class="btn-glass">下載檔案</a>
        </div>
      `;
    })
    .join('');

  const showPortfolioTitle = item.type === 'portfolio' && item.title;

  body.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; flex-wrap:wrap;">
      <span class="blog-category-pill">${item.type === 'portfolio' ? '作品集項目' : '藝術家日誌'} · ${escapeHTML(item.category)}</span>
      <span style="font-size:0.85rem; color:#76819d;">發佈於 ${formatDate(item.createdAt)}</span>
      ${item.type === 'portfolio' && item.medium ? `<span style="font-size:0.85rem; color:#4a536b;">｜媒材：${escapeHTML(item.medium)}</span>` : ''}
    </div>
    ${
      showPortfolioTitle
        ? `<h2 id="modal-title" style="font-family:'Playfair Display', 'Noto Sans TC', serif; font-size:clamp(1.5rem, 2.5vw, 2.2rem); line-height:1.3;">${escapeHTML(item.title)}</h2>`
        : `<span id="modal-title" class="hidden">${escapeHTML(item.category)}</span>`
    }
    <div class="modal-media-gallery">
      ${mediaGalleryHTML}
    </div>
    <div class="modal-article-content">
      ${renderFormattedText(item.content)}
    </div>
    <div class="tag-row" style="margin-top:22px;">
      ${(item.tags || []).map((t) => `<span class="tag-chip">#${escapeHTML(t)}</span>`).join('')}
    </div>
    <div class="modal-actions-bar">
      ${
        state.isOwner
          ? `<button type="button" class="btn-danger-glass" data-delete-id="${item.id}">刪除此項目</button>`
          : `<span style="font-size:0.8rem; color:#76819d;">訪客唯讀檢視模式</span>`
      }
      <button type="button" class="btn-glass" id="modal-bottom-close">關閉視窗</button>
    </div>
  `;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
  const modal = document.getElementById('detail-modal');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

// ==========================================
// View Switching & Studio Mode Switching
// ==========================================
function setPublishMode(mode) {
  state.publishMode = mode;
  document.querySelectorAll('.mode-tab').forEach((btn) => {
    const active = btn.dataset.publishMode === mode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  const extraFields = document.getElementById('portfolio-extra-fields');
  const submitText = document.getElementById('submit-btn-text');

  if (mode === 'portfolio') {
    extraFields.classList.remove('hidden');
    submitText.textContent = '上傳並收錄至作品集';
  } else {
    extraFields.classList.add('hidden');
    submitText.textContent = '立即發佈部落格文章';
  }
}

function switchView(view) {
  if (view === 'studio' && !state.isOwner) {
    openAuthModal('login');
    return;
  }

  state.currentView = view;
  document.querySelectorAll('.nav-pill').forEach((pill) => {
    pill.classList.toggle('active', pill.dataset.view === view);
  });

  const heroSec = document.getElementById('hero-section');
  const studioSec = document.getElementById('studio-section');
  const portfolioSec = document.getElementById('portfolio-section');
  const blogSec = document.getElementById('blog-section');
  const contactSec = document.getElementById('contact-section');

  if (heroSec) heroSec.classList.toggle('hidden', view !== 'all');
  studioSec.classList.toggle('hidden', !state.isOwner || (view !== 'all' && view !== 'studio'));
  portfolioSec.classList.toggle('hidden', view !== 'all' && view !== 'portfolio');
  blogSec.classList.toggle('hidden', view !== 'all' && view !== 'blog');
  if (contactSec) contactSec.classList.toggle('hidden', view !== 'all' && view !== 'contact');

  document.getElementById('nav-links').classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// Initialization & Event Listeners
// ==========================================
async function initApp() {
  state.isOwner = loadOwnerSession();
  state.customCategories = loadCustomCategories();
  renderCategoriesUI();
  applyAuthPermissionsUI();

  let stored = await loadAllItemsFromDB();
  let dbCustomCats = [];
  if (stored && stored.length > 0) {
    const metaCatRecord = stored.find((item) => item.id === '__meta_custom_categories__');
    if (metaCatRecord && Array.isArray(metaCatRecord.categories)) {
      dbCustomCats = metaCatRecord.categories;
    }

    // Automatically remove any legacy demo items while keeping user-uploaded items
    const demoItems = stored.filter((item) => String(item.id).startsWith('demo-'));
    for (const d of demoItems) {
      await deleteItemFromDB(d.id);
    }
    stored = stored.filter(
      (item) => !String(item.id).startsWith('demo-') && item.id !== '__meta_custom_categories__'
    );
  } else {
    stored = [];
  }
  state.items = stored;

  // Merge customCategories from localStorage, IndexedDB, and existing items
  const mergedCats = new Set([...state.customCategories, ...dbCustomCats]);
  for (const item of state.items) {
    const c = String(item?.category || '').trim();
    if (c && c !== '一般創作') {
      mergedCats.add(c);
    }
  }
  state.customCategories = Array.from(mergedCats);
  saveCustomCategories();
  renderCategoriesUI();
  renderAll();

  // Artist Authentication Controls
  const authToggleBtn = document.getElementById('auth-toggle-btn');
  const authModalClose = document.getElementById('auth-modal-close');
  const authCancelBtn = document.getElementById('auth-cancel-btn');
  const loginForm = document.getElementById('artist-login-form');
  const openChangePwdBtn = document.getElementById('open-change-pwd-btn');
  const changePwdForm = document.getElementById('change-pwd-form');
  const changePwdCancelBtn = document.getElementById('change-pwd-cancel-btn');

  authToggleBtn.addEventListener('click', () => {
    if (state.isOwner) {
      state.isOwner = false;
      saveOwnerSession(false);
      applyAuthPermissionsUI();
      showToast('已登出並切換為「訪客唯讀瀏覽模式」');
    } else {
      openAuthModal('login');
    }
  });

  authModalClose.addEventListener('click', closeAuthModal);
  authCancelBtn.addEventListener('click', closeAuthModal);
  changePwdCancelBtn.addEventListener('click', closeAuthModal);

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const entered = document.getElementById('artist-pwd-input').value;
    if (entered === getOwnerPassword()) {
      state.isOwner = true;
      saveOwnerSession(true);
      applyAuthPermissionsUI();
      closeAuthModal();
      showToast('歡迎回來！已解鎖「藝術家創作者模式」，可隨時發佈作品與文章');
      document.getElementById('studio-section').scrollIntoView({ behavior: 'smooth' });
    } else {
      showToast('密碼錯誤，請重新輸入藝術家通行密碼');
      document.getElementById('artist-pwd-input').select();
    }
  });

  openChangePwdBtn.addEventListener('click', () => {
    if (!state.isOwner) return;
    openAuthModal('change');
  });

  changePwdForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newPwd = document.getElementById('new-pwd-input').value.trim();
    const confirmPwd = document.getElementById('confirm-pwd-input').value.trim();

    if (newPwd.length < 4) {
      showToast('新密碼長度請至少設定 4 個字元');
      return;
    }
    if (newPwd !== confirmPwd) {
      showToast('兩次輸入的新密碼不一致，請重新確認');
      return;
    }

    setOwnerPassword(newPwd);
    closeAuthModal();
    showToast('已成功更新您的藝術家通行密碼！');
  });

  // Visitor Hero Scroll Buttons
  document.querySelectorAll('[data-scroll-to]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.scrollTo);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Category Addition Controls (Owner Only)
  const newCatInput = document.getElementById('new-category-input');
  const addCatBtn = document.getElementById('add-category-btn');
  const categorySelect = document.getElementById('post-category');

  addCatBtn.addEventListener('click', () => {
    if (!state.isOwner) return;
    if (addNewCategory(newCatInput.value)) {
      newCatInput.value = '';
    }
  });

  newCatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!state.isOwner) return;
      if (addNewCategory(newCatInput.value)) {
        newCatInput.value = '';
      }
    }
  });

  categorySelect.addEventListener('change', (e) => {
    if (e.target.value === '__ADD_NEW__') {
      const allCats = getAllCategories();
      categorySelect.value = allCats.length > 0 ? allCats[0].value : '一般創作';
      newCatInput.focus();
      showToast('請在右側「新增自訂分類類別」欄位輸入新名稱並點擊新增');
    }
  });

  // Select or Delete Custom Category Chip (Owner Only)
  document.getElementById('custom-categories-list').addEventListener('click', (e) => {
    if (!state.isOwner) return;
    const removeBtn = e.target.closest('[data-remove-cat]');
    if (removeBtn) {
      const idx = Number(removeBtn.dataset.removeCat);
      const removedName = state.customCategories[idx];
      if (!window.confirm(`確定要刪除分類標籤「${removedName}」嗎？`)) {
        return;
      }
      state.customCategories.splice(idx, 1);
      saveCustomCategories();
      if (state.portfolioFilter === removedName) state.portfolioFilter = 'all';
      if (state.blogFilter === removedName) state.blogFilter = 'all';
      renderCategoriesUI();
      renderAll();
      showToast(`已移除自訂分類：「${removedName}」`);
      return;
    }

    const chip = e.target.closest('[data-select-cat]');
    if (chip) {
      const catName = chip.dataset.selectCat;
      renderCategoriesUI(catName);
      showToast(`已切換選取分類：「${catName}」`);
    }
  });

  // Navigation View Buttons
  document.querySelectorAll('[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Mobile Menu Toggle
  document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    document.getElementById('nav-links').classList.toggle('open');
  });

  // Quick CTA buttons to Studio
  document.getElementById('open-quick-publish').addEventListener('click', () => {
    if (!state.isOwner) {
      openAuthModal('login');
      return;
    }
    switchView('all');
    document.getElementById('studio-section').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('post-content').focus();
  });

  document.querySelectorAll('[data-goto-studio]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!state.isOwner) {
        openAuthModal('login');
        return;
      }
      const targetMode = btn.dataset.gotoStudio;
      setPublishMode(targetMode);
      document.getElementById('studio-section').scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Studio Mode Switch Tabs
  document.querySelectorAll('.mode-tab').forEach((tab) => {
    tab.addEventListener('click', () => setPublishMode(tab.dataset.publishMode));
  });

  // Drop Zone & File Input
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const heroDropZone = document.getElementById('hero-drop-zone');

  dropZone.addEventListener('click', () => {
    if (!state.isOwner) return;
    fileInput.click();
  });
  dropZone.addEventListener('keydown', (e) => {
    if (!state.isOwner) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  if (heroDropZone) {
    heroDropZone.addEventListener('click', () => {
      if (!state.isOwner) return;
      setPublishMode('portfolio');
      document.getElementById('studio-section').scrollIntoView({ behavior: 'smooth' });
      fileInput.click();
    });
  }

  fileInput.addEventListener('change', (e) => {
    if (!state.isOwner) return;
    handleIncomingFiles(e.target.files, false);
    fileInput.value = '';
  });

  ['dragenter', 'dragover'].forEach((evt) => {
    dropZone.addEventListener(evt, (e) => {
      if (!state.isOwner) return;
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach((evt) => {
    dropZone.addEventListener(evt, (e) => {
      if (!state.isOwner) return;
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    if (!state.isOwner) return;
    const dtFiles = e.dataTransfer?.files;
    if (dtFiles?.length) {
      handleIncomingFiles(dtFiles, false);
    }
  });

  // Global Window Drag-and-Drop Overlay (Owner Only)
  const globalOverlay = document.getElementById('global-drop-overlay');
  let dragDepth = 0;

  window.addEventListener('dragenter', (e) => {
    if (!state.isOwner) return;
    if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) {
      dragDepth++;
      globalOverlay.classList.remove('hidden');
    }
  });

  window.addEventListener('dragover', (e) => {
    if (!state.isOwner) return;
    if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) {
      e.preventDefault();
    }
  });

  window.addEventListener('dragleave', () => {
    if (!state.isOwner) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) {
      globalOverlay.classList.add('hidden');
    }
  });

  window.addEventListener('drop', (e) => {
    if (!state.isOwner) return;
    dragDepth = 0;
    globalOverlay.classList.add('hidden');
    if (e.dataTransfer?.files?.length) {
      e.preventDefault();
      handleIncomingFiles(e.dataTransfer.files, true);
    }
  });

  // Remove single staged file or clear all
  document.getElementById('upload-preview-list').addEventListener('click', (e) => {
    if (!state.isOwner) return;
    const removeBtn = e.target.closest('[data-remove-idx]');
    if (removeBtn) {
      const idx = Number(removeBtn.dataset.removeIdx);
      state.stagedFiles.splice(idx, 1);
      renderStagedFilePreviews();
    }
  });

  document.getElementById('clear-files-btn').addEventListener('click', () => {
    if (!state.isOwner) return;
    state.stagedFiles = [];
    renderStagedFilePreviews();
  });

  // Formatting Toolbar
  document.querySelectorAll('[data-fmt]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!state.isOwner) return;
      const textarea = document.getElementById('post-content');
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.slice(start, end) || '文字內容';
      const fmt = btn.dataset.fmt;

      let replacement = selected;
      if (fmt === 'bold') replacement = `**${selected}**`;
      if (fmt === 'italic') replacement = `*${selected}*`;
      if (fmt === 'heading') replacement = `\n## ${selected}\n`;
      if (fmt === 'quote') replacement = `\n> ${selected}\n`;
      if (fmt === 'list') replacement = `\n- ${selected}\n`;

      textarea.setRangeText(replacement, start, end, 'end');
      textarea.focus();
    });
  });

  // Publish Form Submission (Owner Only)
  document.getElementById('publish-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.isOwner) {
      openAuthModal('login');
      return;
    }

    const categoryEl = document.getElementById('post-category');
    const newCatEl = document.getElementById('new-category-input');
    if (newCatEl && newCatEl.value.trim()) {
      addNewCategory(newCatEl.value.trim());
      newCatEl.value = '';
    }
    const contentEl = document.getElementById('post-content');
    const tagsEl = document.getElementById('post-tags');
    const artworkTitleEl = document.getElementById('artwork-title');
    const mediumEl = document.getElementById('artwork-medium');
    const yearEl = document.getElementById('artwork-year');
    const syncBoth = document.getElementById('sync-both-check').checked;

    const content = contentEl.value.trim();
    const artworkTitle = artworkTitleEl ? artworkTitleEl.value.trim() : '';

    if (!content && state.stagedFiles.length === 0) {
      showToast('請輸入內文敘述或拖移至少一個檔案後再發佈');
      contentEl.focus();
      return;
    }

    const tags = tagsEl.value
      .split(/[,，\s#]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const filesToSave =
      state.stagedFiles.length > 0
        ? [...state.stagedFiles]
        : [
            {
              name: 'generated-liquid-prism.svg',
              type: 'image/svg+xml',
              size: 180000,
              dataUrl: createLiquidArtDataURI((state.items.length % 5) + 1, categoryEl.value)
            }
          ];

    const nowIso = new Date().toISOString();
    const baseItem = {
      id: `item-${Date.now()}`,
      type: state.publishMode,
      title: state.publishMode === 'portfolio' ? artworkTitle : '',
      category: categoryEl.value,
      medium: mediumEl.value.trim() || '數位光學與流體媒材',
      year: yearEl.value.trim() || '2026',
      createdAt: nowIso,
      tags: tags.length ? tags : ['LiquidGlass', '2026創作'],
      content: content || '透過拖移工作台快速發佈的視覺創作紀錄。',
      files: filesToSave
    };

    state.items.unshift(baseItem);
    await saveItemToDB(baseItem);

    if (syncBoth) {
      const twinType = state.publishMode === 'blog' ? 'portfolio' : 'blog';
      const twinItem = {
        ...baseItem,
        id: `item-${Date.now()}-twin`,
        type: twinType,
        title: twinType === 'portfolio' ? artworkTitle : ''
      };
      state.items.unshift(twinItem);
      await saveItemToDB(twinItem);
    }

    // Reset form
    if (artworkTitleEl) artworkTitleEl.value = '';
    contentEl.value = '';
    tagsEl.value = '';
    mediumEl.value = '';
    document.getElementById('sync-both-check').checked = false;
    state.stagedFiles = [];
    renderStagedFilePreviews();
    renderAll();

    showToast(syncBoth ? '已同時發佈至作品集與藝術家部落格！' : '創作已成功發佈並保存！');

    const targetScroll =
      state.publishMode === 'portfolio'
        ? document.getElementById('portfolio-section')
        : document.getElementById('blog-section');
    targetScroll.scrollIntoView({ behavior: 'smooth' });
  });

  // Portfolio & Blog Filter Chips
  document.getElementById('portfolio-filters').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-filter]');
    if (!chip) return;
    state.portfolioFilter = chip.dataset.filter;
    document.querySelectorAll('#portfolio-filters .filter-chip').forEach((c) => {
      c.classList.toggle('active', c === chip);
    });
    renderPortfolio();
  });

  document.getElementById('blog-filters').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-blog-filter]');
    if (!chip) return;
    state.blogFilter = chip.dataset.blogFilter;
    document.querySelectorAll('#blog-filters .filter-chip').forEach((c) => {
      c.classList.toggle('active', c === chip);
    });
    renderBlog();
  });

  // Global Search
  document.getElementById('global-search').addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    renderPortfolio();
    renderBlog();
  });

  // Open Detail Modal on Card Click
  document.addEventListener('click', async (e) => {
    const card = e.target.closest('[data-open-id]');
    if (card) {
      openDetailModal(card.dataset.openId);
      return;
    }

    const deleteBtn = e.target.closest('[data-delete-id]');
    if (deleteBtn) {
      if (!state.isOwner) return;
      const id = deleteBtn.dataset.deleteId;
      state.items = state.items.filter((i) => i.id !== id);
      await deleteItemFromDB(id);
      closeDetailModal();
      renderAll();
      showToast('已刪除該筆創作紀錄');
      return;
    }

    if (e.target.id === 'modal-bottom-close' || e.target.id === 'detail-modal') {
      closeDetailModal();
    }
    if (e.target.id === 'auth-modal') {
      closeAuthModal();
    }
  });

  document.getElementById('modal-close-btn').addEventListener('click', closeDetailModal);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDetailModal();
      closeAuthModal();
    }
  });

  // Reset Demo Data Button (Owner Only)
  document.getElementById('reset-demo-btn').addEventListener('click', async () => {
    if (!state.isOwner) return;
    await clearAndSeedDB();
    state.items = [...DEFAULT_ITEMS];
    state.portfolioFilter = 'all';
    state.blogFilter = 'all';
    state.searchQuery = '';
    document.getElementById('global-search').value = '';
    renderAll();
    showToast('已還原預設虹彩玻璃示範作品與部落格文章');
  });

  // Artist Receiving Email Config & Visitor Contact Form
  const artistEmailInput = document.getElementById('artist-receiving-email-input');
  const saveArtistEmailBtn = document.getElementById('save-artist-email-btn');
  const contactForm = document.getElementById('contact-form');
  const clearInboxBtn = document.getElementById('clear-inbox-btn');

  function loadVisitorMessages() {
    try {
      const raw = localStorage.getItem('ArtistVisitorMessages');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveVisitorMessage(msgObj) {
    try {
      const list = loadVisitorMessages();
      list.unshift(msgObj);
      localStorage.setItem('ArtistVisitorMessages', JSON.stringify(list));
    } catch (err) {
      console.warn('Unable to save visitor message:', err);
    }
  }

  function renderOwnerInbox() {
    const listEl = document.getElementById('owner-inbox-list');
    if (!listEl) return;
    const msgs = loadVisitorMessages();
    if (msgs.length === 0) {
      listEl.innerHTML = `<p style="font-size:0.84rem; color:#76819d;">目前尚無訪客提問紀錄。</p>`;
      return;
    }
    listEl.innerHTML = msgs
      .map(
        (m) => `
        <div class="inbox-msg-card">
          <div class="inbox-msg-header">
            <strong>👤 稱謂：${escapeHTML(m.salutation)}（<a href="mailto:${escapeHTML(m.visitorEmail)}">${escapeHTML(m.visitorEmail)}</a>）</strong>
            <span style="color:#76819d; font-size:0.78rem;">${formatDate(m.createdAt)}</span>
          </div>
          <p style="font-size:0.9rem; white-space:pre-wrap; color:#141824;">${escapeHTML(m.message)}</p>
        </div>
      `
      )
      .join('');
  }

  renderOwnerInbox();

  if (clearInboxBtn) {
    clearInboxBtn.addEventListener('click', () => {
      if (!state.isOwner) return;
      localStorage.removeItem('ArtistVisitorMessages');
      renderOwnerInbox();
      showToast('已清空訪客提問紀錄');
    });
  }

  if (artistEmailInput) {
    artistEmailInput.value = getArtistEmail();
  }

  if (saveArtistEmailBtn && artistEmailInput) {
    saveArtistEmailBtn.addEventListener('click', () => {
      if (!state.isOwner) return;
      const val = artistEmailInput.value.trim();
      if (!val || !val.includes('@')) {
        showToast('請輸入有效的電子郵件信箱格式');
        artistEmailInput.focus();
        return;
      }
      setArtistEmail(val);
      showToast(`已將接收信箱更新為：${val}`);
    });
  }

  function openGmailOrMailto(targetEmail, salutation, visitorEmail, message) {
    const subject = encodeURIComponent(`【網站訪客提問】來自 ${salutation} 的訊息 — 林擎帥Qiunshuai Lin`);
    const body = encodeURIComponent(
      `稱謂：${salutation}\n訪客信箱：${visitorEmail}\n\n內文：\n${message}`
    );
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  }

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const salutationEl = document.getElementById('contact-salutation');
      const visitorEmailEl = document.getElementById('contact-visitor-email');
      const messageEl = document.getElementById('contact-message');
      const submitBtn = document.getElementById('contact-submit-btn');
      const submitText = document.getElementById('contact-submit-text');
      const successBanner = document.getElementById('contact-success-banner');
      const successText = document.getElementById('contact-success-text');

      const salutation = salutationEl.value.trim();
      const visitorEmail = visitorEmailEl.value.trim();
      const message = messageEl.value.trim();

      if (!salutation) {
        showToast('請輸入您的稱謂');
        salutationEl.focus();
        return;
      }
      if (!visitorEmail || !visitorEmail.includes('@')) {
        showToast('請輸入有效的訪客信箱，以便藝術家回覆您');
        visitorEmailEl.focus();
        return;
      }
      if (!message) {
        showToast('請輸入您想詢問的內文');
        messageEl.focus();
        return;
      }

      const targetEmail = getArtistEmail();

      // 1. Save immediately to built-in website inbox
      saveVisitorMessage({
        salutation,
        visitorEmail,
        message,
        createdAt: new Date().toISOString()
      });
      renderOwnerInbox();

      // 2. Open Gmail compose pre-filled with recipient linjinchuan7777@gmail.com, subject, and body
      openGmailOrMailto(targetEmail, salutation, visitorEmail, message);

      contactForm.reset();

      if (successBanner && successText) {
        successText.textContent = `✅ 感謝 ${salutation}！已為您開啟 Gmail 寄信視窗並自動填好收件人 (${targetEmail}) 與您的問題內容，點擊「傳送」即可寄達藝術家信箱！`;
        successBanner.classList.remove('hidden');
      }
      showToast(`✅ 已成功記錄問題並開啟 Gmail 傳送視窗！`);
    });
  }
}

document.addEventListener('DOMContentLoaded', initApp);
