import { supabase } from './supabaseClient.js';

export async function saveCircuit(name, circuitData, isPublic = false) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        alert('You must be logged in to save circuits.');
        return null;
    }

    const { data, error } = await supabase
        .from('circuits')
        .upsert({
            user_id: user.id,
            name: name,
            data: circuitData,
            is_public: isPublic,
            created_at: new Date().toISOString()
        }, { onConflict: 'user_id, name' }) // Assuming unique constraint on user_id and name for simplicity
        .select();

    if (error) {
        console.error('Error saving circuit:', error.message);
        alert('Error saving circuit: ' + error.message);
        return null;
    }

    return data[0];
}

export async function loadCircuits() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from('circuits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading circuits:', error.message);
        return [];
    }

    return data;
}

export async function deleteCircuit(id) {
    const { error } = await supabase
        .from('circuits')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting circuit:', error.message);
        alert('Error deleting circuit: ' + error.message);
        return false;
    }

    return true;
}
