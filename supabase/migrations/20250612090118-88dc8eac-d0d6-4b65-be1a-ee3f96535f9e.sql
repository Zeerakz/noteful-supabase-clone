
-- Create database_templates table for pre-built and custom templates
CREATE TABLE public.database_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'custom',
  is_system_template boolean NOT NULL DEFAULT false,
  template_data jsonb NOT NULL,
  preview_image_url text,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create view_templates table for reusable view configurations
CREATE TABLE public.view_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  view_type text NOT NULL,
  template_config jsonb NOT NULL,
  is_system_template boolean NOT NULL DEFAULT false,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.database_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.view_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for database_templates
CREATE POLICY "Users can view system templates and templates in their workspaces" 
ON public.database_templates 
FOR SELECT 
USING (
  is_system_template = true OR
  (workspace_id IS NOT NULL AND workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_membership wm 
    WHERE wm.user_id = auth.uid() 
    AND wm.status = 'accepted'
  ))
);

CREATE POLICY "Users can create templates in their workspaces" 
ON public.database_templates 
FOR INSERT 
WITH CHECK (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_membership wm 
    JOIN public.roles r ON wm.role_id = r.id
    WHERE wm.user_id = auth.uid() 
    AND wm.status = 'accepted'
    AND r.role_name IN ('editor', 'admin')
  )
  AND auth.uid() = created_by
  AND is_system_template = false
);

CREATE POLICY "Users can update their own templates" 
ON public.database_templates 
FOR UPDATE 
USING (
  created_by = auth.uid() AND
  is_system_template = false AND
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_membership wm 
    WHERE wm.user_id = auth.uid() 
    AND wm.status = 'accepted'
  )
);

CREATE POLICY "Users can delete their own templates" 
ON public.database_templates 
FOR DELETE 
USING (
  created_by = auth.uid() AND
  is_system_template = false
);

-- RLS policies for view_templates
CREATE POLICY "Users can view system view templates and templates in their workspaces" 
ON public.view_templates 
FOR SELECT 
USING (
  is_system_template = true OR
  (workspace_id IS NOT NULL AND workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_membership wm 
    WHERE wm.user_id = auth.uid() 
    AND wm.status = 'accepted'
  ))
);

CREATE POLICY "Users can create view templates in their workspaces" 
ON public.view_templates 
FOR INSERT 
WITH CHECK (
  workspace_id IN (
    SELECT wm.workspace_id 
    FROM public.workspace_membership wm 
    JOIN public.roles r ON wm.role_id = r.id
    WHERE wm.user_id = auth.uid() 
    AND wm.status = 'accepted'
    AND r.role_name IN ('editor', 'admin')
  )
  AND auth.uid() = created_by
  AND is_system_template = false
);

CREATE POLICY "Users can update their own view templates" 
ON public.view_templates 
FOR UPDATE 
USING (
  created_by = auth.uid() AND
  is_system_template = false
);

CREATE POLICY "Users can delete their own view templates" 
ON public.view_templates 
FOR DELETE 
USING (
  created_by = auth.uid() AND
  is_system_template = false
);

-- Add triggers for updated_at
CREATE TRIGGER update_database_templates_updated_at
  BEFORE UPDATE ON public.database_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_view_templates_updated_at
  BEFORE UPDATE ON public.view_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert system database templates
INSERT INTO public.database_templates (name, description, category, is_system_template, template_data) VALUES
(
  'Project Management',
  'Complete project tracking with tasks, deadlines, and team assignments',
  'productivity',
  true,
  '{
    "fields": [
      {"name": "title", "type": "TEXT", "settings": {"nullable": false}},
      {"name": "description", "type": "TEXT", "settings": {"nullable": true}},
      {"name": "status", "type": "TEXT", "settings": {"field_type": "select", "options": [{"id": "todo", "name": "To Do", "color": "gray"}, {"id": "in_progress", "name": "In Progress", "color": "blue"}, {"id": "done", "name": "Done", "color": "green"}]}},
      {"name": "priority", "type": "TEXT", "settings": {"field_type": "select", "options": [{"id": "low", "name": "Low", "color": "green"}, {"id": "medium", "name": "Medium", "color": "yellow"}, {"id": "high", "name": "High", "color": "red"}]}},
      {"name": "assignee", "type": "TEXT", "settings": {"nullable": true}},
      {"name": "due_date", "type": "TIMESTAMP WITH TIME ZONE", "settings": {"nullable": true}},
      {"name": "estimated_hours", "type": "INTEGER", "settings": {"nullable": true}}
    ],
    "views": [
      {"name": "All Tasks", "view_type": "table", "is_default": true},
      {"name": "Kanban Board", "view_type": "kanban", "grouping_field": "status"},
      {"name": "Calendar", "view_type": "calendar", "date_field": "due_date"}
    ],
    "sample_data": [
      {"title": "Setup project repository", "status": "done", "priority": "high", "assignee": "John Doe"},
      {"title": "Design user interface", "status": "in_progress", "priority": "medium", "assignee": "Jane Smith"},
      {"title": "Write documentation", "status": "todo", "priority": "low"}
    ]
  }'
),
(
  'CRM',
  'Customer relationship management with leads, contacts, and deals',
  'sales',
  true,
  '{
    "fields": [
      {"name": "company", "type": "TEXT", "settings": {"nullable": false}},
      {"name": "contact_name", "type": "TEXT", "settings": {"nullable": false}},
      {"name": "email", "type": "TEXT", "settings": {"nullable": true}},
      {"name": "phone", "type": "TEXT", "settings": {"nullable": true}},
      {"name": "deal_value", "type": "INTEGER", "settings": {"nullable": true}},
      {"name": "stage", "type": "TEXT", "settings": {"field_type": "select", "options": [{"id": "lead", "name": "Lead", "color": "blue"}, {"id": "qualified", "name": "Qualified", "color": "yellow"}, {"id": "proposal", "name": "Proposal", "color": "orange"}, {"id": "closed_won", "name": "Closed Won", "color": "green"}, {"id": "closed_lost", "name": "Closed Lost", "color": "red"}]}},
      {"name": "last_contact", "type": "TIMESTAMP WITH TIME ZONE", "settings": {"nullable": true}},
      {"name": "notes", "type": "TEXT", "settings": {"nullable": true}}
    ],
    "views": [
      {"name": "All Contacts", "view_type": "table", "is_default": true},
      {"name": "Sales Pipeline", "view_type": "kanban", "grouping_field": "stage"},
      {"name": "High Value Deals", "view_type": "list", "filters": [{"field": "deal_value", "operator": "greater_than", "value": "10000"}]}
    ],
    "sample_data": [
      {"company": "Acme Corp", "contact_name": "John Smith", "email": "john@acme.com", "stage": "qualified", "deal_value": 25000},
      {"company": "TechStart Inc", "contact_name": "Sarah Johnson", "email": "sarah@techstart.com", "stage": "proposal", "deal_value": 15000},
      {"company": "Global Solutions", "contact_name": "Mike Wilson", "email": "mike@global.com", "stage": "lead", "deal_value": 5000}
    ]
  }'
),
(
  'Content Calendar',
  'Editorial calendar for planning and tracking content creation',
  'marketing',
  true,
  '{
    "fields": [
      {"name": "title", "type": "TEXT", "settings": {"nullable": false}},
      {"name": "content_type", "type": "TEXT", "settings": {"field_type": "select", "options": [{"id": "blog", "name": "Blog Post", "color": "blue"}, {"id": "social", "name": "Social Media", "color": "green"}, {"id": "email", "name": "Email", "color": "purple"}, {"id": "video", "name": "Video", "color": "red"}]}},
      {"name": "status", "type": "TEXT", "settings": {"field_type": "select", "options": [{"id": "idea", "name": "Idea", "color": "gray"}, {"id": "draft", "name": "Draft", "color": "yellow"}, {"id": "review", "name": "Review", "color": "orange"}, {"id": "published", "name": "Published", "color": "green"}]}},
      {"name": "author", "type": "TEXT", "settings": {"nullable": true}},
      {"name": "publish_date", "type": "TIMESTAMP WITH TIME ZONE", "settings": {"nullable": true}},
      {"name": "tags", "type": "TEXT", "settings": {"nullable": true}},
      {"name": "description", "type": "TEXT", "settings": {"nullable": true}}
    ],
    "views": [
      {"name": "All Content", "view_type": "table", "is_default": true},
      {"name": "Editorial Calendar", "view_type": "calendar", "date_field": "publish_date"},
      {"name": "Content Pipeline", "view_type": "kanban", "grouping_field": "status"},
      {"name": "Blog Posts", "view_type": "list", "filters": [{"field": "content_type", "operator": "equals", "value": "blog"}]}
    ],
    "sample_data": [
      {"title": "10 Tips for Better Writing", "content_type": "blog", "status": "published", "author": "Content Team", "tags": "writing, tips"},
      {"title": "Product Launch Announcement", "content_type": "social", "status": "draft", "author": "Marketing", "tags": "product, launch"},
      {"title": "Monthly Newsletter", "content_type": "email", "status": "review", "author": "Communications", "tags": "newsletter"}
    ]
  }'
),
(
  'Inventory Tracker',
  'Track products, stock levels, and supplier information',
  'operations',
  true,
  '{
    "fields": [
      {"name": "product_name", "type": "TEXT", "settings": {"nullable": false}},
      {"name": "sku", "type": "TEXT", "settings": {"nullable": true}},
      {"name": "category", "type": "TEXT", "settings": {"field_type": "select", "options": [{"id": "electronics", "name": "Electronics", "color": "blue"}, {"id": "clothing", "name": "Clothing", "color": "purple"}, {"id": "books", "name": "Books", "color": "green"}, {"id": "home", "name": "Home & Garden", "color": "orange"}]}},
      {"name": "stock_level", "type": "INTEGER", "settings": {"nullable": false, "default": 0}},
      {"name": "reorder_point", "type": "INTEGER", "settings": {"nullable": true}},
      {"name": "supplier", "type": "TEXT", "settings": {"nullable": true}},
      {"name": "cost", "type": "INTEGER", "settings": {"nullable": true}},
      {"name": "retail_price", "type": "INTEGER", "settings": {"nullable": true}}
    ],
    "views": [
      {"name": "All Products", "view_type": "table", "is_default": true},
      {"name": "Low Stock Alert", "view_type": "list", "filters": [{"field": "stock_level", "operator": "less_than", "value": "10"}]},
      {"name": "By Category", "view_type": "kanban", "grouping_field": "category"}
    ],
    "sample_data": [
      {"product_name": "Wireless Headphones", "sku": "WH001", "category": "electronics", "stock_level": 45, "reorder_point": 10, "supplier": "TechSupply Co"},
      {"product_name": "Cotton T-Shirt", "sku": "TS001", "category": "clothing", "stock_level": 8, "reorder_point": 15, "supplier": "Fashion Direct"},
      {"product_name": "Programming Book", "sku": "PB001", "category": "books", "stock_level": 23, "reorder_point": 5, "supplier": "Book Distributors"}
    ]
  }'
);

-- Insert system view templates
INSERT INTO public.view_templates (name, description, view_type, is_system_template, template_config) VALUES
(
  'Status Kanban',
  'Kanban board grouped by status field',
  'kanban',
  true,
  '{
    "grouping_field_name": "status",
    "default_columns": [
      {"id": "todo", "name": "To Do", "color": "gray"},
      {"id": "in_progress", "name": "In Progress", "color": "blue"},
      {"id": "done", "name": "Done", "color": "green"}
    ]
  }'
),
(
  'Priority List',
  'List view sorted by priority with color coding',
  'list',
  true,
  '{
    "sorts": [{"field": "priority", "direction": "desc"}],
    "filters": [],
    "visible_properties": ["title", "priority", "status", "due_date"]
  }'
),
(
  'Calendar Timeline',
  'Calendar view for date-based planning',
  'calendar',
  true,
  '{
    "date_field_name": "due_date",
    "view_mode": "month",
    "show_weekends": true
  }'
),
(
  'Gallery Grid',
  'Gallery view with image previews',
  'gallery',
  true,
  '{
    "card_size": "medium",
    "layout": "grid",
    "cover_field_name": "image",
    "visible_properties": ["title", "status"]
  }'
);
