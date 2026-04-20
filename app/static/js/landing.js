/* ============================================================
   MEDISCAN AI — landing.js
   Landing page interactivity only.
   Chat history here is ISOLATED from module2's chatHistory.
   ============================================================ */

/* ── POPUP CHAT STATE (isolated from module2) ── */
const popupChatHistory = [];
let popupBusy = false;

/* ── Toggle chat popup ── */
function toggleLandingChat() {
    const popup    = document.getElementById('chatPopup');
    const iconChat = document.querySelector('.fab-icon-chat');
    const iconX    = document.querySelector('.fab-icon-close');

    if (!popup) return;

    const isOpen = popup.classList.contains('open');

    if (isOpen) {
        popup.classList.remove('open');
        if (iconChat) iconChat.style.display = '';
        if (iconX)    iconX.style.display    = 'none';
    } else {
        popup.classList.add('open');
        if (iconChat) iconChat.style.display = 'none';
        if (iconX)    iconX.style.display    = '';
        // Focus input
        setTimeout(() => {
            const inp = document.getElementById('popupInput');
            if (inp) inp.focus();
        }, 300);
    }
}

/* ── Chip click — prefill and send ── */
function popupAsk(btn, question) {
    // Remove all chips once one is clicked (keep conversation clean)
    const chips = document.getElementById('popupChips');
    if (chips) chips.remove();

    // Send the question
    sendPopupMessage(question);
}

/* ── Input submit ── */
function popupSubmit() {
    const inp = document.getElementById('popupInput');
    if (!inp) return;
    const q = inp.value.trim();
    if (!q) return;
    inp.value = '';
    sendPopupMessage(q);
}

/* ── Core send function ── */
async function sendPopupMessage(question) {
    if (popupBusy) return;
    popupBusy = true;

    const messages = document.getElementById('popupMessages');
    if (!messages) return;

    // Remove chips if present
    const chips = document.getElementById('popupChips');
    if (chips) chips.remove();

    // Add user bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'popup-bubble-user';
    userBubble.textContent = question;
    messages.appendChild(userBubble);
    scrollPopup();

    // Save to popup-only history
    popupChatHistory.push({ role: 'user', content: question });

    // Typing indicator
    const typing = document.createElement('div');
    typing.className = 'popup-typing';
    typing.id = 'popupTyping';
    typing.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(typing);
    scrollPopup();

    // Disable send
    const sendBtn = document.querySelector('.popup-send');
    if (sendBtn) sendBtn.disabled = true;

    try {
        // ✅ Uses the same /module2/ask endpoint but with isolated history
        // The server uses session-stored report context but chat history is separate
        const response = await fetch('/module2/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: question,
                history: popupChatHistory.slice(-8)   // max 8 turns for popup
            })
        });

        const data = await response.json();
        const answer = data.answer || data.rag_response || 'Sorry, I could not get a response.';

        // Save AI reply to popup history only
        popupChatHistory.push({ role: 'assistant', content: answer });

        // Remove typing
        const typingEl = document.getElementById('popupTyping');
        if (typingEl) typingEl.remove();

        // Add AI bubble with simple text (strip heavy markdown for popup)
        const aiBubble = document.createElement('div');
        aiBubble.className = 'popup-bubble-ai';
        aiBubble.innerHTML = popupFormatResponse(answer);
        messages.appendChild(aiBubble);
        scrollPopup();

    } catch (err) {
        const typingEl = document.getElementById('popupTyping');
        if (typingEl) typingEl.remove();

        const errBubble = document.createElement('div');
        errBubble.className = 'popup-bubble-ai';
        errBubble.textContent = '⚠ Connection error. Please try again.';
        messages.appendChild(errBubble);
        scrollPopup();
    } finally {
        if (sendBtn) sendBtn.disabled = false;
        popupBusy = false;
    }
}

/* ── Lightweight markdown formatter for popup (no code blocks, simpler) ── */
function popupFormatResponse(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
        .replace(/^[\-•] (.+)$/gm, '• $1')
        .replace(/\n\n+/g, '<br><br>')
        .replace(/\n/g, '<br>');
}

/* ── Scroll popup to bottom ── */
function scrollPopup() {
    const messages = document.getElementById('popupMessages');
    if (messages) messages.scrollTop = messages.scrollHeight;
}

/* ── Close popup when clicking outside ── */
document.addEventListener('click', function(e) {
    const popup  = document.getElementById('chatPopup');
    const fab    = document.getElementById('fabChat');
    if (!popup || !fab) return;
    if (popup.classList.contains('open') &&
        !popup.contains(e.target) &&
        !fab.contains(e.target)) {
        toggleLandingChat();
    }
});

/* ── Handle Enter key on popup input ── */
document.addEventListener('DOMContentLoaded', function() {
    const inp = document.getElementById('popupInput');
    if (inp) {
        inp.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                popupSubmit();
            }
        });
    }

    /* ── Animate module cards on scroll ── */
    const cards = document.querySelectorAll('.module-card, .how-step');
    if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        cards.forEach((card, i) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(24px)';
            card.style.transition = `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`;
            obs.observe(card);
        });
    }

    /* ── Animate score bar in report preview ── */
    const scoreFill = document.querySelector('.rp-score-fill');
    if (scoreFill) {
        setTimeout(() => { scoreFill.style.width = '72%'; }, 800);
    }
});

// Auto highlight active nav link
document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;

    document.querySelectorAll(".land-nav-link").forEach(link => {
        const href = link.getAttribute("href");

        if (href === path || (href !== "/" && path.startsWith(href))) {
            link.classList.add("active");
        }
    });
});