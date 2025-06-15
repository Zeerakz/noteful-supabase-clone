
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteUserRequest {
  email: string;
  workspaceId: string;
  role: 'admin' | 'member' | 'guest';
  workspaceName: string;
  inviterName: string;
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
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication error' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { email, workspaceId, role, workspaceName, inviterName }: InviteUserRequest = await req.json();

    if (!email || !workspaceId || !role || !workspaceName || !inviterName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      return new Response(JSON.stringify({ error: 'User is already a member of this workspace' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id, expires_at')
      .eq('workspace_id', workspaceId)
      .ilike('email', email.toLowerCase()) // Case-insensitive check
      .gt('expires_at', new Date().toISOString())
      .single();

    let invitationId: string;
    let token: string;

    if (existingInvitation) {
      // Update existing invitation with new role and extend expiration
      const newToken = crypto.randomUUID();
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ 
          role, 
          token: newToken, 
          expires_at: newExpiresAt.toISOString(),
          invited_by: user.id 
        })
        .eq('id', existingInvitation.id);

      if (updateError) throw updateError;
      
      invitationId = existingInvitation.id;
      token = newToken;
    } else {
      // Create new invitation
      token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      const { data: newInvitation, error: insertError } = await supabase
        .from('invitations')
        .insert({
          email: email.toLowerCase(), // Store in lowercase for consistency
          workspace_id: workspaceId,
          role,
          token,
          invited_by: user.id,
          expires_at: expiresAt.toISOString()
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      invitationId = newInvitation.id;
    }

    // Log analytics
    await supabase
      .from('invitation_analytics')
      .insert({
        invitation_id: invitationId,
        workspace_id: workspaceId,
        event_type: existingInvitation ? 'resent' : 'sent',
        user_agent: req.headers.get('User-Agent'),
        ip_address: req.headers.get('X-Forwarded-For') || req.headers.get('X-Real-IP')
      });

    const inviteUrl = `${req.headers.get('origin') || 'https://your-app.com'}/accept-invite?token=${token}`;

    // Try to send email if Resend is configured
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        
        await resend.emails.send({
          from: 'Knowledge File <noreply@knowledgefile.app>',
          to: [email],
          subject: `You've been invited to join ${workspaceName}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1a1a1a; margin: 0;">Knowledge File</h1>
              </div>
              
              <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <h2 style="color: #1a1a1a; margin: 0 0 16px 0;">You're invited!</h2>
                <p style="color: #666; margin: 0 0 16px 0; line-height: 1.5;">
                  <strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> as a <strong>${role}</strong>.
                </p>
                <p style="color: #666; margin: 0; line-height: 1.5;">
                  Click the button below to accept your invitation and start collaborating.
                </p>
              </div>
              
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${inviteUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                  Accept Invitation
                </a>
              </div>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
                <p style="color: #888; font-size: 14px; margin: 0 0 8px 0;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="color: #2563eb; font-size: 14px; word-break: break-all; margin: 0 0 16px 0;">
                  ${inviteUrl}
                </p>
                <p style="color: #888; font-size: 12px; margin: 0;">
                  This invitation will expire in 7 days. If you don't want to receive these emails, you can ignore this message.
                </p>
              </div>
            </div>
          `,
        });

        return new Response(JSON.stringify({ 
          success: true,
          message: 'Invitation sent successfully',
          invite_url: inviteUrl 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Return success with fallback message for testing
        return new Response(JSON.stringify({ 
          success: true,
          testing_fallback: true,
          message: 'Invitation created but email could not be sent',
          invite_url: inviteUrl 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    } else {
      // No Resend configured - return invite URL for testing
      return new Response(JSON.stringify({ 
        success: true,
        testing_fallback: true,
        message: 'Invitation created (email service not configured)',
        invite_url: inviteUrl 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

  } catch (error: any) {
    console.error('Invite User Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};

serve(handler);
