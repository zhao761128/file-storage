// 文件存储应用 - 用户隔离版（含声明功能）
// 功能：1. 按用户隔离文件存储 2. 首次访问显示声明 3. 声明内容内嵌在代码中

// ========== 全局变量和配置 ==========
let files = [];
let currentUserId = null;
let MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 默认100MB
let hasSeenStatement = false; // 标记用户是否已看过声明
const FILE_TYPES = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
    video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'],
    audio: ['mp3', 'wav', 'ogg'],
    document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
    archive: ['zip', 'rar', '7z', 'tar', 'gz']
};

// ========== 声明内容（请在这里编辑声明）==========
// 你可以直接修改下面的内容来更新声明
const STATEMENT_CONTENT = `
<h2>📋 功能说明</h2>
<p>本网站为个人文件存储空间，支持上传、管理、分享图片、视频、文档等文件。提供永久链接功能，可跨设备访问个人文件（需在同一浏览器环境下）。</p>

<h2>⚠️ 重要限制</h2>
<p><strong>本地存储</strong>：所有文件存储在您的浏览器本地存储中</p>
<p><strong>跨设备限制</strong>：不同浏览器或设备间的文件不共享</p>
<p><strong>存储上限</strong>：单个文件无硬性限制，总存储空间可动态调整（默认100MB）</p>

<h2>⚠️ 重要警告</h2>
<p class="warning">清除浏览器缓存会导致所有文件永久丢失！</p>
<p>建议定期使用"导出数据"功能备份重要文件。本网站不提供云端备份服务。</p>

<h2>📜 使用条款</h2>
<ol>
    <li>禁止上传任何违法、违规、侵权内容</li>
    <li>用户需对上传内容负全部法律责任</li>
    <li>本网站保留删除违规内容的权利</li>
</ol>

<h2>© 版权声明</h2>
<div class="copyright">All rights reserved to zhao761128 Studio</div>

<h2>🙏 特别感谢</h2>
<p>本网站依托 GitHub Pages 服务运行，感谢 GitHub 提供的免费静态网站托管服务。</p>

<h2>📞 联系反馈</h2>
<p>如有问题或建议，请通过GitHub仓库Issues反馈。</p>

<p style="text-align: center; color: #666; margin-top: 20px; font-size: 12px;">
    <em>最后更新日期：2025年12月25日</em>
</p>
`;

// ========== 初始化函数 ==========
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
    loadUserSettings();
    loadFiles();
    updateStorageInfo();
    handleSharedLinks();
    
    // 检查是否需要显示声明
    checkAndShowStatement();
});

function initApp() {
    // 初始化存储配置
    const customLimit = localStorage.getItem('custom_storage_limit');
    if (customLimit) {
        MAX_TOTAL_SIZE = parseInt(customLimit);
    }
    
    // 检查用户是否已看过声明
    hasSeenStatement = localStorage.getItem('has_seen_statement') === 'true';
}

// ========== 声明功能 ==========
function checkAndShowStatement() {
    // 首次访问时显示声明
    if (!hasSeenStatement) {
        // 延迟显示，让页面先加载完成
        setTimeout(() => {
            showStatementModal();
            // 标记为已看过声明
            localStorage.setItem('has_seen_statement', 'true');
            hasSeenStatement = true;
        }, 1000);
    }
}

function showStatementModal() {
    // 显示模态框
    const modal = document.getElementById('statement-modal');
    const content = document.getElementById('statement-content');
    
    // 直接显示声明内容
    content.innerHTML = STATEMENT_CONTENT;
    
    // 显示模态框
    modal.classList.add('show');
}

function downloadStatement() {
    // 创建声明文本内容（去除HTML标签）
    const plainText = STATEMENT_CONTENT
        .replace(/<[^>]*>/g, '') // 移除HTML标签
        .replace(/&nbsp;/g, ' ') // 替换空格
        .replace(/&lt;/g, '<')   // 替换特殊字符
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
    
    // 创建下载链接
    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(plainText);
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = '网站声明.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('声明文件已下载', 'success');
}

// ========== 事件监听设置 ==========
function setupEventListeners() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const userInfo = document.getElementById('user-info');
    const selectFileBtn = document.getElementById('select-file-btn');
    
    // 用户菜单点击事件
    userInfo.addEventListener('click', (e) => {
        // 只有登录后才能打开菜单
        if (currentUserId) {
            const menu = document.getElementById('user-menu');
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            e.stopPropagation();
        } else {
            // 未登录时直接显示登录模态框
            showLoginModal();
        }
    });
    
    // 点击页面其他地方关闭菜单
    document.addEventListener('click', () => {
        document.getElementById('user-menu').style.display = 'none';
    });
    
    // 选择文件按钮事件
    selectFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!currentUserId) {
            alert('请先登录再上传文件');
            showLoginModal();
            return;
        }
        fileInput.click();
    });
    
    // 上传区域点击事件
    uploadArea.addEventListener('click', (e) => {
        if (e.target === selectFileBtn || selectFileBtn.contains(e.target)) {
            return;
        }
        if (!currentUserId) {
            alert('请先登录再上传文件');
            showLoginModal();
            return;
        }
        fileInput.click();
    });
    
    // 拖拽上传事件
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!currentUserId) return;
        uploadArea.style.borderColor = 'white';
        uploadArea.style.transform = 'translateY(-5px)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'rgba(255,255,255,0.5)';
        uploadArea.style.transform = 'translateY(0)';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'rgba(255,255,255,0.5)';
        uploadArea.style.transform = 'translateY(0)';
        
        if (!currentUserId) {
            alert('请先登录再上传文件');
            showLoginModal();
            return;
        }
        
        if (e.dataTransfer.files.length > 0) {
            uploadFiles(e.dataTransfer.files);
        }
    });
    
    // 文件选择变化事件
    fileInput.addEventListener('change', (e) => {
        if (!currentUserId) {
            alert('请先登录再上传文件');
            showLoginModal();
            e.target.value = '';
            return;
        }
        
        if (e.target.files.length > 0) {
            uploadFiles(e.target.files);
            e.target.value = '';
        }
    });
}

// ========== 用户管理功能 ==========
function saveUserSettings() {
    const username = document.getElementById('set-username').value.trim();
    const password = document.getElementById('set-password').value;
    
    if (!username) {
        alert('请输入用户名');
        return;
    }
    
    // 生成用户唯一ID（使用用户名+时间戳）
    const userId = `user_${username}_${Date.now()}`;
    
    const userSettings = {
        userId: userId,
        username: username,
        hasPassword: !!password,
        created: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };
    
    // 保存用户设置
    localStorage.setItem('current_user', JSON.stringify(userSettings));
    
    // 更新当前用户状态
    currentUserId = userId;
    document.getElementById('username').textContent = username;
    
    // 创建用户的初始文件存储空间（如果不存在）
    if (!localStorage.getItem(`user_files_${userId}`)) {
        localStorage.setItem(`user_files_${userId}`, JSON.stringify([]));
    }
    
    showNotification(`欢迎 ${username}！`, 'success');
    closeLoginModal();
    
    // 重新加载文件（新用户的空文件列表）
    loadFiles();
}

function loadUserSettings() {
    const userData = localStorage.getItem('current_user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            currentUserId = user.userId;
            document.getElementById('username').textContent = user.username;
            document.getElementById('set-username').value = user.username;
            
            // 更新最后登录时间
            user.lastLogin = new Date().toISOString();
            localStorage.setItem('current_user', JSON.stringify(user));
            
            return true;
        } catch (e) {
            console.error('用户数据解析错误:', e);
        }
    }
    return false;
}

function logout() {
    if (confirm('确定要注销吗？这将清除当前会话，但文件会保留在您的账号中。')) {
        // 保存当前用户的文件（如果有）
        if (currentUserId && files.length > 0) {
            localStorage.setItem(`user_files_${currentUserId}`, JSON.stringify(files));
        }
        
        // 清除当前会话
        localStorage.removeItem('current_user');
        currentUserId = null;
        document.getElementById('username').textContent = '游客';
        files = [];
        
        // 清空文件列表显示
        displayFiles([]);
        updateStorageInfo();
        
        showNotification('已注销', 'info');
    }
}

// ========== 文件管理功能 ==========
function loadFiles() {
    if (!currentUserId) {
        files = [];
        displayFiles([]);
        updateStorageInfo();
        return;
    }
    
    const stored = localStorage.getItem(`user_files_${currentUserId}`);
    files = stored ? JSON.parse(stored) : [];
    displayFiles(files);
}

function saveFiles() {
    if (!currentUserId) {
        console.warn('未登录，无法保存文件');
        return;
    }
    localStorage.setItem(`user_files_${currentUserId}`, JSON.stringify(files));
}

// ========== 文件上传功能 ==========
async function uploadFiles(fileList) {
    if (!currentUserId) {
        alert('请先登录再上传文件');
        showLoginModal();
        return;
    }
    
    const filesArray = Array.from(fileList);
    let totalSize = 0;
    
    // 计算总大小
    for (const file of filesArray) {
        totalSize += file.size;
    }
    
    // 检查存储空间
    const currentUsed = getUsedStorage();
    if (currentUsed + totalSize > MAX_TOTAL_SIZE) {
        const neededMB = Math.ceil((currentUsed + totalSize - MAX_TOTAL_SIZE) / (1024 * 1024));
        
        const userChoice = confirm(
            `存储空间不足！\n\n已使用: ${formatFileSize(currentUsed)}\n本次上传需要: ${formatFileSize(totalSize)}\n当前限制: ${formatFileSize(MAX_TOTAL_SIZE)}\n\n是否增加存储限制？`
        );
        
        if (userChoice) {
            const newLimitMB = prompt(
                `请输入新的存储限制（MB）\n建议值: ${Math.ceil((currentUsed + totalSize) / (1024 * 1024)) + 100}`,
                Math.ceil((currentUsed + totalSize) / (1024 * 1024)) + 100
            );
            
            if (newLimitMB && !isNaN(newLimitMB) && newLimitMB > 0) {
                MAX_TOTAL_SIZE = parseInt(newLimitMB) * 1024 * 1024;
                localStorage.setItem('custom_storage_limit', MAX_TOTAL_SIZE);
                updateStorageInfo();
            } else {
                return; // 用户取消
            }
        } else {
            return; // 用户取消
        }
    }
    
    // 显示上传进度
    const progressDiv = document.createElement('div');
    progressDiv.className = 'upload-progress';
    progressDiv.innerHTML = `
        <div class="progress-container">
            <div class="progress-bar"><div class="progress-fill" style="width: 0%"></div></div>
            <div class="progress-text">准备上传...</div>
        </div>
    `;
    document.querySelector('.upload-section').appendChild(progressDiv);
    
    try {
        // 逐个处理文件
        for (let i = 0; i < filesArray.length; i++) {
            const file = filesArray[i];
            const progress = ((i + 1) / filesArray.length) * 100;
            
            progressDiv.querySelector('.progress-text').textContent = 
                `正在上传 ${file.name} (${i + 1}/${filesArray.length})`;
            progressDiv.querySelector('.progress-fill').style.width = `${progress}%`;
            
            await processFile(file);
        }
        
        // 完成上传
        progressDiv.querySelector('.progress-text').textContent = `上传完成 ${filesArray.length} 个文件`;
        progressDiv.querySelector('.progress-fill').style.width = '100%';
        
        // 保存并刷新
        saveFiles();
        loadFiles();
        updateStorageInfo();
        
        // 显示成功通知
        showNotification(`成功上传 ${filesArray.length} 个文件`, 'success');
        
        // 3秒后移除进度条
        setTimeout(() => {
            progressDiv.remove();
        }, 3000);
        
    } catch (error) {
        progressDiv.querySelector('.progress-text').textContent = `上传失败: ${error.message}`;
        progressDiv.querySelector('.progress-fill').style.background = '#e74c3c';
        
        setTimeout(() => {
            progressDiv.remove();
        }, 5000);
    }
}

async function processFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const fileData = {
                id: generateId(),
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result,
                uploadTime: new Date().toISOString(),
                userId: currentUserId,
                isLargeFile: file.size > 20 * 1024 * 1024
            };
            
            files.push(fileData);
            resolve();
        };
        
        reader.onerror = () => {
            reject(new Error(`读取文件 ${file.name} 失败`));
        };
        
        reader.readAsDataURL(file);
    });
}

// ========== 显示文件列表 ==========
function displayFiles(fileList) {
    const fileListElement = document.getElementById('file-list');
    
    if (!currentUserId) {
        fileListElement.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-lock"></i>
                <p>请先登录查看您的文件</p>
                <button class="btn-secondary" onclick="showLoginModal()" style="margin-top: 15px;">
                    <i class="fas fa-sign-in-alt"></i> 点击登录
                </button>
            </div>
        `;
        return;
    }
    
    if (fileList.length === 0) {
        fileListElement.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-upload"></i>
                <p>暂无文件，开始上传吧！</p>
                <small>您的文件已安全存储</small>
            </div>
        `;
        return;
    }
    
    fileListElement.innerHTML = fileList.map(file => {
        const icon = getFileIcon(file.name);
        const size = formatFileSize(file.size);
        const date = new Date(file.uploadTime).toLocaleDateString();
        
        return `
            <div class="file-card" data-id="${file.id}">
                <div class="file-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="file-info">
                    <div class="file-name" title="${file.name}">${file.name}</div>
                    <div class="file-meta">
                        <span>${size}</span>
                        <span>上传: ${date}</span>
                        ${file.isLargeFile ? '<span class="large-file-tag">大文件</span>' : ''}
                    </div>
                </div>
                <div class="file-actions">
                    <button class="action-btn" onclick="downloadFile('${file.id}')" title="下载">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="action-btn" onclick="managePermanentLinks('${file.id}')" title="永久链接">
                        <i class="fas fa-link"></i>
                    </button>
                    <button class="action-btn" onclick="deleteFile('${file.id}')" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ========== 数据导入导出 ==========
function exportData() {
    if (!currentUserId) {
        alert('请先登录再导出数据');
        showLoginModal();
        return;
    }
    
    const exportData = {
        userId: currentUserId,
        username: document.getElementById('username').textContent,
        files: files,
        exportTime: new Date().toISOString(),
        version: '2.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileName = `file-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = exportFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('数据导出成功', 'success');
}

function importData() {
    if (!currentUserId) {
        alert('请先登录再导入数据');
        showLoginModal();
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (!importedData.files || !Array.isArray(importedData.files)) {
                    throw new Error('无效的数据格式');
                }
                
                // 检查是否是当前用户的数据（可选）
                if (importedData.userId && importedData.userId !== currentUserId) {
                    if (!confirm('此备份文件属于其他用户，是否继续导入？')) {
                        return;
                    }
                }
                
                // 检查存储空间
                const importedSize = importedData.files.reduce((total, file) => total + file.size, 0);
                const currentUsed = getUsedStorage();
                
                if (currentUsed + importedSize > MAX_TOTAL_SIZE) {
                    const neededMB = Math.ceil((currentUsed + importedSize - MAX_TOTAL_SIZE) / (1024 * 1024));
                    alert(`存储空间不足，需要额外${neededMB}MB空间`);
                    return;
                }
                
                // 合并文件（避免重复）
                let addedCount = 0;
                importedData.files.forEach(importedFile => {
                    const exists = files.some(f => f.id === importedFile.id);
                    if (!exists) {
                        const fileWithUser = {
                            ...importedFile,
                            userId: currentUserId,
                            lastModified: new Date().toISOString()
                        };
                        files.push(fileWithUser);
                        addedCount++;
                    }
                });
                
                saveFiles();
                loadFiles();
                updateStorageInfo();
                
                showNotification(`成功导入 ${addedCount} 个文件`, 'success');
                
            } catch (error) {
                alert('导入失败：文件格式错误或已损坏');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ========== 其他功能函数 ==========
function downloadFile(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`已开始下载 ${file.name}`, 'success');
}

function deleteFile(fileId) {
    if (!confirm('确定要删除这个文件吗？')) return;
    
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    files = files.filter(f => f.id !== fileId);
    saveFiles();
    loadFiles();
    updateStorageInfo();
    
    showNotification(`已删除 ${file.name}`, 'success');
}

function searchFiles() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    if (!searchTerm) {
        displayFiles(files);
        return;
    }
    
    const filteredFiles = files.filter(file => 
        file.name.toLowerCase().includes(searchTerm) ||
        file.type.toLowerCase().includes(searchTerm)
    );
    
    displayFiles(filteredFiles);
}

function refreshFiles() {
    loadFiles();
    showNotification('文件列表已刷新', 'info');
}

function generatePermanentLink(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) return null;
    
    if (file.type.startsWith('image/')) {
        return file.data;
    }
    
    const currentUrl = window.location.origin + window.location.pathname;
    return `${currentUrl}?open=${encodeURIComponent(fileId)}&name=${encodeURIComponent(file.name)}`;
}

function managePermanentLinks(fileId) {
    if (!currentUserId) {
        alert('请先登录再管理链接');
        showLoginModal();
        return;
    }
    
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    const directUrl = generatePermanentLink(fileId);
    const isImage = file.type.startsWith('image/');
    
    let htmlContent = `
        <div class="modal-header">
            <h2><i class="fas fa-link"></i> 永久链接 - ${file.name}</h2>
            <button class="close-btn" onclick="closeModal('link-modal')">&times;</button>
        </div>
        <div class="modal-body">
    `;
    
    if (isImage) {
        htmlContent += `
            <div class="link-section">
                <h4><i class="fas fa-image"></i> 图片直链（永久有效）</h4>
                <div class="link-box">
                    <input type="text" value="${directUrl}" readonly id="direct-link">
                    <button onclick="copyToClipboard('direct-link')"><i class="fas fa-copy"></i> 复制</button>
                </div>
                <small>可用于：&lt;img src="此链接"&gt; 或 CSS background</small>
                <div class="preview">
                    <h5>预览：</h5>
                    <img src="${directUrl}" style="max-width: 100%; border-radius: 5px;">
                </div>
            </div>
        `;
    } else {
        htmlContent += `
            <div class="link-section">
                <h4><i class="fas fa-external-link-alt"></i> 文件访问链接</h4>
                <div class="link-box">
                    <input type="text" value="${directUrl}" readonly id="page-link">
                    <button onclick="copyToClipboard('page-link')"><i class="fas fa-copy"></i> 复制</button>
                </div>
                <small>复制此链接可在浏览器中访问或下载此文件。</small>
            </div>
        `;
    }
    
    htmlContent += `</div>`;
    document.getElementById('link-modal-content').innerHTML = htmlContent;
    document.getElementById('link-modal').classList.add('show');
}

function handleSharedLinks() {
    const urlParams = new URLSearchParams(window.location.search);
    const fileId = urlParams.get('open');
    const fileName = urlParams.get('name');
    
    if (fileId && currentUserId) {
        const decodedFileId = decodeURIComponent(fileId);
        const decodedFileName = decodeURIComponent(fileName || '文件');
        
        const file = files.find(f => f.id === decodedFileId);
        if (file) {
            if (confirm(`是否要打开文件 "${decodedFileName}"？`)) {
                if (file.type.startsWith('image/') || file.type.startsWith('text/')) {
                    showFilePreview(file);
                } else {
                    downloadFile(file.id);
                }
            }
            
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

// ========== 工具函数 ==========
function generateId() {
    return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    
    for (const [type, extensions] of Object.entries(FILE_TYPES)) {
        if (extensions.includes(ext)) {
            switch(type) {
                case 'image': return 'fas fa-image';
                case 'video': return 'fas fa-video';
                case 'audio': return 'fas fa-music';
                case 'document':
                    if (ext === 'pdf') return 'fas fa-file-pdf';
                    if (['doc', 'docx'].includes(ext)) return 'fas fa-file-word';
                    if (['xls', 'xlsx'].includes(ext)) return 'fas fa-file-excel';
                    if (['ppt', 'pptx'].includes(ext)) return 'fas fa-file-powerpoint';
                    return 'fas fa-file-alt';
                case 'archive': return 'fas fa-file-archive';
            }
        }
    }
    
    return 'fas fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getUsedStorage() {
    return files.reduce((total, file) => total + file.size, 0);
}

function updateStorageInfo() {
    const used = getUsedStorage();
    const fillPercent = Math.min((used / MAX_TOTAL_SIZE) * 100, 100);
    
    document.getElementById('storage-fill').style.width = `${fillPercent}%`;
    document.getElementById('storage-text').textContent = 
        `存储空间: ${formatFileSize(used)}/${formatFileSize(MAX_TOTAL_SIZE)}`;
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.select();
    element.setSelectionRange(0, 99999);
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('已复制到剪贴板', 'success');
        }
    } catch (err) {
        navigator.clipboard.writeText(element.value)
            .then(() => showNotification('已复制到剪贴板', 'success'))
            .catch(() => showNotification('复制失败', 'error'));
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function closeLoginModal() {
    closeModal('login-modal');
}

function showLoginModal() {
    document.getElementById('login-modal').classList.add('show');
}

function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    switch(type) {
        case 'success':
            notification.style.background = '#2ecc71';
            break;
        case 'error':
            notification.style.background = '#e74c3c';
            break;
        case 'warning':
            notification.style.background = '#f39c12';
            break;
        default:
            notification.style.background = '#3498db';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function showFilePreview(file) {
    const img = new Image();
    img.src = file.data;
    img.onload = function() {
        const w = window.open('');
        w.document.write(`<img src="${file.data}" style="max-width:100%;">`);
        w.document.close();
    };
}
