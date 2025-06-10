
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting presence cleanup...');

    // Clean up presence records older than 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
    
    const { data, error } = await supabase
      .from('presence')
      .delete()
      .lt('last_heartbeat', thirtySecondsAgo);

    if (error) {
      console.error('Error cleaning up presence:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to cleanup presence records' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Presence cleanup completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Presence cleanup completed',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (err) {
    console.error('Unexpected error in cleanup-presence function:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
