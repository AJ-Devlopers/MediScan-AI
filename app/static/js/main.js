/* ============================================================
   MEDISCAN AI — main.js
   All frontend interactivity — no backend logic changed
   ============================================================ */

/* ── THEME TOGGLE ── */

(function initTheme() {
    const saved = localStorage.getItem('mediscan-theme') || 'dark';
    applyTheme(saved, false);
})();

function applyTheme(theme, animate) {
    const html  = document.documentElement;
    const label = document.getElementById('themeLabel');

    if (animate) {
        document.body.style.transition = 'background 0.35s ease, color 0.35s ease';
        setTimeout(() => { document.body.style.transition = ''; }, 400);
    }

    html.setAttribute('data-theme', theme);
    localStorage.setItem('mediscan-theme', theme);

    if (label) label.textContent = theme === 'dark' ? 'Light' : 'Dark';
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark', true);
}

/* ── File select handlers ── */

function handleFileSelect(input) {
    const file = input.files[0];
    if (!file) return;
    const display = document.getElementById('fileDisplay');
    const nameEl  = document.getElementById('fileNameDisplay');
    if (display) display.style.display = 'flex';
    if (nameEl)  nameEl.textContent = truncateFilename(file.name, 28);
    highlightUploadZone();
}

function handleDashFile(input) {
    const file = input.files[0];
    if (!file) return;
    const display = document.getElementById('dashFileDisplay');
    const nameEl  = document.getElementById('dashFileName');
    if (display) display.style.display = 'flex';
    if (nameEl)  nameEl.textContent = truncateFilename(file.name, 28);
}

function handleAgentFile(input) {
    const file = input.files[0];
    if (!file) return;
    const display = document.getElementById('agentFileDisplay');
    const nameEl  = document.getElementById('agentFileName');
    if (display) display.style.display = 'flex';
    if (nameEl)  nameEl.textContent = truncateFilename(file.name, 28);
}

function truncateFilename(name, max) {
    if (name.length <= max) return name;
    const ext = name.split('.').pop();
    return name.substring(0, max - ext.length - 4) + '….' + ext;
}

function highlightUploadZone() {
    const zone = document.getElementById('uploadZone');
    if (zone) zone.style.borderColor = 'rgba(79,142,247,0.6)';
}

/* ── Loading overlays ── */

function showDashLoading() {
    const el = document.getElementById('dashLoading');
    if (el) el.style.display = 'flex';
    animateLoadingSteps('dashLoading');
}

function showAgentLoading() {
    const el = document.getElementById('agentLoading');
    if (el) el.style.display = 'flex';
    animateLoadingSteps('agentLoading');
}

function animateLoadingSteps(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const steps = container.querySelectorAll('.step');
    let i = 0;
    steps.forEach(s => s.classList.remove('active'));
    if (steps[0]) steps[0].classList.add('active');

    const interval = setInterval(() => {
        i++;
        if (i < steps.length) {
            steps.forEach(s => s.classList.remove('active'));
            steps[i].classList.add('active');
        } else {
            clearInterval(interval);
        }
    }, 2200);
}

/* Module 1 form — loading on submit */
(function() {
    const form = document.getElementById('uploadForm');
    if (form) {
        form.addEventListener('submit', function() {
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) overlay.style.display = 'flex';
            animateLoadingSteps('loadingOverlay');
        });
    }
})();

/* Agent form — loading on submit */
(function() {
    const form = document.getElementById('agentForm');
    if (form) {
        form.addEventListener('submit', function() {
            const fileInput = document.getElementById('agentFile');
            if (!fileInput || !fileInput.files[0]) return;
            showAgentLoading();
        });
    }
})();

/* ── Drag and drop on upload zone ── */

(function() {
    const zone = document.getElementById('uploadZone');
    if (!zone) return;

    ['dragenter', 'dragover'].forEach(ev => {
        zone.addEventListener(ev, e => {
            e.preventDefault();
            zone.classList.add('dragging');
        });
    });

    ['dragleave', 'drop'].forEach(ev => {
        zone.addEventListener(ev, e => {
            e.preventDefault();
            zone.classList.remove('dragging');
        });
    });

    zone.addEventListener('drop', e => {
        const file = e.dataTransfer.files[0];
        if (!file || !file.name.endsWith('.pdf')) return;
        const input = document.getElementById('fileInput');
        if (!input) return;
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        handleFileSelect(input);
    });
})();

/* ── RAG Chat (Module 2) ── */

// 🧠 In-memory chat history for current session
const chatHistory = [];

/* ── 🛡️ HTML Escape (prevents XSS in code blocks) ── */
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* ── 📋 Copy Code Button ── */
function copyCode(btn) {
    const code = btn.closest('.code-block').querySelector('code').innerText;
    navigator.clipboard.writeText(code).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 2000);
    });
}

/* ── 🔧 Markdown / Response Formatter ── */
function formatResponse(text) {
    if (!text) return '';

    let html = text
        .replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => {
            const language = lang || 'plaintext';
            return `
                <div class="code-block">
                    <div class="code-header">
                        <span class="code-lang">${language}</span>
                        <button class="copy-btn" onclick="copyCode(this)">Copy</button>
                    </div>
                    <pre><code class="language-${language}">${escapeHtml(code.trim())}</code></pre>
                </div>`;
        })
        .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
        .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
        .replace(/^## (.+)$/gm,  '<h2 class="md-h2">$1</h2>')
        .replace(/^# (.+)$/gm,   '<h1 class="md-h1">$1</h1>')
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
        .replace(/~~(.+?)~~/g, '<del>$1</del>')
        .replace(/^---$/gm, '<hr class="md-hr">')
        .replace(/^[\-\*•] (.+)$/gm, '<li class="md-li">$1</li>')
        .replace(/^\d+\. (.+)$/gm, '<li class="md-oli">$1</li>')
        .replace(/^> (.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>')
        .replace(/(<li class="md-li">.*?<\/li>(\n|$))+/g, match =>
            `<ul class="md-ul">${match}</ul>`)
        .replace(/(<li class="md-oli">.*?<\/li>(\n|$))+/g, match =>
            `<ol class="md-ol">${match}</ol>`)
        .replace(/\n\n+/g, '</p><p class="md-p">')
        .replace(/\n/g, '<br>');

    if (!html.startsWith('<h') && !html.startsWith('<ul') &&
        !html.startsWith('<ol') && !html.startsWith('<blockquote') &&
        !html.startsWith('<div') && !html.startsWith('<hr')) {
        html = `<p class="md-p">${html}</p>`;
    }

    return html;
}

/* ── 💬 Show Message ── */
function showMessage(text, role) {
    const container = document.getElementById('chatMessages');
    const emptyEl   = document.getElementById('chatEmpty');

    if (emptyEl) emptyEl.style.display = 'none';
    if (!container) return;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;

    if (role === 'assistant' || role === 'ai') {
        bubble.innerHTML = formatResponse(text);
    } else {
        bubble.textContent = text;
    }

    bubble.style.animation = 'fadeUp 0.3s ease both';
    container.appendChild(bubble);

    const chatBox = document.getElementById('chatContainer');
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
}

function showTypingIndicator() {
    const container = document.getElementById('chatMessages');
    if (!container) return null;

    const emptyEl = document.getElementById('chatEmpty');
    if (emptyEl) emptyEl.style.display = 'none';

    const indicator = document.createElement('div');
    indicator.className = 'chat-bubble ai';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
        <span style="opacity:0.6; font-family: var(--font-mono); font-size:12px;">
            analyzing ···
        </span>
    `;

    container.appendChild(indicator);

    const chatBox = document.getElementById('chatContainer');
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;

    return indicator;
}

async function submitRagQuery(event) {
    event.preventDefault();

    const input = document.getElementById('ragQuestion');
    const btn   = document.getElementById('ragSubmit');

    const question = (input?.value || '').trim();
    if (!question) return;

    // ✅ Show user message in UI
    showMessage(question, 'user');

    // ✅ Save user message to history
    chatHistory.push({ role: 'user', content: question });

    if (input) input.value = '';

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ Thinking...';
    }

    const typingEl = showTypingIndicator();

    try {
        const response = await fetch('/module2/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: question,
                history: chatHistory.slice(-10) // ✅ Send last 10 turns
            })
        });

        if (typingEl) typingEl.remove();

        if (response.ok) {
            const data = await response.json();
            const answer = data.answer || data.rag_response || "No answer returned.";

            // ✅ Show AI response in UI
            showMessage(answer, 'ai');

            // ✅ Save assistant reply to history
            chatHistory.push({ role: 'assistant', content: answer });

        } else {
            showMessage("⚠️ Server error. Try again.", 'ai');
        }

    } catch (err) {
        if (typingEl) typingEl.remove();
        showMessage("⚠️ Connection error. Please try again.", 'ai');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8l12-6-5 6 5 6-12-6Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
                </svg>
                Ask
            `;
        }
    }
}
/* ── Score circle animation on page load ── */

(function() {
    const circle = document.querySelector('.score-circle');
    if (!circle) return;
    const total  = 314;
    const offset = parseFloat(circle.getAttribute('stroke-dashoffset') || total);
    circle.style.strokeDashoffset = total;
    requestAnimationFrame(() => {
        setTimeout(() => {
            circle.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1)';
            circle.style.strokeDashoffset = offset;
        }, 200);
    });
})();

/* ── Staggered row animation on data tables ── */

(function() {
    document.querySelectorAll('.table-row').forEach((row, i) => {
        row.style.opacity = '0';
        row.style.transform = 'translateY(6px)';
        setTimeout(() => {
            row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        }, 80 + i * 30);
    });
})();

/* ── Active nav highlight ── */

(function() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-item').forEach(item => {
        const href = item.getAttribute('href');
        if (href && href !== '#') {
            if (path === href || (href !== '/' && path.startsWith(href))) {
                item.classList.add('active');
            }
        }
    });
})();