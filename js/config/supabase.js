/* ========================================
   CONFIGURACIÓN DE SUPABASE
   ======================================== */

// TODO: Reemplazar con tus credenciales de Supabase
const SUPABASE_URL = 'https://zcxarirzmghjwezzxvoh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeGFyaXJ6bWdoandlenp4dm9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMzkwODAsImV4cCI6MjA4NzgxNTA4MH0.UWdl0MzuCaOwnvCHC1gsPuFchW3sOHsI5dHO1y5J--4';

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
