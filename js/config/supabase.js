/* ========================================
   CONFIGURACIÓN DE SUPABASE
   ======================================== */

// TODO: Reemplazar con tus credenciales de Supabase
const SUPABASE_URL = 'https://llasocseadxsndqfibls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYXNvY3NlYWR4c25kcWZpYmxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTgxNDgsImV4cCI6MjA4NjgzNDE0OH0.V2Vqo0SGaKtyV1OWVfNuBx-7JbHTGd_rKhoAbgNy7sM';

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
