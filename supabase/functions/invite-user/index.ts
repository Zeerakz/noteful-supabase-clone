
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type WorkspaceRole = 'owner' | 'admin' | 'member' | 'guest';

interface InviteUserRequest {
  email: string;
  workspaceId: string;
  role: WorkspaceRole;
  workspaceName: string;
  inviterName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: corsHeaders });
    }
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);

    if (userError) {
      console.error('JWT user fetch error:', userError);
      return new Response(JSON.stringify({ error: `Authentication error: ${userError.message}` }), { status: 401, headers: corsHeaders });
    }
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found or invalid token' }), { status: 401, headers: corsHeaders });
    }

    const { email, workspaceId, role, workspaceName, inviterName }: InviteUserRequest = await req.json();

    if (!email || !workspaceId || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
    }

    // Check if user exists and is already a member (case-insensitive check)
    const { data: userProfile, error: profileError } = await supabase.from('profiles').select('id').ilike('email', email).maybeSingle();
    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(JSON.stringify({ error: `Database error: ${profileError.message}` }), { status: 500, headers: corsHeaders });
    }
    if (userProfile) {
      const { data: member, error: memberError } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userProfile.id)
        .maybeSingle();

      if (memberError) {
        console.error('Member check error:', memberError);
        return new Response(JSON.stringify({ error: `Database error: ${memberError.message}` }), { status: 500, headers: corsHeaders });
      }

      if (member) {
        return new Response(JSON.stringify({ error: 'User is already a member of this workspace' }), { status: 409, headers: corsHeaders });
      }
    }

    // Check if there is already a pending invitation (case-insensitive check)
    // This provides a friendly error before hitting the database constraint.
    const { data: existingInvite, error: inviteCheckError } = await supabase
      .from('invitations')
      .select('id')
      .eq('workspace_id', workspaceId)
      .ilike('email', email)
      .maybeSingle();

    if (inviteCheckError) {
      console.error('Invite check error:', inviteCheckError);
      return new Response(JSON.stringify({ error: `Database error: ${inviteCheckError.message}` }), { status: 500, headers: corsHeaders });
    }

    if (existingInvite) {
      return new Response(JSON.stringify({ error: 'An invitation has already been sent to this email address' }), { status: 409, headers: corsHeaders });
    }

    // Create invitation
    const token = crypto.randomUUID();

    const { error: insertError } = await supabase.from('invitations').insert({
      workspace_id: workspaceId,
      email: email.toLowerCase(), // Store email in lowercase to enforce uniqueness
      role: role,
      token: token,
      invited_by: user.id,
    });

    if (insertError) {
      // The unique index will prevent duplicates. Handle the error for race conditions.
      if (insertError.code === '23505') {
        return new Response(JSON.stringify({ error: 'An invitation has already been sent to this email address.' }), { status: 409, headers: corsHeaders });
      }
      throw new Error(`Failed to create invitation record: ${insertError.message}`);
    }

    const appUrl = (Deno.env.get('SUPABASE_URL') ?? 'http://localhost:3000').replace('/supabase', '');
    const inviteUrl = `${appUrl}/accept-invite?token=${token}`;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Knowledge File <onboarding@resend.dev>",
      to: [email], // Send to the original email address for better user experience
      subject: `You're invited to join ${workspaceName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">You're invited to collaborate!</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0; color: #666;">
              <strong>${inviterName}</strong> has invited you to join <strong>"${workspaceName}"</strong> as a <strong>${role}</strong>.
            </p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
            If you weren't expecting this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error('Resend email error:', emailError);
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'Invitation sent' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Invitation Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};

serve(handler);
