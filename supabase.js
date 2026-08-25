import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vdqhxrrcutprxrixzuyj.supabase.co";

const supabaseKey = "sb_publishable_lLrcj5ElYNm0hRsi6LIEJg_dXjC6SBC";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);