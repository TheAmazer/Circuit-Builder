import { supabase } from './supabaseClient.js';

export async function loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });

    if (error) {
        console.error('Error logging in with Google:', error.message);
        alert('Login failed: ' + error.message);
    }
}

export async function loginWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('Error logging in:', error.message);
        alert('Login failed: ' + error.message);
        return null;
    }
    return data;
}

export async function signUp(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username
            }
        }
    });

    if (error) {
        console.error('Error signing up:', error.message);
        alert('Registration failed: ' + error.message);
        return null;
    }

    return data;
}

export async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error.message);
    } else {
        window.location.reload();
    }
}

export async function getSession() {
    const { data, error } = await supabase.auth.getSession();
    return data.session;
}

export function onAuthStateChange(callback) {
    supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
}

export async function getAccountProfile() {
    const session = await getSession();
    if (!session) return null;

    const { data, error } = await supabase
        .from('accounts')
        .select('id, username, email, created_at')
        .eq('id', session.user.id)
        .maybeSingle();

    if (error) {
        console.error('Error fetching account profile:', error.message);
        return null;
    }

    return data;
}

export async function updateUsername(username) {
    const session = await getSession();
    if (!session) return { success: false, message: 'Not signed in.' };

    const trimmed = (username || '').trim();
    if (!trimmed) return { success: false, message: 'Username is required.' };
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
        return { success: false, message: 'Username can only contain letters, numbers, and underscores.' };
    }

    const { data: existing, error: existingError } = await supabase
        .from('accounts')
        .select('id')
        .eq('username', trimmed)
        .maybeSingle();

    if (existingError) {
        return { success: false, message: existingError.message };
    }

    if (existing && existing.id !== session.user.id) {
        return { success: false, message: 'Username is already taken.' };
    }

    const { error: authError } = await supabase.auth.updateUser({
        data: { username: trimmed }
    });

    if (authError) {
        return { success: false, message: authError.message };
    }

    const { error: accountError } = await supabase
        .from('accounts')
        .upsert(
            {
                id: session.user.id,
                username: trimmed,
                email: session.user.email
            },
            { onConflict: 'id' }
        );

    if (accountError) {
        return { success: false, message: accountError.message };
    }

    return { success: true, message: 'Username updated successfully.' };
}

export async function updatePassword(newPassword) {
    const password = (newPassword || '').trim();
    if (password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters.' };
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
        return { success: false, message: error.message };
    }

    return { success: true, message: 'Password updated successfully.' };
}

export async function updateAvatarUrl(avatarUrl) {
    const session = await getSession();
    if (!session) return { success: false, message: 'Not signed in.' };

    const trimmed = (avatarUrl || '').trim();
    if (!trimmed) {
        return { success: false, message: 'Avatar URL is required.' };
    }

    const isValidUrl = /^https?:\/\/.+/i.test(trimmed) || trimmed.startsWith('data:image/');
    if (!isValidUrl) {
        return { success: false, message: 'Avatar URL must start with http(s):// or be a data:image URI.' };
    }

    const { error } = await supabase.auth.updateUser({
        data: { avatar_url: trimmed }
    });

    if (error) {
        return { success: false, message: error.message };
    }

    return { success: true, message: 'Avatar updated successfully.' };
}

export async function deleteMyAccount() {
    const session = await getSession();
    if (!session) {
        return { success: false, message: 'Not signed in.' };
    }

    const { error } = await supabase.rpc('delete_my_account');
    if (error) {
        return { success: false, message: error.message };
    }

    await supabase.auth.signOut();
    return { success: true, message: 'Account deleted successfully.' };
}
