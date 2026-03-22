import { getSession, getAccountProfile, updateUsername, updatePassword, updateAvatarUrl, deleteMyAccount } from './auth.js';

const backBtn = document.getElementById('account-back-btn');
const emailEl = document.getElementById('account-email');
const usernameForm = document.getElementById('username-form');
const usernameInput = document.getElementById('username-input');
const avatarForm = document.getElementById('avatar-form');
const avatarUrlInput = document.getElementById('avatar-url-input');
const avatarPreview = document.getElementById('account-avatar-preview');
const passwordForm = document.getElementById('password-form');
const newPasswordInput = document.getElementById('new-password-input');
const confirmPasswordInput = document.getElementById('confirm-password-input');
const deleteConfirmInput = document.getElementById('delete-confirm-input');
const deleteAccountBtn = document.getElementById('delete-account-btn');
const statusEl = document.getElementById('account-status');
const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23aebcc5"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

function setAvatarPreview(url) {
    if (!avatarPreview) return;
    avatarPreview.onerror = null;
    avatarPreview.src = url || DEFAULT_AVATAR;
    avatarPreview.onerror = () => {
        avatarPreview.onerror = null;
        avatarPreview.src = DEFAULT_AVATAR;
    };
}

function showStatus(message, type = 'info') {
    statusEl.textContent = message;
    statusEl.classList.remove('hidden', 'success', 'error', 'info');
    statusEl.classList.add(type);

    window.clearTimeout(showStatus._timer);
    showStatus._timer = setTimeout(() => {
        statusEl.classList.add('hidden');
    }, 3200);
}

async function init() {
    const session = await getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    const profile = await getAccountProfile();
    emailEl.textContent = session.user.email || profile?.email || '-';
    usernameInput.value = profile?.username || session.user.user_metadata?.username || '';

    const avatarUrl = session.user.user_metadata?.avatar_url || '';
    setAvatarPreview(avatarUrl);
    if (avatarUrlInput) avatarUrlInput.value = session.user.user_metadata?.avatar_url || '';
}

if (backBtn) {
    backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'index.html';
    });
}

if (usernameForm) {
    usernameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();

        const result = await updateUsername(username);
        if (!result.success) {
            showStatus(result.message || 'Failed to update username.', 'error');
            return;
        }

        showStatus('Username updated.', 'success');
    });
}

if (avatarForm) {
    avatarForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const avatarUrl = avatarUrlInput.value.trim();

        const result = await updateAvatarUrl(avatarUrl);
        if (!result.success) {
            showStatus(result.message || 'Failed to update avatar.', 'error');
            return;
        }

        setAvatarPreview(avatarUrl);
        showStatus('Avatar updated.', 'success');
    });
}

if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const pass1 = newPasswordInput.value;
        const pass2 = confirmPasswordInput.value;

        if (pass1 !== pass2) {
            showStatus('Passwords do not match.', 'error');
            return;
        }

        const result = await updatePassword(pass1);
        if (!result.success) {
            showStatus(result.message || 'Failed to update password.', 'error');
            return;
        }

        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        showStatus('Password updated.', 'success');
    });
}

if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const phrase = (deleteConfirmInput?.value || '').trim();
        if (phrase !== 'DELETE') {
            showStatus('Type DELETE to confirm account deletion.', 'error');
            return;
        }

        const confirmed = confirm('Delete your account permanently? This cannot be undone.');
        if (!confirmed) return;

        deleteAccountBtn.disabled = true;
        deleteAccountBtn.textContent = 'Deleting...';

        const result = await deleteMyAccount();
        if (!result.success) {
            deleteAccountBtn.disabled = false;
            deleteAccountBtn.textContent = 'Delete Account';
            showStatus(result.message || 'Failed to delete account.', 'error');
            return;
        }

        showStatus('Account deleted. Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 700);
    });
}

init();
