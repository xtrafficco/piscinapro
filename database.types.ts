// ============================================================
// PiscinaPro — Tipos TypeScript do schema Supabase
// Gerado de: projeto tczczahhibqnojlptpyx (public)
// Regerar: supabase gen types typescript --project-id tczczahhibqnojlptpyx
// Uso: createClient<Database>(url, key)
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      adicionais: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          qtd_padrao: number
          unidade: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          qtd_padrao?: number
          unidade?: string
          valor?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          qtd_padrao?: number
          unidade?: string
          valor?: number
        }
        Relationships: []
      }
      equipes: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      financeiro: {
        Row: {
          comissao_paga: boolean
          comissao_pct: number
          created_at: string
          entrada: number
          entrada_paga: boolean
          financiado: number
          id: string
          lead_id: string
          orcamento_id: string | null
          parcelas: number
          parcelas_pagas: number
          total: number
          updated_at: string
          valor_parcela: number
        }
        Insert: {
          comissao_paga?: boolean
          comissao_pct?: number
          created_at?: string
          entrada?: number
          entrada_paga?: boolean
          financiado?: number
          id?: string
          lead_id: string
          orcamento_id?: string | null
          parcelas?: number
          parcelas_pagas?: number
          total?: number
          updated_at?: string
          valor_parcela?: number
        }
        Update: {
          comissao_paga?: boolean
          comissao_pct?: number
          created_at?: string
          entrada?: number
          entrada_paga?: boolean
          financiado?: number
          id?: string
          lead_id?: string
          orcamento_id?: string | null
          parcelas?: number
          parcelas_pagas?: number
          total?: number
          updated_at?: string
          valor_parcela?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_interacoes: {
        Row: {
          id: string
          lead_id: string
          quando: string
          texto: string
          tipo: string
        }
        Insert: {
          id?: string
          lead_id: string
          quando?: string
          texto: string
          tipo?: string
        }
        Update: {
          id?: string
          lead_id?: string
          quando?: string
          texto?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_interacoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          cidade: string | null
          created_at: string
          email: string | null
          etapa: Database["public"]["Enums"]["lead_etapa"]
          id: string
          modelo_id: string | null
          nome: string
          observacoes: string | null
          origem: Database["public"]["Enums"]["lead_origem"]
          telefone: string
          temperatura: Database["public"]["Enums"]["lead_temp"]
          updated_at: string
          valor: number
          vendedor_id: string | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          email?: string | null
          etapa?: Database["public"]["Enums"]["lead_etapa"]
          id?: string
          modelo_id?: string | null
          nome: string
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["lead_origem"]
          telefone?: string
          temperatura?: Database["public"]["Enums"]["lead_temp"]
          updated_at?: string
          valor?: number
          vendedor_id?: string | null
        }
        Update: {
          cidade?: string | null
          created_at?: string
          email?: string | null
          etapa?: Database["public"]["Enums"]["lead_etapa"]
          id?: string
          modelo_id?: string | null
          nome?: string
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["lead_origem"]
          telefone?: string
          temperatura?: Database["public"]["Enums"]["lead_temp"]
          updated_at?: string
          valor?: number
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "modelos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      modelos: {
        Row: {
          ativo: boolean
          base: number
          created_at: string
          dim: string | null
          id: string
          nome: string
          pessoas: string | null
          prazo: string | null
          prof: string | null
          updated_at: string
          volume: string | null
        }
        Insert: {
          ativo?: boolean
          base?: number
          created_at?: string
          dim?: string | null
          id?: string
          nome: string
          pessoas?: string | null
          prazo?: string | null
          prof?: string | null
          updated_at?: string
          volume?: string | null
        }
        Update: {
          ativo?: boolean
          base?: number
          created_at?: string
          dim?: string | null
          id?: string
          nome?: string
          pessoas?: string | null
          prazo?: string | null
          prof?: string | null
          updated_at?: string
          volume?: string | null
        }
        Relationships: []
      }
      obra_notas: {
        Row: {
          id: string
          obra_id: string
          quando: string
          texto: string
        }
        Insert: {
          id?: string
          obra_id: string
          quando?: string
          texto: string
        }
        Update: {
          id?: string
          obra_id?: string
          quando?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_notas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          created_at: string
          equipe_id: string | null
          etapa: Database["public"]["Enums"]["obra_etapa"]
          id: string
          inicio: string | null
          lead_id: string
          orcamento_id: string | null
          previsao: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          equipe_id?: string | null
          etapa?: Database["public"]["Enums"]["obra_etapa"]
          id?: string
          inicio?: string | null
          lead_id: string
          orcamento_id?: string | null
          previsao?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          equipe_id?: string | null
          etapa?: Database["public"]["Enums"]["obra_etapa"]
          id?: string
          inicio?: string | null
          lead_id?: string
          orcamento_id?: string | null
          previsao?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "obras_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_itens: {
        Row: {
          id: string
          nome: string
          orcamento_id: string
          qtd: number
          valor: number
        }
        Insert: {
          id?: string
          nome: string
          orcamento_id: string
          qtd?: number
          valor?: number
        }
        Update: {
          id?: string
          nome?: string
          orcamento_id?: string
          qtd?: number
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          cliente_cidade: string
          cliente_email: string
          cliente_nome: string
          cliente_telefone: string
          created_at: string
          desconto_pct: number
          entrada_pct: number
          id: string
          juros_mes: number
          lead_id: string | null
          modelo_id: string | null
          numero: string
          observacoes: string | null
          pagamento_tipo: Database["public"]["Enums"]["pagamento_tipo"]
          parcelas: number
          status: Database["public"]["Enums"]["orcamento_status"]
          updated_at: string
          validade_dias: number
          valor_base: number
          vendedor_id: string | null
        }
        Insert: {
          cliente_cidade?: string
          cliente_email?: string
          cliente_nome: string
          cliente_telefone?: string
          created_at?: string
          desconto_pct?: number
          entrada_pct?: number
          id?: string
          juros_mes?: number
          lead_id?: string | null
          modelo_id?: string | null
          numero: string
          observacoes?: string | null
          pagamento_tipo?: Database["public"]["Enums"]["pagamento_tipo"]
          parcelas?: number
          status?: Database["public"]["Enums"]["orcamento_status"]
          updated_at?: string
          validade_dias?: number
          valor_base?: number
          vendedor_id?: string | null
        }
        Update: {
          cliente_cidade?: string
          cliente_email?: string
          cliente_nome?: string
          cliente_telefone?: string
          created_at?: string
          desconto_pct?: number
          entrada_pct?: number
          id?: string
          juros_mes?: number
          lead_id?: string | null
          modelo_id?: string | null
          numero?: string
          observacoes?: string | null
          pagamento_tipo?: Database["public"]["Enums"]["pagamento_tipo"]
          parcelas?: number
          status?: Database["public"]["Enums"]["orcamento_status"]
          updated_at?: string
          validade_dias?: number
          valor_base?: number
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "modelos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          created_at: string
          id: string
          nome: string | null
          papel: string
          updated_at: string
          vendedor_id: string | null
        }
        Insert: {
          created_at?: string
          id: string
          nome?: string | null
          papel?: string
          updated_at?: string
          vendedor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string | null
          papel?: string
          updated_at?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfis_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas: {
        Row: {
          created_at: string
          feito: boolean
          id: string
          lead_id: string | null
          titulo: string
          vencimento: string | null
        }
        Insert: {
          created_at?: string
          feito?: boolean
          id?: string
          lead_id?: string | null
          titulo: string
          vencimento?: string | null
        }
        Update: {
          created_at?: string
          feito?: boolean
          id?: string
          lead_id?: string | null
          titulo?: string
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      vendedores: {
        Row: {
          ativo: boolean
          cor: string
          created_at: string
          id: string
          meta: number
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor?: string
          created_at?: string
          id?: string
          meta?: number
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor?: string
          created_at?: string
          id?: string
          meta?: number
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      vw_funil_resumo: {
        Row: {
          etapa: Database["public"]["Enums"]["lead_etapa"] | null
          qtd: number | null
          valor: number | null
        }
        Relationships: []
      }
      vw_metas_vendedor: {
        Row: {
          cor: string | null
          id: string | null
          leads_ativos: number | null
          meta: number | null
          nome: string | null
          pipeline: number | null
          realizado: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      lead_etapa:
        | "novo"
        | "contato"
        | "qualificado"
        | "proposta"
        | "negociacao"
        | "ganho"
        | "perdido"
      lead_origem:
        | "whatsapp"
        | "site"
        | "indicacao"
        | "feira"
        | "instagram"
        | "google"
      lead_temp: "quente" | "morno" | "frio"
      obra_etapa:
        | "vistoria"
        | "escavacao"
        | "instalacao"
        | "acabamento"
        | "entrega"
      orcamento_status: "rascunho" | "enviado" | "aprovado" | "recusado"
      pagamento_tipo: "avista" | "financiado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      lead_etapa: [
        "novo",
        "contato",
        "qualificado",
        "proposta",
        "negociacao",
        "ganho",
        "perdido",
      ],
      lead_origem: [
        "whatsapp",
        "site",
        "indicacao",
        "feira",
        "instagram",
        "google",
      ],
      lead_temp: ["quente", "morno", "frio"],
      obra_etapa: [
        "vistoria",
        "escavacao",
        "instalacao",
        "acabamento",
        "entrega",
      ],
      orcamento_status: ["rascunho", "enviado", "aprovado", "recusado"],
      pagamento_tipo: ["avista", "financiado"],
    },
  },
} as const
