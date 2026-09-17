// ============================================================
// PiscinaPro — Tipos TypeScript do schema Supabase
// Gerado de: projeto szjobipenlkfeunmtueh (public),
// migrations 20260917000000_reconstrucao_schema_app e 20260917100000_melhorias
// ============================================================
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
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
          updated_at: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          qtd_padrao?: number
          unidade?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          qtd_padrao?: number
          unidade?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      app_config: {
        Row: {
          chave: string
          updated_at: string
          valor: string
        }
        Insert: {
          chave: string
          updated_at?: string
          valor: string
        }
        Update: {
          chave?: string
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
      auditoria: {
        Row: {
          acao: string
          ator: string | null
          entidade: string
          entidade_id: string | null
          id: string
          quando: string
          resumo: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          ator?: string | null
          entidade: string
          entidade_id?: string | null
          id?: string
          quando?: string
          resumo?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          ator?: string | null
          entidade?: string
          entidade_id?: string | null
          id?: string
          quando?: string
          resumo?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backups_log: {
        Row: {
          arquivo: string
          bytes: number
          created_at: string
          id: number
          tabelas: Json
        }
        Insert: {
          arquivo: string
          bytes: number
          created_at?: string
          id?: never
          tabelas: Json
        }
        Update: {
          arquivo?: string
          bytes?: number
          created_at?: string
          id?: never
          tabelas?: Json
        }
        Relationships: []
      }
      equipes: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      financeiro: {
        Row: {
          comissao_paga: boolean
          comissao_pct: number
          created_at: string
          entrada: number
          financiado: number
          id: string
          lead_id: string
          orcamento_id: string | null
          parcelas: number
          total: number
          updated_at: string
          valor_parcela: number
        }
        Insert: {
          comissao_paga?: boolean
          comissao_pct?: number
          created_at?: string
          entrada?: number
          financiado?: number
          id?: string
          lead_id: string
          orcamento_id?: string | null
          parcelas?: number
          total?: number
          updated_at?: string
          valor_parcela?: number
        }
        Update: {
          comissao_paga?: boolean
          comissao_pct?: number
          created_at?: string
          entrada?: number
          financiado?: number
          id?: string
          lead_id?: string
          orcamento_id?: string | null
          parcelas?: number
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
          texto?: string
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
          ganho_em: string | null
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
          versao: number
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          email?: string | null
          etapa?: Database["public"]["Enums"]["lead_etapa"]
          ganho_em?: string | null
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
          versao?: number
        }
        Update: {
          cidade?: string | null
          created_at?: string
          email?: string | null
          etapa?: Database["public"]["Enums"]["lead_etapa"]
          ganho_em?: string | null
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
          versao?: number
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
          {
            foreignKeyName: "leads_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vw_metas_vendedor"
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
          texto?: string
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
          pdf_path: string | null
          status: Database["public"]["Enums"]["orcamento_status"]
          updated_at: string
          validade_dias: number
          valor_base: number
          vendedor_id: string | null
          versao: number
        }
        Insert: {
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
          numero: string
          observacoes?: string | null
          pagamento_tipo?: Database["public"]["Enums"]["pagamento_tipo"]
          parcelas?: number
          pdf_path?: string | null
          status?: Database["public"]["Enums"]["orcamento_status"]
          updated_at?: string
          validade_dias?: number
          valor_base?: number
          vendedor_id?: string | null
          versao?: number
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
          pdf_path?: string | null
          status?: Database["public"]["Enums"]["orcamento_status"]
          updated_at?: string
          validade_dias?: number
          valor_base?: number
          vendedor_id?: string | null
          versao?: number
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
          {
            foreignKeyName: "orcamentos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vw_metas_vendedor"
            referencedColumns: ["id"]
          },
        ]
      }
      parcelas: {
        Row: {
          created_at: string
          descricao: string
          forma_pagamento: string | null
          id: string
          lead_id: string
          numero: number
          observacao: string | null
          pago_em: string | null
          updated_at: string
          valor: number
          valor_pago: number
          vencimento: string
        }
        Insert: {
          created_at?: string
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          lead_id: string
          numero: number
          observacao?: string | null
          pago_em?: string | null
          updated_at?: string
          valor: number
          valor_pago?: number
          vencimento: string
        }
        Update: {
          created_at?: string
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          lead_id?: string
          numero?: number
          observacao?: string | null
          pago_em?: string | null
          updated_at?: string
          valor?: number
          valor_pago?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "parcelas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          ativo: boolean
          created_at: string
          desconto_max: number
          email: string | null
          id: string
          nome: string | null
          papel: string
          pode_aprovar: boolean
          updated_at: string
          vendedor_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          desconto_max?: number
          email?: string | null
          id: string
          nome?: string | null
          papel?: string
          pode_aprovar?: boolean
          updated_at?: string
          vendedor_id?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          desconto_max?: number
          email?: string | null
          id?: string
          nome?: string | null
          papel?: string
          pode_aprovar?: boolean
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
          {
            foreignKeyName: "perfis_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vw_metas_vendedor"
            referencedColumns: ["id"]
          },
        ]
      }
      proposta_links: {
        Row: {
          aceito_documento: string | null
          aceito_em: string | null
          aceito_ip: string | null
          aceito_nome: string | null
          aceito_user_agent: string | null
          acessos: number
          conteudo_hash: string | null
          criado_em: string
          criado_por: string | null
          expira_em: string
          orcamento_id: string
          revogado: boolean
          token: string
          visualizado_em: string | null
        }
        Insert: {
          aceito_documento?: string | null
          aceito_em?: string | null
          aceito_ip?: string | null
          aceito_nome?: string | null
          aceito_user_agent?: string | null
          acessos?: number
          conteudo_hash?: string | null
          criado_em?: string
          criado_por?: string | null
          expira_em?: string
          orcamento_id: string
          revogado?: boolean
          token?: string
          visualizado_em?: string | null
        }
        Update: {
          aceito_documento?: string | null
          aceito_em?: string | null
          aceito_ip?: string | null
          aceito_nome?: string | null
          aceito_user_agent?: string | null
          acessos?: number
          conteudo_hash?: string | null
          criado_em?: string
          criado_por?: string | null
          expira_em?: string
          orcamento_id?: string
          revogado?: boolean
          token?: string
          visualizado_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposta_links_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tarefas: {
        Row: {
          created_at: string
          feito: boolean
          id: string
          lead_id: string | null
          push_em: string | null
          titulo: string
          updated_at: string
          user_id: string
          vencimento: string | null
        }
        Insert: {
          created_at?: string
          feito?: boolean
          id?: string
          lead_id?: string | null
          push_em?: string | null
          titulo: string
          updated_at?: string
          user_id?: string
          vencimento?: string | null
        }
        Update: {
          created_at?: string
          feito?: boolean
          id?: string
          lead_id?: string | null
          push_em?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
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
      chamar_funcao_cron: { Args: { p_funcao: string }; Returns: number }
      relatorio_comercial: {
        Args: { p_fim: string; p_inicio: string }
        Returns: Json
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
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
