
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AcceptInviteRequest {
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication error' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { token }: AcceptInviteRequest = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing invitation token' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[accept-invitation] Calling RPC for user ${user.id} with token ${token}`);

    const { data, error: rpcError } = await supabase.rpc('accept_invitation', {
      p_token: token,
      p_user_id: user.id,
      p_user_email: user.email,
    });
    
    console.log('[accept-invitation] RPC response data:', JSON.stringify(data));
    console.log('[accept-invitation] RPC response error:', JSON.stringify(rpcError));

    if (rpcError) {
      console.error('[accept-invitation] RPC error:', rpcError);
      throw rpcError;
    }
    
    if (!data) {
      console.error('[accept-invitation] No data returned from accept_invitation function.');
      return new Response(JSON.stringify({ error: "Invitation processing failed: no response from database." }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (data.success === false) {
      console.warn(`[accept-invitation] Invitation not successful: ${data.message}`);
      return new Response(JSON.stringify({ error: data.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    console.log(`[accept-invitation] Invitation successful for workspace ${data.workspace_id}`);
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Accept Invitation Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};

serve(handler);
