import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://zlgmzogvpoafnfgstqna.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ216b2d2cG9hZm5mZ3N0cW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMjU0NjUsImV4cCI6MjA4NjcwMTQ2NX0.SREmeECeBtplGtvyRnqfbecgCZJHZPUIeSHby3TXC9k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
