
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
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const { email, workspaceId, role, workspaceName, inviterName }: InviteUserRequest = await req.json();

    if (!email || !workspaceId || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Check if user exists and is already a member
    const { data: userProfile } = await supabase.from('profiles').select('id').eq('email', email).single();
    if (userProfile) {
      const { data: member } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userProfile.id)
        .single();
      if (member) {
        return new Response(JSON.stringify({ error: 'User is already a member of this workspace' }), { status: 409 });
      }
    }

    // Check if there is already a pending invitation
    const { data: existingInvite } = await supabase
      .from('invitations')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('email', email)
      .single();
    if (existingInvite) {
      return new Response(JSON.stringify({ error: 'An invitation has already been sent to this email address' }), { status: 409 });
    }

    // Create invitation
    const token = crypto.randomUUID();
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const { error: insertError } = await supabase.from('invitations').insert({
      workspace_id: workspaceId,
      email: email,
      role: role,
      token: token,
      invited_by: authUser.user.id,
    });

    if (insertError) {
      throw new Error(`Failed to create invitation record: ${insertError.message}`);
    }

    const appUrl = (Deno.env.get('SUPABASE_URL') ?? 'http://localhost:3000').replace('/supabase', '');
    const inviteUrl = `${appUrl}/accept-invite?token=${token}`;

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Knowledge File <notifications@resend.dev>",
      to: [email],
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
      throw new Error(`Failed to send email: ${JSON.stringify(emailError)}`);
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
