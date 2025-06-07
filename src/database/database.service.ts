import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DatabaseService {
    private supabase: SupabaseClient;

    constructor() {
        const supabaseUrl = 'https://voiedxrkkrzuidovxusa.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvaWVkeHJra3J6dWlkb3Z4dXNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTMwMjkxNywiZXhwIjoyMDY0ODc4OTE3fQ.AwnL8bIrntCKV3srBf46lQumNSzA73oaIZE6yqXZOQs';
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    getClient(): SupabaseClient {
        return this.supabase;
    }
} 