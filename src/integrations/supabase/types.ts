export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      blocks: {
        Row: {
          archived: boolean
          content: Json | null
          created_by: string | null
          created_time: string
          id: string
          in_trash: boolean
          last_edited_by: string | null
          last_edited_time: string
          parent_id: string | null
          pos: number
          properties: Json
          type: Database["public"]["Enums"]["block_type_enum"]
          workspace_id: string
        }
        Insert: {
          archived?: boolean
          content?: Json | null
          created_by?: string | null
          created_time?: string
          id?: string
          in_trash?: boolean
          last_edited_by?: string | null
          last_edited_time?: string
          parent_id?: string | null
          pos?: number
          properties?: Json
          type: Database["public"]["Enums"]["block_type_enum"]
          workspace_id: string
        }
        Update: {
          archived?: boolean
          content?: Json | null
          created_by?: string | null
          created_time?: string
          id?: string
          in_trash?: boolean
          last_edited_by?: string | null
          last_edited_time?: string
          parent_id?: string | null
          pos?: number
          properties?: Json
          type?: Database["public"]["Enums"]["block_type_enum"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          block_id: string
          body: string
          created_at: string
          id: string
          parent_comment_id: string | null
          user_id: string
        }
        Insert: {
          block_id: string
          body: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          user_id: string
        }
        Update: {
          block_id?: string
          body?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "legacy_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      database_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_system_template: boolean
          name: string
          preview_image_url: string | null
          template_data: Json
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system_template?: boolean
          name: string
          preview_image_url?: string | null
          template_data: Json
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system_template?: boolean
          name?: string
          preview_image_url?: string | null
          template_data?: Json
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "database_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      database_views: {
        Row: {
          created_at: string
          database_id: string
          default_view_type: string
          grouping_collapsed_groups: Json | null
          grouping_field_id: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          database_id: string
          default_view_type: string
          grouping_collapsed_groups?: Json | null
          grouping_field_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          database_id?: string
          default_view_type?: string
          grouping_collapsed_groups?: Json | null
          grouping_field_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      databases: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          icon: string | null
          id: string
          name: string
          table_name: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          table_name: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          table_name?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "databases_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      field_dependencies: {
        Row: {
          created_at: string | null
          dependent_field_id: string
          id: string
          source_field_id: string
        }
        Insert: {
          created_at?: string | null
          dependent_field_id: string
          id?: string
          source_field_id: string
        }
        Update: {
          created_at?: string | null
          dependent_field_id?: string
          id?: string
          source_field_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_dependencies_dependent_field_id_fkey"
            columns: ["dependent_field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_dependencies_source_field_id_fkey"
            columns: ["source_field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      fields: {
        Row: {
          created_at: string | null
          created_by: string
          database_id: string
          id: string
          name: string
          pos: number
          settings: Json | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          database_id: string
          id?: string
          name: string
          pos?: number
          settings?: Json | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          database_id?: string
          id?: string
          name?: string
          pos?: number
          settings?: Json | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      files: {
        Row: {
          block_id: string | null
          created_at: string
          file_size: number
          filename: string
          id: string
          mime_type: string
          original_filename: string
          storage_path: string
          updated_at: string
          uploaded_by: string
          workspace_id: string
        }
        Insert: {
          block_id?: string | null
          created_at?: string
          file_size: number
          filename: string
          id?: string
          mime_type: string
          original_filename: string
          storage_path: string
          updated_at?: string
          uploaded_by: string
          workspace_id: string
        }
        Update: {
          block_id?: string | null
          created_at?: string
          file_size?: number
          filename?: string
          id?: string
          mime_type?: string
          original_filename?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "legacy_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_blocks: {
        Row: {
          content: Json | null
          created_at: string | null
          created_by: string
          id: string
          page_id: string
          parent_block_id: string | null
          pos: number
          type: string
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          created_by: string
          id?: string
          page_id: string
          parent_block_id?: string | null
          pos?: number
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          created_by?: string
          id?: string
          page_id?: string
          parent_block_id?: string | null
          pos?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "legacy_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_parent_block_id_fkey"
            columns: ["parent_block_id"]
            isOneToOne: false
            referencedRelation: "legacy_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_pages: {
        Row: {
          created_at: string | null
          created_by: string
          database_id: string | null
          id: string
          order_index: number
          parent_page_id: string | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          database_id?: string | null
          id?: string
          order_index?: number
          parent_page_id?: string | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          database_id?: string | null
          id?: string
          order_index?: number
          parent_page_id?: string | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_database_id_fkey"
            columns: ["database_id"]
            isOneToOne: false
            referencedRelation: "databases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_parent_page_id_fkey"
            columns: ["parent_page_id"]
            isOneToOne: false
            referencedRelation: "legacy_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      page_properties: {
        Row: {
          computed_value: string | null
          created_at: string | null
          created_by: string
          field_id: string
          id: string
          page_id: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          computed_value?: string | null
          created_at?: string | null
          created_by: string
          field_id: string
          id?: string
          page_id: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          computed_value?: string | null
          created_at?: string | null
          created_by?: string
          field_id?: string
          id?: string
          page_id?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_properties_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_properties_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "legacy_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      presence: {
        Row: {
          created_at: string
          cursor: Json | null
          id: string
          last_heartbeat: string
          page_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cursor?: Json | null
          id?: string
          last_heartbeat?: string
          page_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cursor?: Json | null
          id?: string
          last_heartbeat?: string
          page_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presence_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "legacy_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      property_file_attachments: {
        Row: {
          created_at: string
          field_id: string
          file_size: number
          filename: string
          id: string
          mime_type: string
          original_filename: string
          page_id: string
          storage_path: string
          updated_at: string
          uploaded_by: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          field_id: string
          file_size: number
          filename: string
          id?: string
          mime_type: string
          original_filename: string
          page_id: string
          storage_path: string
          updated_at?: string
          uploaded_by: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          field_id?: string
          file_size?: number
          filename?: string
          id?: string
          mime_type?: string
          original_filename?: string
          page_id?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_property_file_attachments_field_id"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_property_file_attachments_page_id"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "legacy_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_property_file_attachments_uploaded_by"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_property_file_attachments_workspace_id"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          role_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          role_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          role_name?: string
        }
        Relationships: []
      }
      saved_database_views: {
        Row: {
          created_at: string
          created_by: string
          database_id: string
          description: string | null
          filters: Json | null
          grouping_collapsed_groups: Json | null
          grouping_field_id: string | null
          id: string
          is_default: boolean | null
          is_shared: boolean | null
          name: string
          sorts: Json | null
          updated_at: string
          user_id: string
          view_type: string
          visible_field_ids: Json | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          database_id: string
          description?: string | null
          filters?: Json | null
          grouping_collapsed_groups?: Json | null
          grouping_field_id?: string | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          name: string
          sorts?: Json | null
          updated_at?: string
          user_id: string
          view_type: string
          visible_field_ids?: Json | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          database_id?: string
          description?: string | null
          filters?: Json | null
          grouping_collapsed_groups?: Json | null
          grouping_field_id?: string | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          name?: string
          sorts?: Json | null
          updated_at?: string
          user_id?: string
          view_type?: string
          visible_field_ids?: Json | null
          workspace_id?: string
        }
        Relationships: []
      }
      saved_view_permissions: {
        Row: {
          created_at: string
          granted_by: string
          id: string
          permission_type: string
          user_id: string
          view_id: string
        }
        Insert: {
          created_at?: string
          granted_by: string
          id?: string
          permission_type?: string
          user_id: string
          view_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string
          id?: string
          permission_type?: string
          user_id?: string
          view_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_view_permissions_view_id_fkey"
            columns: ["view_id"]
            isOneToOne: false
            referencedRelation: "saved_database_views"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_audit_log: {
        Row: {
          change_type: string
          changed_by: string
          created_at: string | null
          database_id: string
          field_id: string | null
          id: string
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          workspace_id: string
        }
        Insert: {
          change_type: string
          changed_by: string
          created_at?: string | null
          database_id: string
          field_id?: string | null
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          workspace_id: string
        }
        Update: {
          change_type?: string
          changed_by?: string
          created_at?: string | null
          database_id?: string
          field_id?: string | null
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schema_audit_log_database_id_fkey"
            columns: ["database_id"]
            isOneToOne: false
            referencedRelation: "databases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schema_audit_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          content: Json
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      view_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_system_template: boolean
          name: string
          template_config: Json
          updated_at: string
          view_type: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system_template?: boolean
          name: string
          template_config: Json
          updated_at?: string
          view_type: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system_template?: boolean
          name?: string
          template_config?: Json
          updated_at?: string
          view_type?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "view_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_membership: {
        Row: {
          accepted_at: string | null
          id: string
          invited_at: string | null
          role_id: number
          status: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          invited_at?: string | null
          role_id: number
          status?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          invited_at?: string | null
          role_id?: number
          status?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_membership_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_membership_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          owner_user_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          owner_user_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          owner_user_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      search_index: {
        Row: {
          created_at: string | null
          created_by: string | null
          display_content: string | null
          display_title: string | null
          id: string | null
          search_vector: unknown | null
          title: string | null
          type: string | null
          workspace_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_properties_to_page: {
        Args: { p_page_id: string; p_database_id: string; p_user_id: string }
        Returns: undefined
      }
      cleanup_old_presence: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_database_with_fields: {
        Args: {
          p_workspace_id: string
          p_user_id: string
          p_name: string
          p_description?: string
          p_fields?: Json
        }
        Returns: {
          database_id: string
          database_name: string
          table_name: string
        }[]
      }
      get_user_workspace_role: {
        Args: { workspace_uuid: string; user_uuid: string }
        Returns: string
      }
      global_search: {
        Args: { search_query: string; user_workspace_id?: string }
        Returns: {
          type: string
          id: string
          title: string
          workspace_id: string
          created_by: string
          created_at: string
          display_title: string
          display_content: string
          rank: number
        }[]
      }
      is_small_workspace: {
        Args: { workspace_uuid: string }
        Returns: boolean
      }
      is_workspace_owner: {
        Args: { workspace_uuid: string; user_uuid: string }
        Returns: boolean
      }
      recalculate_formula_field: {
        Args: { field_id: string; page_id: string }
        Returns: string
      }
      recalculate_rollup_field: {
        Args: { field_id: string; page_id: string }
        Returns: string
      }
      refresh_search_index_for_workspace: {
        Args: { workspace_uuid: string }
        Returns: undefined
      }
      user_can_edit_workspace: {
        Args: { target_workspace_id: string; user_id: string }
        Returns: boolean
      }
      user_has_workspace_access: {
        Args: { target_workspace_id: string; user_id: string }
        Returns: boolean
      }
      user_has_workspace_access_with_role: {
        Args: {
          target_workspace_id: string
          user_id: string
          required_role?: string
        }
        Returns: boolean
      }
      user_is_workspace_admin: {
        Args: { target_workspace_id: string; user_id: string }
        Returns: boolean
      }
      validate_formula_field_settings: {
        Args: { settings: Json }
        Returns: boolean
      }
      validate_rollup_field_settings: {
        Args: { settings: Json }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer"
      block_type_enum:
        | "page"
        | "database"
        | "text"
        | "image"
        | "heading_1"
        | "heading_2"
        | "heading_3"
        | "todo_item"
        | "bulleted_list_item"
        | "numbered_list_item"
        | "toggle_list"
        | "code"
        | "quote"
        | "divider"
        | "callout"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "viewer"],
      block_type_enum: [
        "page",
        "database",
        "text",
        "image",
        "heading_1",
        "heading_2",
        "heading_3",
        "todo_item",
        "bulleted_list_item",
        "numbered_list_item",
        "toggle_list",
        "code",
        "quote",
        "divider",
        "callout",
      ],
    },
  },
} as const
