import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://siqgyeujxlnqwyyglyck.supabase.co';
const SUPABASE_KEY = 'sb_publishable_iJuguGlI6xb31jyGgE505Q_vtyDkQP9';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
