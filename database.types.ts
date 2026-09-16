// ============================================================
// PiscinaPro — Tipos TypeScript do schema Supabase
// Gerado de: projeto szjobipenlkfeunmtueh (public), migrations 00–19
// Regerar: supabase gen types typescript --project-id szjobipenlkfeunmtueh
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
      assinaturas: {
        Row: {
          aceite_texto: string
          assinado_em: string
          documento: string | null
          email: string | null
          hash_documento: string
          id: string
          imagem_path: string
          ip: string | null
          nome: string
          orcamento_id: string
          token: string | null
          user_agent: string | null
        }
        Insert: {
          aceite_texto: string
          assinado_em?: string
          documento?: string | null
          email?: string | null
          hash_documento: string
          id?: string
          imagem_path: string
          ip?: string | null
          nome: string
          orcamento_id: string
          token?: string | null
          user_agent?: string | null
        }
        Update: {
          aceite_texto?: string
          assinado_em?: string
          documento?: string | null
          email?: string | null
          hash_documento?: string
          id?: string
          imagem_path?: string
          ip?: string | null
          nome?: string
          orcamento_id?: string
          token?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_token_fkey"
            columns: ["token"]
            isOneToOne: false
            referencedRelation: "portal_tokens"
            referencedColumns: ["token"]
          },
        ]
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
      erros_app: {
        Row: {
          contexto: Json | null
          created_at: string
          id: number
          mensagem: string
          stack: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
          versao: string | null
        }
        Insert: {
          contexto?: Json | null
          created_at?: string
          id?: never
          mensagem: string
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
          versao?: string | null
        }
        Update: {
          contexto?: Json | null
          created_at?: string
          id?: never
          mensagem?: string
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
          versao?: string | null
        }
        Relationships: []
      }
      fin_categorias: {
        Row: {
          ativo: boolean
          created_at: string
          grupo: string
          id: string
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          grupo?: string
          id?: string
          nome: string
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          grupo?: string
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      fin_contas: {
        Row: {
          agencia: string | null
          ativo: boolean
          banco: string | null
          cor: string
          created_at: string
          id: string
          nome: string
          numero: string | null
          saldo_inicial: number
          saldo_inicial_em: string
          tipo: string
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          ativo?: boolean
          banco?: string | null
          cor?: string
          created_at?: string
          id?: string
          nome: string
          numero?: string | null
          saldo_inicial?: number
          saldo_inicial_em?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          ativo?: boolean
          banco?: string | null
          cor?: string
          created_at?: string
          id?: string
          nome?: string
          numero?: string | null
          saldo_inicial?: number
          saldo_inicial_em?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      fin_movimentos: {
        Row: {
          categoria_id: string | null
          conciliado: boolean
          conta_id: string
          created_at: string
          criado_por: string | null
          data: string
          descricao: string
          forma_pagamento: string | null
          fornecedor_id: string | null
          id: string
          lead_id: string | null
          tipo: string
          titulo_id: string | null
          transferencia_id: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          conciliado?: boolean
          conta_id: string
          created_at?: string
          criado_por?: string | null
          data?: string
          descricao: string
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          id?: string
          lead_id?: string | null
          tipo: string
          titulo_id?: string | null
          transferencia_id?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          categoria_id?: string | null
          conciliado?: boolean
          conta_id?: string
          created_at?: string
          criado_por?: string | null
          data?: string
          descricao?: string
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          id?: string
          lead_id?: string | null
          tipo?: string
          titulo_id?: string | null
          transferencia_id?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fin_movimentos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "fin_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_movimentos_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "fin_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_movimentos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_movimentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_movimentos_titulo_id_fkey"
            columns: ["titulo_id"]
            isOneToOne: false
            referencedRelation: "fin_titulos"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_parametros: {
        Row: {
          chave: string
          updated_at: string
          valor: Json
        }
        Insert: {
          chave: string
          updated_at?: string
          valor: Json
        }
        Update: {
          chave?: string
          updated_at?: string
          valor?: Json
        }
        Relationships: []
      }
      fin_titulos: {
        Row: {
          acrescimo: number
          categoria_id: string | null
          competencia: string | null
          conta_id: string | null
          created_at: string
          criado_por: string | null
          desconto: number
          descricao: string
          documento: string | null
          emissao: string
          forma_pagamento: string | null
          fornecedor_id: string | null
          grupo_id: string | null
          id: string
          lead_id: string | null
          observacoes: string | null
          origem: string
          pago_em: string | null
          parcela: number
          parcelas: number
          recorrente: string | null
          status: string
          tipo: string
          updated_at: string
          valor: number
          valor_pago: number
          vencimento: string
          vendedor_id: string | null
        }
        Insert: {
          acrescimo?: number
          categoria_id?: string | null
          competencia?: string | null
          conta_id?: string | null
          created_at?: string
          criado_por?: string | null
          desconto?: number
          descricao: string
          documento?: string | null
          emissao?: string
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          grupo_id?: string | null
          id?: string
          lead_id?: string | null
          observacoes?: string | null
          origem?: string
          pago_em?: string | null
          parcela?: number
          parcelas?: number
          recorrente?: string | null
          status?: string
          tipo: string
          updated_at?: string
          valor: number
          valor_pago?: number
          vencimento: string
          vendedor_id?: string | null
        }
        Update: {
          acrescimo?: number
          categoria_id?: string | null
          competencia?: string | null
          conta_id?: string | null
          created_at?: string
          criado_por?: string | null
          desconto?: number
          descricao?: string
          documento?: string | null
          emissao?: string
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          grupo_id?: string | null
          id?: string
          lead_id?: string | null
          observacoes?: string | null
          origem?: string
          pago_em?: string | null
          parcela?: number
          parcelas?: number
          recorrente?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          valor?: number
          valor_pago?: number
          vencimento?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_titulos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "fin_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_titulos_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "fin_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_titulos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_titulos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_titulos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_titulos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vw_metas_vendedor"
            referencedColumns: ["id"]
          },
        ]
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
      fornecedores: {
        Row: {
          ativo: boolean
          categoria_id: string | null
          chave_pix: string | null
          cidade: string | null
          created_at: string
          documento: string | null
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          tipo_pessoa: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_id?: string | null
          chave_pix?: string | null
          cidade?: string | null
          created_at?: string
          documento?: string | null
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          tipo_pessoa?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string | null
          chave_pix?: string | null
          cidade?: string | null
          created_at?: string
          documento?: string | null
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          tipo_pessoa?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "fin_categorias"
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
          assinado_em: string | null
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
        }
        Insert: {
          assinado_em?: string | null
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
        }
        Update: {
          assinado_em?: string | null
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
      perfis: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          id: string
          limites: Json
          nome: string | null
          papel: string
          permissoes: string[]
          updated_at: string
          vendedor_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id: string
          limites?: Json
          nome?: string | null
          papel?: string
          permissoes?: string[]
          updated_at?: string
          vendedor_id?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          limites?: Json
          nome?: string | null
          papel?: string
          permissoes?: string[]
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
      portal_tokens: {
        Row: {
          acessos: number
          created_at: string
          criado_por: string | null
          expira_em: string
          lead_id: string | null
          orcamento_id: string | null
          revogado: boolean
          token: string
          ultimo_acesso: string | null
        }
        Insert: {
          acessos?: number
          created_at?: string
          criado_por?: string | null
          expira_em?: string
          lead_id?: string | null
          orcamento_id?: string | null
          revogado?: boolean
          token?: string
          ultimo_acesso?: string | null
        }
        Update: {
          acessos?: number
          created_at?: string
          criado_por?: string | null
          expira_em?: string
          lead_id?: string | null
          orcamento_id?: string | null
          revogado?: boolean
          token?: string
          ultimo_acesso?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_tokens_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_tokens_orcamento_id_fkey"
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
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      tarefas: {
        Row: {
          concluida_em: string | null
          created_at: string
          descricao: string | null
          feito: boolean
          id: string
          lead_id: string | null
          push_em: string | null
          responsavel_id: string | null
          titulo: string
          updated_at: string
          user_id: string | null
          vencimento: string | null
        }
        Insert: {
          concluida_em?: string | null
          created_at?: string
          descricao?: string | null
          feito?: boolean
          id?: string
          lead_id?: string | null
          push_em?: string | null
          responsavel_id?: string | null
          titulo: string
          updated_at?: string
          user_id?: string | null
          vencimento?: string | null
        }
        Update: {
          concluida_em?: string | null
          created_at?: string
          descricao?: string | null
          feito?: boolean
          id?: string
          lead_id?: string | null
          push_em?: string | null
          responsavel_id?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string | null
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
          comissao_pct: number
          cor: string
          created_at: string
          id: string
          meta: number
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          comissao_pct?: number
          cor?: string
          created_at?: string
          id?: string
          meta?: number
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          comissao_pct?: number
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
      eh_service_role: { Args: never; Returns: boolean }
      fin_recalcular_titulo: { Args: { p_titulo: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      lead_visivel: { Args: { p_lead: string }; Returns: boolean }
      limite_num: { Args: { chave: string }; Returns: number }
      meu_vendedor_id: { Args: never; Returns: string }
      no_escopo: { Args: { v: string }; Returns: boolean }
      orcamento_visivel: { Args: { p_orc: string }; Returns: boolean }
      pode_editar_comercial: { Args: never; Returns: boolean }
      pode_gerir_titulo: {
        Args: { p_origem: string; p_tipo: string }
        Returns: boolean
      }
      pode_ver_lead: {
        Args: { etapa: Database["public"]["Enums"]["lead_etapa"]; v: string }
        Returns: boolean
      }
      pode_ver_titulo: {
        Args: { p_origem: string; p_tipo: string; p_vendedor: string }
        Returns: boolean
      }
      tem_alguma_perm: { Args: { ps: string[] }; Returns: boolean }
      tem_perm: { Args: { p: string }; Returns: boolean }
      usuario_ativo: { Args: never; Returns: boolean }
      usuarios_resumo: {
        Args: never
        Returns: {
          ativo: boolean
          id: string
          nome: string
          vendedor_id: string
        }[]
      }
      ve_financeiro: { Args: never; Returns: boolean }
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
