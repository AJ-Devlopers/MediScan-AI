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


// 🔥 ADD THIS FUNCTION HERE
function askAuto(question) {
    const input = document.getElementById("ragQuestion");

    if (!input) {
        console.error("ragQuestion input not found");
        return;
    }

    // set question
    input.value = question;

    // focus input (nice UX)
    input.focus();

    // trigger same submit flow
    input.form.requestSubmit();
}

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

document.addEventListener('DOMContentLoaded', function () {
    // ── Auto-ask from Module 3 follow-up ──
    const autoAsk = sessionStorage.getItem('m3_autoask');
    if (autoAsk) {
        sessionStorage.removeItem('m3_autoask');
        const input = document.getElementById('ragQuestion');
        if (input) {
            input.value = autoAsk;
            setTimeout(() => {
                const form = input.closest('form');
                if (form) form.requestSubmit();
            }, 600);
        }
    }

    // ── Autofill age/gender from patient data ──
    const pd = document.getElementById('patientData');
    if (pd) {
        const age    = pd.getAttribute('data-age');
        const gender = pd.getAttribute('data-gender');
        if (age    && document.getElementById('fieldAge'))    document.getElementById('fieldAge').value = age;
        if (gender && document.getElementById('fieldGender')) {
            const sel = document.getElementById('fieldGender');
            [...sel.options].forEach(o => { if (o.value === gender) o.selected = true; });
        }
    }

    // ── Restore saved form data from sessionStorage ──
    restoreFormData();
});

async function submitRagQuery(event) {
    /* ── In module2's submitRagQuery or DOMContentLoaded ──
   Add this AT THE TOP of the DOMContentLoaded block in main.js:
*/


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

// 🔥 GLOBAL RESET FUNCTION
function startNewSession() {
    if (typeof chatHistory !== "undefined") {
        chatHistory.length = 0;
    }
    sessionStorage.removeItem('m3_form');
    sessionStorage.removeItem('m3_autoask');

    const chatBox = document.getElementById("chatMessages");
    if (chatBox) {

        chatBox.innerHTML = "";
    }

    window.location.href = "/";
}

/* ── 🔥 NEW HEALTH SCORE PROGRESS (CIRCLE ANIMATION) ── */
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.progress-circle[data-value]').forEach(function (el) {
        const score = parseFloat(el.getAttribute('data-value')) || 0;
        const circle = el.querySelector('circle.progress');
        if (circle) {
            const offset = 377 - (score / 100) * 377;
            setTimeout(function () {
                circle.style.strokeDashoffset = offset;
                circle.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)';
            }, 100);
        }
    });
});
/* ── MODULE 3 ── */

/* ── MODULE 3 STEP FLOW ── */

let currentStep = 1;
const chronicDiseases = [];
const customSymptoms  = [];

// Autofill from patient data
document.addEventListener('DOMContentLoaded', function () {
    const pd = document.getElementById('patientData');
    if (!pd) return;
    const age    = pd.getAttribute('data-age');
    const gender = pd.getAttribute('data-gender');
    if (age    && document.getElementById('fieldAge'))    document.getElementById('fieldAge').value = age;
    if (gender && document.getElementById('fieldGender')) {
        const sel = document.getElementById('fieldGender');
        [...sel.options].forEach(o => { if (o.value === gender) o.selected = true; });
    }
});

function scrollToForm() {
    const el = document.getElementById('formSection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* ── Save all form fields to sessionStorage ── */
function saveFormData() {
    const data = {
        age:      document.getElementById('fieldAge')?.value    || '',
        height:   document.getElementById('fieldHeight')?.value || '',
        weight:   document.getElementById('fieldWeight')?.value || '',
        gender:   document.getElementById('fieldGender')?.value || '',
        duration: document.getElementById('durationInput')?.value || '',
        symptoms: document.getElementById('symptomsHidden')?.value || '',
        chronic:  document.getElementById('chronicHidden')?.value || 'no',
        chronic_type: document.getElementById('chronicTypeHidden')?.value || '',
        currentStep: currentStep,
        customSymptoms: [...customSymptoms],
        chronicDiseases: [...chronicDiseases],
    };
    sessionStorage.setItem('m3_form', JSON.stringify(data));
}

/* ── Restore saved form data from sessionStorage ── */
function restoreFormData() {
    const raw = sessionStorage.getItem('m3_form');
    if (!raw) return;
    try {
        const data = JSON.parse(raw);

        if (data.age    && document.getElementById('fieldAge'))    document.getElementById('fieldAge').value    = data.age;
        if (data.height && document.getElementById('fieldHeight')) document.getElementById('fieldHeight').value = data.height;
        if (data.weight && document.getElementById('fieldWeight')) document.getElementById('fieldWeight').value = data.weight;
        if (data.gender && document.getElementById('fieldGender')) {
            const sel = document.getElementById('fieldGender');
            [...sel.options].forEach(o => { if (o.value === data.gender) o.selected = true; });
        }
        if (data.duration && document.getElementById('durationInput')) document.getElementById('durationInput').value = data.duration;
        if (data.symptoms && document.getElementById('symptomsHidden')) document.getElementById('symptomsHidden').value = data.symptoms;
        if (data.chronic  && document.getElementById('chronicHidden'))  document.getElementById('chronicHidden').value  = data.chronic;
        if (data.chronic_type && document.getElementById('chronicTypeHidden')) document.getElementById('chronicTypeHidden').value = data.chronic_type;

        // Restore custom symptoms
        if (data.customSymptoms?.length) {
            data.customSymptoms.forEach(s => customSymptoms.push(s));
            renderCustomSymptomTags();
        }

        // Restore chronic diseases
        if (data.chronicDiseases?.length) {
            data.chronicDiseases.forEach(d => chronicDiseases.push(d));
            renderChronicList();
            if (data.chronic === 'yes') toggleChronicSection(true);
        }

        // Restore current step
        if (data.currentStep && data.currentStep > 1) {
            goStep(data.currentStep);
        }
    } catch(e) {
        console.warn('Could not restore form data:', e);
    }
}

/* ── Validation per step ── */
function validateStep(n) {
    if (n === 1) {
        const age = document.getElementById('fieldAge')?.value?.trim();
        if (!age) {
            showStepError('fieldAge', 'Please enter your age to continue.');
            return false;
        }
        clearStepErrors();
        return true;
    }
    if (n === 2) {
        // symptoms step — always valid (No is a valid choice)
        collectSymptoms();
        return true;
    }
    if (n === 3) {
        const duration = document.getElementById('durationInput')?.value?.trim();
        if (!duration) {
            showStepError('durationInput', 'Please select or enter how long you have had symptoms.');
            return false;
        }
        clearStepErrors();
        return true;
    }
    return true;
}

function showStepError(fieldId, msg) {
    clearStepErrors();
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.style.borderColor = 'var(--high)';
    field.style.boxShadow   = '0 0 0 3px var(--high-dim)';
    const err = document.createElement('div');
    err.className = 'm3-step-error';
    err.id = 'stepErrorMsg';
    err.textContent = '⚠ ' + msg;
    field.parentNode.appendChild(err);
    field.focus();
}

function clearStepErrors() {
    document.querySelectorAll('.m3-step-error').forEach(e => e.remove());
    ['fieldAge','fieldHeight','fieldWeight','durationInput'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.style.borderColor = ''; el.style.boxShadow = ''; }
    });
}

function goStep(n) {
    // Validate before leaving current step (only going forward)
    if (n > currentStep) {
        if (!validateStep(currentStep)) return;
    }

    // collect symptoms before leaving step 2
    if (currentStep === 2) collectSymptoms();

    // save everything to sessionStorage
    saveFormData();

    // update panels
    document.querySelectorAll('.m3-step-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('step' + n);
    if (panel) panel.classList.add('active');

    // update step indicators
    document.querySelectorAll('.m3-step-item').forEach((item, idx) => {
        item.classList.remove('active', 'done');
        if (idx + 1 < n)  item.classList.add('done');
        if (idx + 1 === n) item.classList.add('active');
    });

    // connectors
    document.querySelectorAll('.m3-step-connector').forEach((c, idx) => {
        c.classList.toggle('done', idx + 1 < n);
    });

    currentStep = n;
    clearStepErrors();

    const formSection = document.getElementById('formSection');
    if (formSection) window.scrollTo({ top: formSection.offsetTop - 20, behavior: 'smooth' });
}

/* ── Symptom toggle ── */
function toggleSymptomSection(show) {
    document.getElementById('symptomSection').style.display = show ? 'block' : 'none';
    document.getElementById('sympYes').classList.toggle('active',  show);
    document.getElementById('sympNo').classList.toggle('active', !show);
}

function toggleSymptom(btn) {
    // deactivate "None" if something else picked
    const noneBtn = document.querySelector('.m3-symptom-chips .m3-symptom-btn:first-child');
    if (noneBtn && btn !== noneBtn) noneBtn.classList.remove('active');
    btn.classList.toggle('active');
}

function addCustomSymptom() {
    const input = document.getElementById('customSymptomInput');
    const val   = (input.value || '').trim();
    if (!val) return;

    customSymptoms.push(val);
    renderCustomSymptomTags();
    input.value = '';
}

function removeCustomSymptom(idx) {
    customSymptoms.splice(idx, 1);
    renderCustomSymptomTags();
}

function renderCustomSymptomTags() {
    const list = document.getElementById('customSymptomTags');
    list.innerHTML = customSymptoms.map((s, i) => `
        <span class="m3-tag">
            ${s}
            <span class="m3-tag-remove" onclick="removeCustomSymptom(${i})">×</span>
        </span>`).join('');
}

function collectSymptoms() {
    const chips = [...document.querySelectorAll('.m3-symptom-btn.active')]
        .map(b => b.innerText.trim())
        .filter(s => s !== 'None');
    const all = [...chips, ...customSymptoms].join(', ');
    const hidden = document.getElementById('symptomsHidden');
    if (hidden) hidden.value = all;
}

/* ── Timeline ── */
function selectTimeline(btn, value) {
    document.querySelectorAll('.m3-timeline-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const input = document.getElementById('durationInput');
    if (input) input.value = value;
}

/* ── Chronic ── */
function toggleChronicSection(show) {
    document.getElementById('chronicSection').style.display = show ? 'block' : 'none';
    document.getElementById('chronicYes').classList.toggle('active',  show);
    document.getElementById('chronicNo').classList.toggle('active', !show);
    document.getElementById('chronicHidden').value = show ? 'yes' : 'no';
}

function addChronicDisease() {
    const name   = (document.getElementById('chronicDiseaseInput').value || '').trim();
    const period = (document.getElementById('chronicPeriodInput').value  || '').trim();
    if (!name) return;

    chronicDiseases.push({ name, period });
    renderChronicList();
    document.getElementById('chronicDiseaseInput').value = '';
    document.getElementById('chronicPeriodInput').value  = '';

    // update hidden
    document.getElementById('chronicTypeHidden').value =
        chronicDiseases.map(d => d.name + (d.period ? ` (${d.period})` : '')).join(', ');
}

function removeChronicDisease(idx) {
    chronicDiseases.splice(idx, 1);
    renderChronicList();
    document.getElementById('chronicTypeHidden').value =
        chronicDiseases.map(d => d.name + (d.period ? ` (${d.period})` : '')).join(', ');
}

function renderChronicList() {
    const list = document.getElementById('chronicList');
    list.innerHTML = chronicDiseases.map((d, i) => `
        <div class="m3-chronic-item">
            <div class="m3-chronic-item-info">
                <span class="m3-chronic-item-name">${d.name}</span>
                ${d.period ? `<span class="m3-chronic-item-period">Since: ${d.period}</span>` : ''}
            </div>
            <button type="button" class="m3-chronic-remove" onclick="removeChronicDisease(${i})">×</button>
        </div>`).join('');
}

/* ── SUBMIT ── */
/* ── SUBMIT ── */
async function submitPatientData(e) {
    e.preventDefault();
    collectSymptoms();

    const btn    = document.getElementById('m3SubmitBtn');
    const output = document.getElementById('m3Output');
    const step5  = document.getElementById('step5Panel');

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="m3-spin">⏳</span> Analyzing…`;
    }

    if (step5) step5.style.display = 'block';
    goStep(5);

    if (output) {
        output.innerHTML = `
            <div class="m3-output-empty">
                <div class="loading-pulse" style="width:40px;height:40px;margin:0 auto 14px;"></div>
                <p>AI is building your health report…</p>
            </div>`;
    }

    const form = new FormData(e.target);
    const payload = {};
    form.forEach((v, k) => payload[k] = v);
    payload.previous_answers = { ...payload };

    try {
        const res  = await fetch('/module3/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const text = await res.text();
        let data;
        try { data = JSON.parse(text); }
        catch { throw new Error("Invalid JSON from server: " + text.slice(0, 200)); }

        if (!res.ok) throw new Error(data.error || "Server error " + res.status);

        const result    = data.result    || {};
        const warnings  = result.warnings || [];
        const followups = result.suggestions?.followups  || [];
        const diet      = result.suggestions?.diet       || [];
        const lifestyle = result.suggestions?.lifestyle  || [];
        const nextQs    = data.next_questions || [];

        // ── enrichment maps ──
        const testInfo = {
            hba1c:         { why: "Measures average blood sugar over 3 months — key indicator for diabetes management.", freq: "Every 3 months" },
            glucose:       { why: "Tracks current blood sugar levels. Repeated testing detects patterns of hyperglycemia.", freq: "Every 1 month" },
            creatinine:    { why: "Reflects kidney filtration efficiency. Elevated levels may indicate kidney stress.", freq: "Every 2 months" },
            urea:          { why: "Monitors kidney function and protein metabolism by-products.", freq: "Every 2 months" },
            cholesterol:   { why: "Evaluates cardiovascular risk. High cholesterol increases risk of heart disease.", freq: "Every 6 months" },
            ldl:           { why: "'Bad' cholesterol that can clog arteries. Must be kept in check.", freq: "Every 6 months" },
            triglycerides: { why: "Type of fat in blood; elevated levels linked to heart disease and pancreatitis.", freq: "Every 6 months" },
            alt:           { why: "Liver enzyme — high levels indicate liver inflammation or damage.", freq: "Every 3 months" },
            ast:           { why: "Liver/heart enzyme — helps detect liver disease or muscle damage.", freq: "Every 3 months" },
            bilirubin:     { why: "Byproduct of red blood cell breakdown. High levels may signal liver or bile duct issues.", freq: "Every 3 months" },
            hemoglobin:    { why: "Carries oxygen in blood. Low levels indicate anemia.", freq: "Every 3 months" },
        };

        const dietBenefits = {
            "Reduce sugar intake":   "Lowers blood glucose, reduces insulin resistance, and decreases risk of Type 2 diabetes.",
            "Avoid oily food":       "Reduces LDL cholesterol, lowers risk of arterial blockage and cardiovascular disease.",
            "Increase water intake": "Supports kidney filtration, flushes toxins, and improves overall metabolism.",
            "Eat more vegetables":   "Provides fiber, antioxidants and micronutrients that support immunity and gut health.",
            "Reduce salt intake":    "Lowers blood pressure and reduces risk of hypertension and kidney damage.",
            "High-fiber diet":       "Improves digestion, regulates blood sugar, and lowers cholesterol.",
            "Increase protein":      "Supports muscle repair, immune function, and enzyme production.",
        };

        const lifestyleBenefits = {
            "Exercise regularly":      "Improves cardiovascular health, regulates blood sugar, boosts mood, and maintains healthy weight.",
            "Maintain proper sleep":   "Supports immune function, hormonal balance, and cognitive performance.",
            "Monitor symptoms":        "Early detection of worsening conditions allows for timely medical intervention.",
            "Stay hydrated":           "Optimizes kidney function, digestion, and energy levels.",
            "Avoid smoking":           "Dramatically reduces risk of cancer, heart disease, and respiratory illness.",
            "Reduce alcohol":          "Protects liver health, lowers blood pressure, and improves sleep quality.",
            "Manage stress":           "Reduces cortisol levels, lowers blood pressure, and improves mental wellbeing.",
        };

        function getTestInfo(name) {
            const key = Object.keys(testInfo).find(k => name.toLowerCase().includes(k));
            return key ? testInfo[key] : { why: "Monitoring this value helps track your health trend over time.", freq: "As advised by doctor" };
        }

        function getDietBenefit(item) {
            const key = Object.keys(dietBenefits).find(k => item.toLowerCase().includes(k.toLowerCase().split(" ")[0]));
            return key ? dietBenefits[key] : "Supports overall health and helps maintain optimal body function.";
        }

        function getLifestyleBenefit(item) {
            const key = Object.keys(lifestyleBenefits).find(k => item.toLowerCase().includes(k.toLowerCase().split(" ")[0]));
            return key ? lifestyleBenefits[key] : "Contributes to long-term wellbeing and disease prevention.";
        }

        // ── render helpers ──
        function renderWarnings(items) {
            if (!items.length) return `<div class="m3-empty-section">✓ No immediate warnings identified</div>`;
            return items.map(i => `
                <div class="m3-rich-item m3-rich-warning">
                    <div class="m3-rich-icon">⚠</div>
                    <div class="m3-rich-body">
                        <div class="m3-rich-title">${i}</div>
                    </div>
                </div>`).join('');
        }

        function renderFollowups(items) {
            if (!items.length) return `<div class="m3-empty-section">No follow-up tests required at this time</div>`;
            return items.map(i => {
                const info = getTestInfo(i);
                return `
                <div class="m3-rich-item m3-rich-followup">
                    <div class="m3-rich-icon">🧪</div>
                    <div class="m3-rich-body">
                        <div class="m3-rich-title">${i}</div>
                        <div class="m3-rich-desc">${info.why}</div>
                    </div>
                    <div class="m3-rich-badge">${info.freq}</div>
                </div>`;
            }).join('');
        }

        function renderDiet(items) {
            if (!items.length) return `<div class="m3-empty-section">No specific dietary restrictions flagged</div>`;
            return items.map(i => `
                <div class="m3-rich-item m3-rich-diet">
                    <div class="m3-rich-icon">🥗</div>
                    <div class="m3-rich-body">
                        <div class="m3-rich-title">${i}</div>
                        <div class="m3-rich-desc">${getDietBenefit(i)}</div>
                    </div>
                </div>`).join('');
        }

        function renderLifestyle(items) {
            if (!items.length) return `<div class="m3-empty-section">No specific lifestyle changes flagged</div>`;
            return items.map(i => `
                <div class="m3-rich-item m3-rich-lifestyle">
                    <div class="m3-rich-icon">💪</div>
                    <div class="m3-rich-body">
                        <div class="m3-rich-title">${i}</div>
                        <div class="m3-rich-desc">${getLifestyleBenefit(i)}</div>
                    </div>
                </div>`).join('');
        }

        function renderFollowupQs(items) {
            if (!items.length) return '';
            return `
            <div class="m3-section">
                <div class="m3-section-title">🔁 Ask AI About Your Results</div>
                <div class="m3-followup-qs-grid">
                    ${items.map(q => `
                        <button class="m3-followup-q-btn" onclick="sendToModule2Chat('${q.replace(/'/g,"\\'")}')">
                            <span class="m3-fq-icon">💬</span>
                            <span>${q}</span>
                        </button>`).join('')}
                </div>
            </div>`;
        }

        output.innerHTML = `
            <div class="m3-section">
                <div class="m3-section-title">⚠ Warnings</div>
                ${renderWarnings(warnings)}
            </div>
            <div class="m3-section">
                <div class="m3-section-title">🧪 Follow-up Tests &amp; Why</div>
                ${renderFollowups(followups)}
            </div>
            <div class="m3-section">
                <div class="m3-section-title">🥗 Diet Plan &amp; Benefits</div>
                ${renderDiet(diet)}
            </div>
            <div class="m3-section">
                <div class="m3-section-title">💪 Lifestyle Changes &amp; Benefits</div>
                ${renderLifestyle(lifestyle)}
            </div>
            ${renderFollowupQs(nextQs)}
        `;

        // store output data globally for PDF
        window._m3LastResult = { warnings, followups, diet, lifestyle, nextQs, getTestInfo, getDietBenefit, getLifestyleBenefit };

        output.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
        console.error("MODULE 3 ERROR:", err);
        if (output) output.innerHTML = `
            <div class="m3-output-empty">
                <p style="color:var(--high);">❌ ${err.message}</p>
            </div>`;
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" stroke-width="1.3"/>
                    <path d="M5 7.5l2 2 3-3" stroke="currentColor" stroke-width="1.3"
                        stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Analyze with AI`;
        }
    }
}

/* ── Send follow-up question to Module 2 chatbot ── */
function sendToModule2Chat(question) {
    // Store the question in sessionStorage so module2 picks it up
    sessionStorage.setItem('m3_autoask', question);
    window.location.href = '/module2';
}

/* ── SAVE AS PDF ── */
function saveAsPDF() {
    const r = window._m3LastResult;
    if (!r) { alert('Please run analysis first.'); return; }

    const pd     = document.getElementById('patientData');
    const name   = pd?.getAttribute('data-name')   || 'Patient';
    const age    = pd?.getAttribute('data-age')    || '';
    const gender = pd?.getAttribute('data-gender') || '';

    const scoreEl  = document.querySelector('.score-text');
    const scoreNum = scoreEl ? scoreEl.querySelector('span:first-child').textContent : '—';

    const metaHigh   = document.querySelector('.meta-high')?.textContent   || '';
    const metaLow    = document.querySelector('.meta-low')?.textContent    || '';
    const metaNormal = document.querySelector('.meta-normal')?.textContent || '';

    const now    = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
    const timeStr = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });

    function pdfSection(emoji, title, items, renderFn) {
        if (!items.length) return '';
        return `
        <div class="pdf-section">
            <div class="pdf-section-header">
                <span class="pdf-section-emoji">${emoji}</span>
                <span class="pdf-section-title">${title}</span>
            </div>
            <div class="pdf-section-body">
                ${items.map(renderFn).join('')}
            </div>
        </div>`;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>MediScan Report — ${name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', sans-serif;
    background: #f8faff;
    color: #1a2236;
    font-size: 13px;
    line-height: 1.6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    max-width: 860px;
    margin: 0 auto;
    background: white;
    min-height: 100vh;
  }

  /* ── HEADER ── */
  .pdf-header {
    background: linear-gradient(135deg, #0b0f14 0%, #131b24 100%);
    padding: 36px 48px 28px;
    position: relative;
    overflow: hidden;
  }

  .pdf-header::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 220px; height: 220px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(20,210,160,0.15) 0%, transparent 70%);
  }

  .pdf-header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    position: relative;
    z-index: 1;
  }

  .pdf-logo-name {
    font-size: 24px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.5px;
  }

  .pdf-logo-accent {
    color: #14d2a0;
  }

  .pdf-logo-sub {
    font-size: 10px;
    color: rgba(255,255,255,0.45);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-top: 4px;
    font-family: 'JetBrains Mono', monospace;
  }

  .pdf-header-meta {
    text-align: right;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10.5px;
    color: rgba(255,255,255,0.45);
    line-height: 1.8;
  }

  .pdf-report-label {
    margin-top: 28px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(20,210,160,0.8);
    position: relative;
    z-index: 1;
  }

  /* ── PATIENT + SCORE ── */
  .pdf-patient-band {
    background: #f0f6ff;
    border-bottom: 1px solid #e0e8f8;
    padding: 24px 48px;
    display: flex;
    align-items: center;
    gap: 28px;
  }

  .pdf-avatar {
    width: 52px; height: 52px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b7de8, #14d2a0);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    font-weight: 800;
    color: white;
    flex-shrink: 0;
  }

  .pdf-patient-info { flex: 1; }
  .pdf-patient-name {
    font-size: 18px;
    font-weight: 700;
    color: #1a2236;
  }

  .pdf-patient-tags {
    display: flex;
    gap: 10px;
    margin-top: 6px;
    flex-wrap: wrap;
  }

  .pdf-tag {
    font-size: 11px;
    color: #4a5980;
    background: #e8eef8;
    padding: 3px 10px;
    border-radius: 20px;
    font-family: 'JetBrains Mono', monospace;
  }

  .pdf-score-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .pdf-score-num {
    font-size: 40px;
    font-weight: 800;
    color: #3b7de8;
    font-family: 'JetBrains Mono', monospace;
    line-height: 1;
  }

  .pdf-score-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #8a9ab8;
    font-weight: 700;
  }

  .pdf-score-counts {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  .pdf-cnt {
    font-size: 10.5px;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 20px;
  }

  .pdf-cnt-high   { color: #e02a42; background: #ffeef0; }
  .pdf-cnt-low    { color: #c47f00; background: #fff8e6; }
  .pdf-cnt-normal { color: #0a9e61; background: #edfff6; }

  /* ── BODY ── */
  .pdf-body { padding: 32px 48px 48px; }

  .pdf-disclaimer {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 11.5px;
    color: #92400e;
    margin-bottom: 28px;
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  .pdf-disclaimer-icon { font-size: 14px; flex-shrink: 0; }

  /* ── SECTIONS ── */
  .pdf-section {
    margin-bottom: 28px;
    page-break-inside: avoid;
  }

  .pdf-section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e8eef8;
  }

  .pdf-section-emoji { font-size: 16px; }

  .pdf-section-title {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #4a5980;
  }

  .pdf-section-body { display: flex; flex-direction: column; gap: 8px; }

  /* ── ITEM CARDS ── */
  .pdf-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 8px;
    border-left: 3px solid;
  }

  .pdf-item-icon {
    font-size: 16px;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .pdf-item-content { flex: 1; }

  .pdf-item-title {
    font-size: 13px;
    font-weight: 600;
    color: #1a2236;
    margin-bottom: 3px;
  }

  .pdf-item-desc {
    font-size: 11.5px;
    color: #4a5980;
    line-height: 1.55;
  }

  .pdf-item-badge {
    flex-shrink: 0;
    font-size: 10.5px;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
    background: #e8eef8;
    color: #3b7de8;
    white-space: nowrap;
    align-self: flex-start;
    margin-top: 2px;
  }

  .pdf-item-warning  { background: #fff5f5; border-color: #e02a42; }
  .pdf-item-followup { background: #f0f4ff; border-color: #3b7de8; }
  .pdf-item-diet     { background: #f0fff8; border-color: #0a9e61; }
  .pdf-item-lifestyle{ background: #fffbf0; border-color: #c47f00; }

  .pdf-empty { font-size: 12px; color: #8a9ab8; font-style: italic; padding: 8px 0; }

  /* ── FOOTER ── */
  .pdf-footer {
    background: #f0f4fa;
    border-top: 1px solid #e0e8f8;
    padding: 20px 48px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .pdf-footer-left {
    font-size: 11px;
    color: #8a9ab8;
    line-height: 1.6;
    max-width: 500px;
  }

  .pdf-footer-right {
    font-size: 10.5px;
    font-family: 'JetBrains Mono', monospace;
    color: #8a9ab8;
    text-align: right;
  }

  @media print {
    body { background: white; }
    .page { box-shadow: none; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="pdf-header">
    <div class="pdf-header-row">
      <div>
        <div class="pdf-logo-name">Medi<span class="pdf-logo-accent">Scan</span> AI</div>
        <div class="pdf-logo-sub">AI Diagnostic System</div>
      </div>
      <div class="pdf-header-meta">
        <div>${dateStr}</div>
        <div>${timeStr}</div>
        <div>AI Health Report</div>
      </div>
    </div>
    <div class="pdf-report-label">Personalized Health Insights Report</div>
  </div>

  <!-- PATIENT BAND -->
  <div class="pdf-patient-band">
    <div class="pdf-avatar">${(name[0] || '?').toUpperCase()}</div>
    <div class="pdf-patient-info">
      <div class="pdf-patient-name">${name}</div>
      <div class="pdf-patient-tags">
        ${age    ? `<span class="pdf-tag">Age: ${age}</span>` : ''}
        ${gender ? `<span class="pdf-tag">${gender}</span>`   : ''}
        <span class="pdf-tag">Report: ${dateStr}</span>
      </div>
    </div>
    <div class="pdf-score-block">
      <div class="pdf-score-num">${scoreNum}%</div>
      <div class="pdf-score-label">Health Score</div>
      <div class="pdf-score-counts">
        <span class="pdf-cnt pdf-cnt-high">${metaHigh}</span>
        <span class="pdf-cnt pdf-cnt-low">${metaLow}</span>
        <span class="pdf-cnt pdf-cnt-normal">${metaNormal}</span>
      </div>
    </div>
  </div>

  <!-- BODY -->
  <div class="pdf-body">

    <div class="pdf-disclaimer">
      <span class="pdf-disclaimer-icon">⚠</span>
      <span>This report is generated by AI for informational purposes only. It does not replace professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before making health decisions.</span>
    </div>

    ${r.warnings.length ? `
    <div class="pdf-section">
      <div class="pdf-section-header">
        <span class="pdf-section-emoji">⚠</span>
        <span class="pdf-section-title">Health Warnings</span>
      </div>
      <div class="pdf-section-body">
        ${r.warnings.map(i => `
          <div class="pdf-item pdf-item-warning">
            <div class="pdf-item-icon">🚨</div>
            <div class="pdf-item-content">
              <div class="pdf-item-title">${i}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>` : ''}

    <div class="pdf-section">
      <div class="pdf-section-header">
        <span class="pdf-section-emoji">🧪</span>
        <span class="pdf-section-title">Follow-up Tests Recommended</span>
      </div>
      <div class="pdf-section-body">
        ${r.followups.length ? r.followups.map(i => {
            const info = r.getTestInfo(i);
            return `
            <div class="pdf-item pdf-item-followup">
              <div class="pdf-item-icon">🔬</div>
              <div class="pdf-item-content">
                <div class="pdf-item-title">${i}</div>
                <div class="pdf-item-desc">${info.why}</div>
              </div>
              <div class="pdf-item-badge">${info.freq}</div>
            </div>`;
        }).join('') : '<div class="pdf-empty">No follow-up tests required at this time.</div>'}
      </div>
    </div>

    <div class="pdf-section">
      <div class="pdf-section-header">
        <span class="pdf-section-emoji">🥗</span>
        <span class="pdf-section-title">Diet Plan &amp; Benefits</span>
      </div>
      <div class="pdf-section-body">
        ${r.diet.length ? r.diet.map(i => `
          <div class="pdf-item pdf-item-diet">
            <div class="pdf-item-icon">🌱</div>
            <div class="pdf-item-content">
              <div class="pdf-item-title">${i}</div>
              <div class="pdf-item-desc">${r.getDietBenefit(i)}</div>
            </div>
          </div>`).join('') : '<div class="pdf-empty">No specific dietary changes recommended.</div>'}
      </div>
    </div>

    <div class="pdf-section">
      <div class="pdf-section-header">
        <span class="pdf-section-emoji">💪</span>
        <span class="pdf-section-title">Lifestyle Changes &amp; Benefits</span>
      </div>
      <div class="pdf-section-body">
        ${r.lifestyle.length ? r.lifestyle.map(i => `
          <div class="pdf-item pdf-item-lifestyle">
            <div class="pdf-item-icon">✨</div>
            <div class="pdf-item-content">
              <div class="pdf-item-title">${i}</div>
              <div class="pdf-item-desc">${r.getLifestyleBenefit(i)}</div>
            </div>
          </div>`).join('') : '<div class="pdf-empty">No specific lifestyle changes flagged.</div>'}
      </div>
    </div>

  </div>

  <!-- FOOTER -->
  <div class="pdf-footer">
    <div class="pdf-footer-left">
      This report was generated by MediScan AI using pattern analysis of your uploaded blood report.
      Results are indicative only. Please consult your doctor for a full evaluation.
    </div>
    <div class="pdf-footer-right">
      MediScan AI<br>
      ${dateStr}
    </div>
  </div>

</div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    setTimeout(() => win.print(), 800);
}