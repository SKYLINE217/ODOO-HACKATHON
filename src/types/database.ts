export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          role: 'admin' | 'procurement_officer' | 'manager' | 'vendor'
          avatar_url: string | null
          phone: string | null
          department: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          role?: 'admin' | 'procurement_officer' | 'manager' | 'vendor'
          avatar_url?: string | null
          phone?: string | null
          department?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          role?: 'admin' | 'procurement_officer' | 'manager' | 'vendor'
          avatar_url?: string | null
          phone?: string | null
          department?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      vendor_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      vendors: {
        Row: {
          id: string
          company_name: string
          category_id: string | null
          status: 'pending' | 'active' | 'suspended' | 'blacklisted'
          contact_person: string
          email: string
          phone: string
          website: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          state: string | null
          country: string
          pincode: string | null
          gst_number: string | null
          pan_number: string | null
          msme_registered: boolean
          rating: number | null
          total_orders: number
          notes: string | null
          user_id: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          category_id?: string | null
          status?: 'pending' | 'active' | 'suspended' | 'blacklisted'
          contact_person: string
          email: string
          phone: string
          website?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          country?: string
          pincode?: string | null
          gst_number?: string | null
          pan_number?: string | null
          msme_registered?: boolean
          rating?: number | null
          total_orders?: number
          notes?: string | null
          user_id?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          category_id?: string | null
          status?: 'pending' | 'active' | 'suspended' | 'blacklisted'
          contact_person?: string
          email?: string
          phone?: string
          website?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          country?: string
          pincode?: string | null
          gst_number?: string | null
          pan_number?: string | null
          msme_registered?: boolean
          rating?: number | null
          total_orders?: number
          notes?: string | null
          user_id?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      rfqs: {
        Row: {
          id: string
          rfq_number: string
          title: string
          description: string | null
          status: 'draft' | 'published' | 'closed' | 'cancelled'
          deadline: string
          budget_estimate: number | null
          currency: string
          created_by: string
          created_at: string
          updated_at: string
          published_at: string | null
          closed_at: string | null
        }
        Insert: {
          id?: string
          rfq_number?: string
          title: string
          description?: string | null
          status?: 'draft' | 'published' | 'closed' | 'cancelled'
          deadline: string
          budget_estimate?: number | null
          currency?: string
          created_by: string
          created_at?: string
          updated_at?: string
          published_at?: string | null
          closed_at?: string | null
        }
        Update: {
          id?: string
          rfq_number?: string
          title?: string
          description?: string | null
          status?: 'draft' | 'published' | 'closed' | 'cancelled'
          deadline?: string
          budget_estimate?: number | null
          currency?: string
          created_by?: string
          created_at?: string
          updated_at?: string
          published_at?: string | null
          closed_at?: string | null
        }
      }
      rfq_items: {
        Row: {
          id: string
          rfq_id: string
          item_name: string
          description: string | null
          quantity: number
          unit: string
          specifications: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          rfq_id: string
          item_name: string
          description?: string | null
          quantity: number
          unit?: string
          specifications?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          rfq_id?: string
          item_name?: string
          description?: string | null
          quantity?: number
          unit?: string
          specifications?: string | null
          sort_order?: number
          created_at?: string
        }
      }
      rfq_attachments: {
        Row: {
          id: string
          rfq_id: string
          file_name: string
          file_url: string
          file_size: number | null
          mime_type: string | null
          uploaded_by: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          rfq_id: string
          file_name: string
          file_url: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          rfq_id?: string
          file_name?: string
          file_url?: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by?: string
          uploaded_at?: string
        }
      }
      rfq_vendors: {
        Row: {
          rfq_id: string
          vendor_id: string
          invited_at: string
          notified: boolean
          notified_at: string | null
        }
        Insert: {
          rfq_id: string
          vendor_id: string
          invited_at?: string
          notified?: boolean
          notified_at?: string | null
        }
        Update: {
          rfq_id?: string
          vendor_id?: string
          invited_at?: string
          notified?: boolean
          notified_at?: string | null
        }
      }
      quotations: {
        Row: {
          id: string
          quotation_number: string
          rfq_id: string
          vendor_id: string
          status: 'submitted' | 'under_review' | 'shortlisted' | 'rejected' | 'awarded'
          subtotal: number
          tax_amount: number
          discount_amount: number
          total_amount: number
          currency: string
          delivery_days: number | null
          delivery_terms: string | null
          payment_terms: string | null
          validity_days: number
          valid_until: string
          notes: string | null
          submitted_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quotation_number?: string
          rfq_id: string
          vendor_id: string
          status?: 'submitted' | 'under_review' | 'shortlisted' | 'rejected' | 'awarded'
          subtotal?: number
          tax_amount?: number
          discount_amount?: number
          total_amount?: number
          currency?: string
          delivery_days?: number | null
          delivery_terms?: string | null
          payment_terms?: string | null
          validity_days?: number
          notes?: string | null
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quotation_number?: string
          rfq_id?: string
          vendor_id?: string
          status?: 'submitted' | 'under_review' | 'shortlisted' | 'rejected' | 'awarded'
          subtotal?: number
          tax_amount?: number
          discount_amount?: number
          total_amount?: number
          currency?: string
          delivery_days?: number | null
          delivery_terms?: string | null
          payment_terms?: string | null
          validity_days?: number
          notes?: string | null
          submitted_at?: string
          updated_at?: string
        }
      }
      quotation_items: {
        Row: {
          id: string
          quotation_id: string
          rfq_item_id: string | null
          item_name: string
          description: string | null
          quantity: number
          unit: string
          unit_price: number
          tax_rate: number
          tax_amount: number
          total_price: number
          sort_order: number
        }
        Insert: {
          id?: string
          quotation_id: string
          rfq_item_id?: string | null
          item_name: string
          description?: string | null
          quantity: number
          unit: string
          unit_price: number
          tax_rate?: number
          sort_order?: number
        }
        Update: {
          id?: string
          quotation_id?: string
          rfq_item_id?: string | null
          item_name?: string
          description?: string | null
          quantity?: number
          unit?: string
          unit_price?: number
          tax_rate?: number
          sort_order?: number
        }
      }
      approvals: {
        Row: {
          id: string
          quotation_id: string
          status: 'pending' | 'approved' | 'rejected' | 'escalated'
          requested_by: string
          approver_id: string | null
          remarks: string | null
          rejection_reason: string | null
          requested_at: string
          actioned_at: string | null
          escalated_to: string | null
          escalated_at: string | null
          escalation_reason: string | null
        }
        Insert: {
          id?: string
          quotation_id: string
          status?: 'pending' | 'approved' | 'rejected' | 'escalated'
          requested_by: string
          approver_id?: string | null
          remarks?: string | null
          rejection_reason?: string | null
          requested_at?: string
          actioned_at?: string | null
          escalated_to?: string | null
          escalated_at?: string | null
          escalation_reason?: string | null
        }
        Update: {
          id?: string
          quotation_id?: string
          status?: 'pending' | 'approved' | 'rejected' | 'escalated'
          requested_by?: string
          approver_id?: string | null
          remarks?: string | null
          rejection_reason?: string | null
          requested_at?: string
          actioned_at?: string | null
          escalated_to?: string | null
          escalated_at?: string | null
          escalation_reason?: string | null
        }
      }
      purchase_orders: {
        Row: {
          id: string
          po_number: string
          quotation_id: string
          vendor_id: string
          status: 'draft' | 'issued' | 'acknowledged' | 'fulfilled' | 'cancelled'
          subtotal: number
          tax_amount: number
          discount_amount: number
          total_amount: number
          currency: string
          delivery_address: string | null
          delivery_date: string | null
          payment_terms: string | null
          issued_by: string
          issued_at: string
          acknowledged_at: string | null
          fulfilled_at: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          po_number?: string
          quotation_id: string
          vendor_id: string
          status?: 'draft' | 'issued' | 'acknowledged' | 'fulfilled' | 'cancelled'
          subtotal: number
          tax_amount?: number
          discount_amount?: number
          total_amount: number
          currency?: string
          delivery_address?: string | null
          delivery_date?: string | null
          payment_terms?: string | null
          issued_by: string
          issued_at?: string
          acknowledged_at?: string | null
          fulfilled_at?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          po_number?: string
          quotation_id?: string
          vendor_id?: string
          status?: 'draft' | 'issued' | 'acknowledged' | 'fulfilled' | 'cancelled'
          subtotal?: number
          tax_amount?: number
          discount_amount?: number
          total_amount?: number
          currency?: string
          delivery_address?: string | null
          delivery_date?: string | null
          payment_terms?: string | null
          issued_by?: string
          issued_at?: string
          acknowledged_at?: string | null
          fulfilled_at?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      purchase_order_items: {
        Row: {
          id: string
          po_id: string
          quotation_item_id: string | null
          item_name: string
          description: string | null
          quantity: number
          unit: string
          unit_price: number
          tax_rate: number
          tax_amount: number
          total_price: number
          sort_order: number
        }
        Insert: {
          id?: string
          po_id: string
          quotation_item_id?: string | null
          item_name: string
          description?: string | null
          quantity: number
          unit: string
          unit_price: number
          tax_rate?: number
          tax_amount: number
          total_price: number
          sort_order?: number
        }
        Update: {
          id?: string
          po_id?: string
          quotation_item_id?: string | null
          item_name?: string
          description?: string | null
          quantity?: number
          unit?: string
          unit_price?: number
          tax_rate?: number
          tax_amount?: number
          total_price?: number
          sort_order?: number
        }
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          po_id: string
          vendor_id: string
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          subtotal: number
          cgst_amount: number
          sgst_amount: number
          igst_amount: number
          total_tax: number
          discount_amount: number
          total_amount: number
          currency: string
          due_date: string | null
          paid_at: string | null
          payment_reference: string | null
          email_sent: boolean
          email_sent_at: string | null
          email_sent_to: string | null
          pdf_url: string | null
          created_by: string
          created_at: string
          updated_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          invoice_number?: string
          po_id: string
          vendor_id: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          subtotal: number
          cgst_amount?: number
          sgst_amount?: number
          igst_amount?: number
          total_tax?: number
          discount_amount?: number
          total_amount: number
          currency?: string
          due_date?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          email_sent?: boolean
          email_sent_at?: string | null
          email_sent_to?: string | null
          pdf_url?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          invoice_number?: string
          po_id?: string
          vendor_id?: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          subtotal?: number
          cgst_amount?: number
          sgst_amount?: number
          igst_amount?: number
          total_tax?: number
          discount_amount?: number
          total_amount?: number
          currency?: string
          due_date?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          email_sent?: boolean
          email_sent_at?: string | null
          email_sent_to?: string | null
          pdf_url?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
          notes?: string | null
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          po_item_id: string | null
          item_name: string
          description: string | null
          hsn_code: string | null
          quantity: number
          unit: string
          unit_price: number
          cgst_rate: number
          sgst_rate: number
          igst_rate: number
          cgst_amount: number
          sgst_amount: number
          igst_amount: number
          total_price: number
          sort_order: number
        }
        Insert: {
          id?: string
          invoice_id: string
          po_item_id?: string | null
          item_name: string
          description?: string | null
          hsn_code?: string | null
          quantity: number
          unit: string
          unit_price: number
          cgst_rate?: number
          sgst_rate?: number
          igst_rate?: number
          cgst_amount: number
          sgst_amount: number
          igst_amount: number
          total_price: number
          sort_order?: number
        }
        Update: {
          id?: string
          invoice_id?: string
          po_item_id?: string | null
          item_name?: string
          description?: string | null
          hsn_code?: string | null
          quantity?: number
          unit?: string
          unit_price?: number
          cgst_rate?: number
          sgst_rate?: number
          igst_rate?: number
          cgst_amount?: number
          sgst_amount?: number
          igst_amount?: number
          total_price?: number
          sort_order?: number
        }
      }
      activity_logs: {
        Row: {
          id: string
          entity_type: 'rfq' | 'quotation' | 'approval' | 'purchase_order' | 'invoice' | 'vendor' | 'user'
          entity_id: string
          action: string
          description: string
          old_value: Json
          new_value: Json
          performed_by: string | null
          performed_at: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          entity_type: 'rfq' | 'quotation' | 'approval' | 'purchase_order' | 'invoice' | 'vendor' | 'user'
          entity_id: string
          action: string
          description: string
          old_value?: Json
          new_value?: Json
          performed_by?: string | null
          performed_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          entity_type?: 'rfq' | 'quotation' | 'approval' | 'purchase_order' | 'invoice' | 'vendor' | 'user'
          entity_id?: string
          action?: string
          description?: string
          old_value?: Json
          new_value?: Json
          performed_by?: string | null
          performed_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          entity_type: 'rfq' | 'quotation' | 'approval' | 'purchase_order' | 'invoice' | 'vendor' | 'user' | null
          entity_id: string | null
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          entity_type?: 'rfq' | 'quotation' | 'approval' | 'purchase_order' | 'invoice' | 'vendor' | 'user' | null
          entity_id?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          entity_type?: 'rfq' | 'quotation' | 'approval' | 'purchase_order' | 'invoice' | 'vendor' | 'user' | null
          entity_id?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: 'admin' | 'procurement_officer' | 'manager' | 'vendor'
      }
    }
    Enums: {
      user_role: 'admin' | 'procurement_officer' | 'manager' | 'vendor'
      vendor_status: 'pending' | 'active' | 'suspended' | 'blacklisted'
      rfq_status: 'draft' | 'published' | 'closed' | 'cancelled'
      quotation_status: 'submitted' | 'under_review' | 'shortlisted' | 'rejected' | 'awarded'
      approval_status: 'pending' | 'approved' | 'rejected' | 'escalated'
      po_status: 'draft' | 'issued' | 'acknowledged' | 'fulfilled' | 'cancelled'
      invoice_status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
      activity_entity: 'rfq' | 'quotation' | 'approval' | 'purchase_order' | 'invoice' | 'vendor' | 'user'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
