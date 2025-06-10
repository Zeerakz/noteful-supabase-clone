
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
  roleName: 'admin' | 'editor' | 'viewer';
  workspaceName: string;
  inviterName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const { 
      email, 
      workspaceId, 
      roleName, 
      workspaceName, 
      inviterName 
    }: InviteUserRequest = await req.json();

    console.log('Processing invitation for:', email, 'to workspace:', workspaceName);

    // Get the role ID for the specified role name
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('role_name', roleName)
      .single();

    if (roleError || !role) {
      throw new Error(`Role '${roleName}' not found`);
    }

    // Check if user already exists in auth.users
    const { data: existingUsers, error: userCheckError } = await supabase.auth.admin.listUsers();
    
    if (userCheckError) {
      throw new Error('Failed to check existing users');
    }

    const existingUser = existingUsers.users.find(user => user.email === email);
    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      
      // Check if user is already a member of this workspace
      const { data: existingMembership, error: membershipCheckError } = await supabase
        .from('workspace_membership')
        .select('id, status')
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId)
        .single();

      if (membershipCheckError && membershipCheckError.code !== 'PGRST116') {
        throw new Error('Failed to check existing membership');
      }

      if (existingMembership) {
        return new Response(
          JSON.stringify({ 
            error: `User is already ${existingMembership.status === 'accepted' ? 'a member of' : 'invited to'} this workspace`,
            success: false 
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }
    } else {
      // Create a placeholder user entry for the invitation
      // In a real implementation, you might want to handle this differently
      // For now, we'll create the membership with a placeholder and update it when they sign up
      userId = crypto.randomUUID();
    }

    // Create pending workspace membership
    const { error: membershipError } = await supabase
      .from('workspace_membership')
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
        role_id: role.id,
        status: 'pending',
        invited_at: new Date().toISOString()
      });

    if (membershipError) {
      throw new Error(`Failed to create membership: ${membershipError.message}`);
    }

    // Generate invitation link
    const inviteUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/supabase', '') || 'http://localhost:3000'}/invite/${workspaceId}?email=${encodeURIComponent(email)}&role=${roleName}`;

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: "Knowledge File <notifications@resend.dev>",
      to: [email],
      subject: `You're invited to join ${workspaceName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">You're invited to collaborate!</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0; color: #666;">
              <strong>${inviterName}</strong> has invited you to join <strong>"${workspaceName}"</strong> as a <strong>${roleName}</strong>.
            </p>
            <p style="margin: 0; color: #666;">
              Accept this invitation to start collaborating on pages, databases, and more.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 4px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>New to Knowledge File?</strong> Don't worry! Clicking the link above will guide you through creating your account.
            </p>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
            This invitation was sent by ${inviterName}. If you weren't expecting this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    console.log('Invitation email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation sent successfully',
        messageId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error sending invitation:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send invitation',
        success: false 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
