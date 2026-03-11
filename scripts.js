// ── Theme ──
function toggleTheme() {
  const html = document.documentElement;
  // Instant theme change — no animation (design quality principle)
  html.classList.add('no-transition');
  const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  localStorage.setItem('te-theme', next);
  buildTintPicker();
  const activeTint = localStorage.getItem('te-tint');
  if (activeTint) setTint(activeTint);
  resolveAll();
  // Re-enable transitions after repaint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      html.classList.remove('no-transition');
    });
  });
}

// ── Tint Picker ──
const tintPresets = [
  { name: 'Orange',  light: '#E86420', dark: '#F07030' },
  { name: 'Coral',   light: '#E05248', dark: '#F06060' },
  { name: 'Indigo',  light: '#5856D6', dark: '#7B79FF' },
  { name: 'Teal',    light: '#2CA898', dark: '#38C8B8' },
  { name: 'Amber',   light: '#CC8510', dark: '#E8A028' },
  { name: 'Cobalt',  light: '#1868D8', dark: '#4890FF' },
];

function buildTintPicker() {
  const container = document.getElementById('tint-picker');
  const activeName = localStorage.getItem('te-tint') || 'Orange';
  const isLight = document.documentElement.getAttribute('data-theme') !== 'dark';
  container.innerHTML = '';
  tintPresets.forEach(p => {
    const dot = document.createElement('div');
    dot.className = 'tint-dot' + (p.name === activeName ? ' active' : '');
    dot.style.background = isLight ? p.light : p.dark;
    dot.title = p.name;
    dot.tabIndex = 0;
    dot.setAttribute('role', 'button');
    dot.setAttribute('aria-label', p.name + ' tint');
    dot.onclick = () => setTint(p.name);
    container.appendChild(dot);
  });
}

function setTint(name) {
  const preset = tintPresets.find(p => p.name === name);
  if (!preset) return;
  const root = document.documentElement;
  const isLight = root.getAttribute('data-theme') !== 'dark';
  const color = isLight ? preset.light : preset.dark;
  root.style.setProperty('--tint', color);
  // Update selection token to match
  const rgb = hexToRgb(color);
  root.style.setProperty('--selection', `rgba(${rgb}, ${isLight ? '0.14' : '0.18'})`);
  localStorage.setItem('te-tint', name);
  // Update dots
  document.querySelectorAll('.tint-dot').forEach((d, i) => {
    d.classList.toggle('active', tintPresets[i].name === name);
  });
  resolveAll();
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

// Restore saved theme & tint
const saved = localStorage.getItem('te-theme');
if (saved) document.documentElement.setAttribute('data-theme', saved);
buildTintPicker();
const savedTint = localStorage.getItem('te-tint');
if (savedTint) setTint(savedTint);

// ── Resolve CSS var to readable value ──
function resolveVar(name) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (raw.startsWith('rgba')) return raw;
  if (raw.startsWith('rgb')) return rgbToHex(raw);
  return raw.toUpperCase();
}

function rgbToHex(rgb) {
  const [r, g, b] = rgb.match(/\d+/g).map(Number);
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function resolveAll() {
  document.querySelectorAll('[data-resolve]').forEach(el => {
    el.textContent = resolveVar(el.getAttribute('data-resolve'));
  });
}

// ── Copy to clipboard ──
function copyColor(el, varName) {
  const val = resolveVar(varName);
  navigator.clipboard.writeText(val).then(() => showToast(val));
}

function showToast(val) {
  const t = document.getElementById('toast');
  t.textContent = 'Copied ' + val;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 1500);
}

// ── Build all-tokens table ──
const allTokens = [
  { section: 'Backgrounds — Base', tokens: ['--systemBackground', '--secondarySystemBackground', '--tertiarySystemBackground'] },
  { section: 'Backgrounds — Elevated', tokens: ['--systemBackgroundElevated', '--secondarySystemBackgroundElevated', '--tertiarySystemBackgroundElevated'] },
  { section: 'Backgrounds — Grouped', tokens: ['--systemGroupedBackground', '--secondarySystemGroupedBackground', '--tertiarySystemGroupedBackground'] },
  { section: 'Backgrounds — Grouped Elevated', tokens: ['--systemGroupedBackgroundElevated', '--secondarySystemGroupedBackgroundElevated', '--tertiarySystemGroupedBackgroundElevated'] },
  { section: 'Labels', tokens: ['--label', '--secondaryLabel', '--tertiaryLabel', '--quaternaryLabel'] },
  { section: 'Fills', tokens: ['--systemFill', '--secondarySystemFill', '--tertiarySystemFill', '--quaternarySystemFill'] },
  { section: 'System Colors', tokens: ['--systemRed', '--systemOrange', '--systemYellow', '--systemGreen', '--systemBlue', '--systemPink'] },
  { section: 'Grays', tokens: ['--systemGray', '--systemGray2', '--systemGray3', '--systemGray4', '--systemGray5', '--systemGray6'] },
  { section: 'Tint', tokens: ['--tint'] },
  { section: 'Tint Alternatives', tokens: ['--tintOrange', '--tintCoral', '--tintIndigo', '--tintTeal', '--tintAmber', '--tintCobalt'] },
  { section: 'Semantic', tokens: ['--link', '--destructive', '--success', '--warning', '--disabled', '--disabledLabel', '--selection', '--badge', '--skeleton'] },
  { section: 'On-Colors', tokens: ['--onLight', '--onDark'] },
  { section: 'Border & Separators', tokens: ['--border', '--separator', '--opaqueSeparator'] },
  { section: 'Dot Pattern', tokens: ['--dotIdle', '--dotTap', '--dotField'] },
  { section: 'Shadows', tokens: ['--shadowSmall', '--shadowMedium', '--shadowLarge'] },
  { section: 'Spacing', tokens: ['--space2', '--space4', '--space8', '--space12', '--space16', '--space24', '--space32', '--space48', '--space64'] },
  { section: 'Radius', tokens: ['--radius6', '--radius10', '--radius14', '--radius20', '--radius24', '--radiusFull'] },
  { section: 'Motion', tokens: ['--easeFluent', '--easeSpring', '--easeStandard'] },
  { section: 'Glass', tokens: ['--glassSpecular', '--glassSpecularEdge', '--glassHighlight', '--glassShadow', '--glassCardBg', '--glassCardBorder', '--glassFrostedBg', '--glassFrostedBorder'] },
  { section: 'Typography', tokens: ['--fontDisplay', '--fontBody', '--fontMono'] },
  { section: 'Type Scale', tokens: ['--typeXlTitle2', '--typeXlTitle', '--typeLargeTitle', '--typeTitle1', '--typeTitle2', '--typeTitle3', '--typeHeadline', '--typeBody', '--typeCallout', '--typeSubheadline', '--typeFootnote', '--typeCaption1', '--typeCaption2', '--typeCode', '--typeOverline'] },
  { section: 'Text Shadow', tokens: ['--textShadowOnFill'] },
  { section: 'Layout', tokens: ['--containerMaxWidth', '--headerHeight'] },
  { section: 'Dot Grid', tokens: ['--dotGridSize', '--dotGridOffset', '--dotRadius'] },
  { section: 'Chat', tokens: ['--chatBubbleRadius', '--chatTailRadius', '--chatCapsuleRadius', '--chatBubbleUserBackground', '--chatBubbleUserText'] },
];

function buildTable() {
  const container = document.getElementById('token-table');
  let html = '';
  allTokens.forEach(group => {
    group.tokens.forEach((token, i) => {
      const isNonColor = token.startsWith('--shadow') || token.startsWith('--space') || token.startsWith('--radius') || token.startsWith('--ease') || token.startsWith('--container') || token.startsWith('--headerH') || token.startsWith('--dotG') || token.startsWith('--dotR') || token.startsWith('--font') || token.startsWith('--type');
      const isAlpha = !isNonColor && (token.includes('Fill') || token === '--separator' || token === '--border' || token === '--selection' || token === '--skeleton' || token.startsWith('--dot') || token.startsWith('--glass'));
      const name = token.replace('--', '');
      html += `
        <div class="swatch-row" onclick="copyColor(this, '${token}')" tabindex="0" role="button" aria-label="Copy ${name}">
          <div class="swatch-color ${isAlpha ? 'checkerboard' : ''}">
            <div class="inner" style="background: var(${token});"></div>
          </div>
          <div class="swatch-info">
            <span class="swatch-name">${name}</span>
            <span class="swatch-value" data-resolve="${token}"></span>
          </div>
        </div>`;
    });
  });
  container.innerHTML = html;
}

if (document.getElementById('token-table')) {
  buildTable();
}
resolveAll();

// ── Keyboard support for [role="button"] ──
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute('role') === 'button') {
    e.preventDefault();
    e.target.click();
  }
});

// ── Keyboard Shortcuts ──
// T = toggle theme, 1–5 = switch tint preset
document.addEventListener('keydown', function(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.code === 'KeyT') {
    e.preventDefault();
    toggleTheme();
  } else if (e.key >= '1' && e.key <= '5') {
    e.preventDefault();
    var idx = parseInt(e.key) - 1;
    if (tintPresets[idx]) setTint(tintPresets[idx].name);
  }
});

// ── Landing page dot pattern — now handled by PlanarKit canvas ──

// ── Scroll Spy ──
(function() {
  const links = document.querySelectorAll('.sidebar-link');
  const sections = [];
  links.forEach(link => {
    const id = link.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) sections.push({ id, el, link });
  });

  let ticking = false;
  function updateActive() {
    let current = sections[0];
    const scrollY = window.scrollY + 100;
    for (const s of sections) {
      if (s.el.offsetTop <= scrollY) current = s;
    }
    links.forEach(l => l.classList.remove('active'));
    if (current) current.link.classList.add('active');
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateActive);
      ticking = true;
    }
  }, { passive: true });

  // Smooth scroll
  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  updateActive();
})();

// ── Tab / Segmented Interactivity ──
function moveSegmentedIndicator(segmented, activeItem, animate) {
  let indicator = segmented.querySelector('.segmented-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'segmented-indicator';
    segmented.insertBefore(indicator, segmented.firstChild);
  }
  if (!animate) indicator.style.transition = 'none';
  indicator.style.width = activeItem.offsetWidth + 'px';
  indicator.style.transform = 'translateX(' + activeItem.offsetLeft + 'px)';
  if (!animate) {
    indicator.offsetHeight; // force reflow
    indicator.style.transition = '';
  }
}

// Init all segmented controls
document.querySelectorAll('.segmented').forEach(seg => {
  const active = seg.querySelector('.segmented-item.active');
  if (active) moveSegmentedIndicator(seg, active, false);
});

document.addEventListener('click', e => {
  const segItem = e.target.closest('.segmented-item');
  if (segItem) {
    const seg = segItem.closest('.segmented');
    seg.querySelectorAll('.segmented-item').forEach(s => s.classList.remove('active'));
    segItem.classList.add('active');
    moveSegmentedIndicator(seg, segItem, true);
  }
  const tabItem = e.target.closest('.tab-bar-item');
  if (tabItem) {
    tabItem.closest('.tab-bar').querySelectorAll('.tab-bar-item').forEach(t => t.classList.remove('active'));
    tabItem.classList.add('active');
  }
});

// ── Motion Page — Press / Release Demo ──
(function() {
  const btn = document.getElementById('motion-press-btn');
  const status = document.getElementById('motion-press-status');
  if (!btn || !status) return;

  function onDown(e) {
    e.preventDefault();
    btn.classList.add('motion-press-btn--down');
    status.textContent = 'Press: 0.18s fast · cubic-bezier(0.4, 0, 0.2, 1)';
    status.classList.add('motion-press-status--active');
  }

  function onUp() {
    btn.classList.remove('motion-press-btn--down');
    status.textContent = 'Release: 0.25s bouncy · cubic-bezier(0.34, 1.56, 0.64, 1)';
    status.classList.remove('motion-press-status--active');
  }

  btn.addEventListener('mousedown', onDown);
  btn.addEventListener('touchstart', onDown, { passive: false });
  btn.addEventListener('mouseup', onUp);
  btn.addEventListener('mouseleave', onUp);
  btn.addEventListener('touchend', onUp);
  btn.addEventListener('touchcancel', onUp);
})();

// ── Dropdown ──
function closeAllDropdowns(except) {
  document.querySelectorAll('.dropdown--open').forEach(d => {
    if (d !== except) d.classList.remove('dropdown--open');
  });
}

function selectDropdown(item, e) {
  if (e) e.stopPropagation();
  const menu = item.closest('.dropdown-menu');
  const dropdown = item.closest('.dropdown');
  menu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('dropdown-item--selected'));
  item.classList.add('dropdown-item--selected');
  const val = dropdown.querySelector('.dropdown-value');
  if (val) {
    val.textContent = item.textContent;
    val.classList.remove('dropdown-value--placeholder');
  }
  dropdown.classList.remove('dropdown--open');
}

function toggleDropdown(trigger, e) {
  if (e) e.stopPropagation();
  const dropdown = trigger.closest('.dropdown');
  const opening = !dropdown.classList.contains('dropdown--open');
  closeAllDropdowns(dropdown);
  dropdown.classList.toggle('dropdown--open');
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.dropdown')) closeAllDropdowns();
});

// Dropdown keyboard navigation
document.addEventListener('keydown', function(e) {
  const open = document.querySelector('.dropdown--open');
  if (!open) return;
  const items = Array.from(open.querySelectorAll('.dropdown-item'));
  if (!items.length) return;
  const focused = open.querySelector('.dropdown-item:focus');
  const idx = focused ? items.indexOf(focused) : -1;
  if (e.key === 'ArrowDown') { e.preventDefault(); items[Math.min(idx + 1, items.length - 1)].focus(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); items[Math.max(idx - 1, 0)].focus(); }
  else if (e.key === 'Escape') { closeAllDropdowns(); open.querySelector('.dropdown-trigger').focus(); }
});

// ── List accessory row tap ──
function toggleListAccessory(row, e) {
  if (e.target.closest('.dropdown')) return;
  // Switch: toggle the checkbox
  const checkbox = row.querySelector('.switch input[type="checkbox"]');
  if (checkbox) { checkbox.checked = !checkbox.checked; return; }
  // Dropdown: toggle open/close
  const dropdown = row.querySelector('.dropdown');
  if (dropdown) { e.stopPropagation(); closeAllDropdowns(dropdown); dropdown.classList.toggle('dropdown--open'); }
}

// ── Motion page dot pattern — now handled by PlanarKit canvas ──
