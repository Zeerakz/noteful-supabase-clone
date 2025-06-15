
import 'https://deno.land/x/xhr@0.1.0/mod.ts'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const openAIApiKey = Deno.env.get('Open AI')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { pageId, prompt } = await req.json()

    if (!pageId || !prompt) {
      return new Response(JSON.stringify({ error: 'pageId and prompt are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    if (!openAIApiKey) {
       return new Response(JSON.stringify({ error: 'OpenAI API key is not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!)

    const { data: blocks, error: blocksError } = await supabaseAdmin
      .from('blocks')
      .select('content, type')
      .eq('parent_id', pageId)

    if (blocksError) {
      throw new Error(`Failed to fetch page content: ${blocksError.message}`)
    }

    const pageContent = blocks
      .map(block => {
        if (block.type === 'text' && block.content?.text) {
          return block.content.text
        }
        if (block.type === 'heading' && block.content?.text) {
          return block.content.text
        }
        return ''
      })
      .join('\n\n')
      .trim()
      
    if (!pageContent) {
      return new Response(JSON.stringify({ result: "Page content is empty." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are an AI assistant inside a Notion-like application. Your task is to process the following page content based on the user's instruction and return a structured, concise response. Do not add any conversational fluff. Just return the result.`

    const openAIPrompt = `
      Page Content:
      ---
      ${pageContent}
      ---

      User's Instruction:
      ---
      ${prompt}
      ---
    `
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: openAIPrompt },
        ],
        max_tokens: 200,
        temperature: 0.3
      }),
    })

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`OpenAI API request failed: ${response.statusText} - ${JSON.stringify(errorBody)}`);
    }

    const data = await response.json()
    const result = data.choices[0].message.content

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in ai-custom-autofill function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
