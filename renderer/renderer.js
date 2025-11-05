const { ipcRenderer } = require('electron');

let bootEntries = [];
let selectedIndex = 0;

// Windows 图标 SVG
const windowsIconSVG = `
<svg viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 12.402l35.687-4.86.016 34.423-35.67.203zm35.67 33.529l.028 34.453L.028 75.48.026 45.7zm4.326-39.025L87.314 0v41.527l-47.318.376zm47.329 39.349l-.011 41.34-47.318-6.678-.066-34.739z"/>
</svg>
`;

// 页面加载完成
window.addEventListener('DOMContentLoaded', async () => {
  await loadBootEntries();
  setupKeyboardNavigation();
});

// 加载启动项列表
async function loadBootEntries() {
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const osListEl = document.getElementById('os-list');

  try {
    // 获取启动项列表
    bootEntries = await ipcRenderer.invoke('get-boot-entries');

    // 获取当前默认启动项
    const currentDefault = await ipcRenderer.invoke('get-current-default');

    if (bootEntries.length === 0) {
      throw new Error('未检测到任何 Windows 启动项');
    }

    // 隐藏加载，显示列表
    loadingEl.style.display = 'none';
    osListEl.style.display = 'flex';

    // 渲染列表
    renderBootEntries(currentDefault);

  } catch (error) {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    errorEl.querySelector('.error-message').textContent =
      `错误: ${error.message || '无法读取启动配置'}`;
  }
}

// 渲染启动项列表
function renderBootEntries(currentDefault) {
  const osListEl = document.getElementById('os-list');
  osListEl.innerHTML = '';

  bootEntries.forEach((entry, index) => {
    const isDefault = entry.identifier === currentDefault;
    const isCurrent = entry.isCurrent;

    const item = document.createElement('div');
    item.className = `os-item ${index === selectedIndex ? 'selected' : ''} ${isCurrent ? 'current' : ''}`;
    item.dataset.index = index;

    item.innerHTML = `
      <div class="os-icon">${windowsIconSVG}</div>
      <div class="os-info">
        <div class="os-name">${entry.description}</div>
        <div class="os-details">${entry.device || entry.locale || ''}</div>
      </div>
      ${isCurrent ? '<span class="os-badge">当前系统</span>' : ''}
    `;

    item.addEventListener('click', () => selectItem(index));
    item.addEventListener('dblclick', () => confirmSwitch(index));

    osListEl.appendChild(item);
  });
}

// 选择项目
function selectItem(index) {
  selectedIndex = index;
  updateSelection();
}

// 更新选中状态
function updateSelection() {
  const items = document.querySelectorAll('.os-item');
  items.forEach((item, index) => {
    if (index === selectedIndex) {
      item.classList.add('selected');
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      item.classList.remove('selected');
    }
  });
}

// 键盘导航
function setupKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    if (bootEntries.length === 0) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = Math.max(0, selectedIndex - 1);
        updateSelection();
        break;

      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = Math.min(bootEntries.length - 1, selectedIndex + 1);
        updateSelection();
        break;

      case 'Enter':
        e.preventDefault();
        confirmSwitch(selectedIndex);
        break;

      case 'Escape':
        e.preventDefault();
        closeApp();
        break;
    }
  });
}

// 确认切换
function confirmSwitch(index) {
  const entry = bootEntries[index];

  if (entry.isCurrent) {
    showMessage('提示', '您选择的是当前系统，无需切换。');
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-dialog">
      <h2>确认切换系统</h2>
      <p>即将重启并切换到:<br><strong>${entry.description}</strong></p>
      <p style="font-size: 14px; opacity: 0.8;">请保存您的工作后再继续</p>
      <div class="confirm-buttons">
        <button class="btn-confirm" onclick="performSwitch('${entry.identifier}')">确认重启</button>
        <button class="btn-cancel-dialog" onclick="cancelSwitch()">取消</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // 点击背景关闭
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      cancelSwitch();
    }
  });
}

// 执行切换
async function performSwitch(identifier) {
  try {
    await ipcRenderer.invoke('switch-system', identifier);
  } catch (error) {
    cancelSwitch();
    showMessage('切换失败', `错误: ${error.message || '未知错误'}`);
  }
}

// 取消切换
function cancelSwitch() {
  const overlay = document.querySelector('.confirm-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// 显示消息
function showMessage(title, message) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-dialog">
      <h2>${title}</h2>
      <p>${message}</p>
      <div class="confirm-buttons">
        <button class="btn-confirm" onclick="closeMessage()">确定</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

// 关闭消息
function closeMessage() {
  const overlay = document.querySelector('.confirm-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// 关闭应用
function closeApp() {
  ipcRenderer.invoke('close-app');
}
