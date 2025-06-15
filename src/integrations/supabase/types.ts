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
      block_permissions: {
        Row: {
          block_id: string
          created_at: string | null
          granted_by: string | null
          grantee_type: Database["public"]["Enums"]["grantee_type"]
          group_id: string | null
          id: string
          permission_level: Database["public"]["Enums"]["block_permission_level"]
          user_id: string | null
        }
        Insert: {
          block_id: string
          created_at?: string | null
          granted_by?: string | null
          grantee_type: Database["public"]["Enums"]["grantee_type"]
          group_id?: string | null
          id?: string
          permission_level: Database["public"]["Enums"]["block_permission_level"]
          user_id?: string | null
        }
        Update: {
          block_id?: string
          created_at?: string | null
          granted_by?: string | null
          grantee_type?: Database["public"]["Enums"]["grantee_type"]
          group_id?: string | null
          id?: string
          permission_level?: Database["public"]["Enums"]["block_permission_level"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "block_permissions_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
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
          teamspace_id: string | null
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
          teamspace_id?: string | null
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
          teamspace_id?: string | null
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
          {
            foreignKeyName: "fk_blocks_teamspace_id"
            columns: ["teamspace_id"]
            isOneToOne: false
            referencedRelation: "teamspaces"
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
      database_properties: {
        Row: {
          created_at: string | null
          created_by: string
          database_id: string
          id: string
          name: string
          pos: number
          settings: Json | null
          type: Database["public"]["Enums"]["property_type_enum"]
          updated_at: string | null
          visibility_setting:
            | Database["public"]["Enums"]["property_visibility"]
            | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          database_id: string
          id?: string
          name: string
          pos?: number
          settings?: Json | null
          type: Database["public"]["Enums"]["property_type_enum"]
          updated_at?: string | null
          visibility_setting?:
            | Database["public"]["Enums"]["property_visibility"]
            | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          database_id?: string
          id?: string
          name?: string
          pos?: number
          settings?: Json | null
          type?: Database["public"]["Enums"]["property_type_enum"]
          updated_at?: string | null
          visibility_setting?:
            | Database["public"]["Enums"]["property_visibility"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "database_properties_database_id_fkey"
            columns: ["database_id"]
            isOneToOne: false
            referencedRelation: "databases"
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
          grouping_property_id: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          database_id: string
          default_view_type: string
          grouping_collapsed_groups?: Json | null
          grouping_property_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          database_id?: string
          default_view_type?: string
          grouping_collapsed_groups?: Json | null
          grouping_property_id?: string | null
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
          dependent_property_id: string
          id: string
          source_property_id: string
        }
        Insert: {
          created_at?: string | null
          dependent_property_id: string
          id?: string
          source_property_id: string
        }
        Update: {
          created_at?: string | null
          dependent_property_id?: string
          id?: string
          source_property_id?: string
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
      group_memberships: {
        Row: {
          added_by: string | null
          created_at: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["workspace_role"]
          token: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          role: Database["public"]["Enums"]["workspace_role"]
          token: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_workspace_id_fkey"
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
      page_relations: {
        Row: {
          created_at: string
          from_page_id: string
          id: number
          relation_property_id: string
          to_page_id: string
        }
        Insert: {
          created_at?: string
          from_page_id: string
          id?: never
          relation_property_id: string
          to_page_id: string
        }
        Update: {
          created_at?: string
          from_page_id?: string
          id?: never
          relation_property_id?: string
          to_page_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_relations_from_page_id_fkey"
            columns: ["from_page_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_relations_relation_property_id_fkey"
            columns: ["relation_property_id"]
            isOneToOne: false
            referencedRelation: "database_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_relations_to_page_id_fkey"
            columns: ["to_page_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      presence: {
        Row: {
          activity: Database["public"]["Enums"]["presence_activity_enum"]
          created_at: string
          cursor: Json | null
          id: string
          last_heartbeat: string
          page_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity?: Database["public"]["Enums"]["presence_activity_enum"]
          created_at?: string
          cursor?: Json | null
          id?: string
          last_heartbeat?: string
          page_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity?: Database["public"]["Enums"]["presence_activity_enum"]
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
          file_size: number
          filename: string
          id: string
          mime_type: string
          original_filename: string
          page_id: string
          property_id: string
          storage_path: string
          updated_at: string
          uploaded_by: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          file_size: number
          filename: string
          id?: string
          mime_type: string
          original_filename: string
          page_id: string
          property_id: string
          storage_path: string
          updated_at?: string
          uploaded_by: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          file_size?: number
          filename?: string
          id?: string
          mime_type?: string
          original_filename?: string
          page_id?: string
          property_id?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
          workspace_id?: string
        }
        Relationships: [
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
      property_values: {
        Row: {
          computed_value: string | null
          created_at: string | null
          created_by: string
          id: string
          page_id: string
          property_id: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          computed_value?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          page_id: string
          property_id: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          computed_value?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          page_id?: string
          property_id?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_values_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_values_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "database_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_database_views: {
        Row: {
          created_at: string
          created_by: string
          database_id: string
          description: string | null
          filters: Json | null
          grouping_collapsed_groups: Json | null
          grouping_property_id: string | null
          id: string
          is_default: boolean | null
          is_shared: boolean | null
          name: string
          sorts: Json | null
          updated_at: string
          user_id: string
          view_type: string
          visible_property_ids: Json | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          database_id: string
          description?: string | null
          filters?: Json | null
          grouping_collapsed_groups?: Json | null
          grouping_property_id?: string | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          name: string
          sorts?: Json | null
          updated_at?: string
          user_id: string
          view_type: string
          visible_property_ids?: Json | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          database_id?: string
          description?: string | null
          filters?: Json | null
          grouping_collapsed_groups?: Json | null
          grouping_property_id?: string | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          name?: string
          sorts?: Json | null
          updated_at?: string
          user_id?: string
          view_type?: string
          visible_property_ids?: Json | null
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
          id: string
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          property_id: string | null
          workspace_id: string
        }
        Insert: {
          change_type: string
          changed_by: string
          created_at?: string | null
          database_id: string
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          property_id?: string | null
          workspace_id: string
        }
        Update: {
          change_type?: string
          changed_by?: string
          created_at?: string | null
          database_id?: string
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          property_id?: string | null
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
      teamspace_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["teamspace_member_role"]
          teamspace_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["teamspace_member_role"]
          teamspace_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["teamspace_member_role"]
          teamspace_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teamspace_members_teamspace_id_fkey"
            columns: ["teamspace_id"]
            isOneToOne: false
            referencedRelation: "teamspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      teamspaces: {
        Row: {
          access_level: Database["public"]["Enums"]["teamspace_access_level"]
          created_at: string
          created_by: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["teamspace_access_level"]
          created_at?: string
          created_by: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["teamspace_access_level"]
          created_at?: string
          created_by?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teamspaces_workspace_id_fkey"
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
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
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
      can_user_access_block: {
        Args: { p_block_id: string; p_user_id: string }
        Returns: boolean
      }
      check_workspace_membership: {
        Args: {
          p_workspace_id: string
          p_user_id: string
          p_required_roles?: Database["public"]["Enums"]["workspace_role"][]
        }
        Returns: boolean
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
      get_block_ancestor_permission_source: {
        Args: { p_block_id: string }
        Returns: {
          ancestor_id: string
          ancestor_parent_id: string
          ancestor_teamspace_id: string
          ancestor_created_by: string
        }[]
      }
      get_discoverable_teamspaces: {
        Args: { p_workspace_id: string; p_user_id: string }
        Returns: {
          id: string
          workspace_id: string
          name: string
          description: string
          icon: string
          created_by: string
          created_at: string
          updated_at: string
          access_level: Database["public"]["Enums"]["teamspace_access_level"]
          member_count: number
          is_member: boolean
        }[]
      }
      get_inherited_block_permission: {
        Args: { p_block_id: string; p_user_id: string }
        Returns: Database["public"]["Enums"]["block_permission_level"]
      }
      get_user_final_block_permission: {
        Args: { p_block_id: string; p_user_id: string }
        Returns: Database["public"]["Enums"]["block_permission_level"]
      }
      get_user_workspace_permission_level: {
        Args: { p_workspace_id: string; p_user_id: string }
        Returns: Database["public"]["Enums"]["block_permission_level"]
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
      is_teamspace_member: {
        Args: { p_teamspace_id: string; p_user_id: string }
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
      remove_properties_from_page: {
        Args: { p_page_id: string; p_database_id: string }
        Returns: undefined
      }
      update_block_teamspace_recursive: {
        Args: { p_block_id: string; p_teamspace_id: string }
        Returns: undefined
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
      block_permission_level:
        | "view"
        | "comment"
        | "edit"
        | "full_access"
        | "none"
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
      grantee_type: "user" | "group"
      permission_grantee_type: "user" | "group"
      presence_activity_enum: "editing" | "commenting" | "viewing"
      property_type_enum:
        | "text"
        | "number"
        | "select"
        | "multi_select"
        | "status"
        | "date"
        | "people"
        | "file_attachment"
        | "checkbox"
        | "url"
        | "email"
        | "phone"
        | "relation"
        | "rollup"
        | "formula"
        | "button"
        | "image"
        | "created_time"
        | "created_by"
        | "last_edited_time"
        | "last_edited_by"
        | "id"
      property_visibility: "always_show" | "always_hide" | "show_when_not_empty"
      teamspace_access_level: "public" | "private"
      teamspace_member_role: "admin" | "member"
      workspace_role: "owner" | "admin" | "member" | "guest"
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
      block_permission_level: [
        "view",
        "comment",
        "edit",
        "full_access",
        "none",
      ],
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
      grantee_type: ["user", "group"],
      permission_grantee_type: ["user", "group"],
      presence_activity_enum: ["editing", "commenting", "viewing"],
      property_type_enum: [
        "text",
        "number",
        "select",
        "multi_select",
        "status",
        "date",
        "people",
        "file_attachment",
        "checkbox",
        "url",
        "email",
        "phone",
        "relation",
        "rollup",
        "formula",
        "button",
        "image",
        "created_time",
        "created_by",
        "last_edited_time",
        "last_edited_by",
        "id",
      ],
      property_visibility: [
        "always_show",
        "always_hide",
        "show_when_not_empty",
      ],
      teamspace_access_level: ["public", "private"],
      teamspace_member_role: ["admin", "member"],
      workspace_role: ["owner", "admin", "member", "guest"],
    },
  },
} as const
