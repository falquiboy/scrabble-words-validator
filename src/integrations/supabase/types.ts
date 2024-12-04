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
      alphagrams: {
        Row: {
          alphagram: string | null
          lenght: number | null
        }
        Insert: {
          alphagram?: string | null
          lenght?: number | null
        }
        Update: {
          alphagram?: string | null
          lenght?: number | null
        }
        Relationships: []
      }
      cuadernillo: {
        Row: {
          alphagram: string | null
          conj_const: string | null
          is_enclitic: string | null
          kind_id: string | null
          lenght: number | null
          root_word: string | null
          word_group: number | null
        }
        Insert: {
          alphagram?: string | null
          conj_const?: string | null
          is_enclitic?: string | null
          kind_id?: string | null
          lenght?: number | null
          root_word?: string | null
          word_group?: number | null
        }
        Update: {
          alphagram?: string | null
          conj_const?: string | null
          is_enclitic?: string | null
          kind_id?: string | null
          lenght?: number | null
          root_word?: string | null
          word_group?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_cuadernillo_alphagrams"
            columns: ["alphagram", "lenght"]
            isOneToOne: false
            referencedRelation: "alphagrams"
            referencedColumns: ["alphagram", "lenght"]
          },
          {
            foreignKeyName: "fk_cuadernillo_words"
            columns: ["root_word", "alphagram", "lenght"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["word", "alphagram", "lenght"]
          },
        ]
      }
      words: {
        Row: {
          alphagram: string | null
          lenght: number | null
          word: string | null
        }
        Insert: {
          alphagram?: string | null
          lenght?: number | null
          word?: string | null
        }
        Update: {
          alphagram?: string | null
          lenght?: number | null
          word?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_sort_chars: {
        Args: {
          input_str: string
        }
        Returns: string
      }
    }
    Enums: {
      se_property: "admite la terminación -se"
      sym_property:
        | "sin tratamiento especial"
        | "admite género opuesto"
        | "admite participio femenino"
        | "admite participio masculino plural"
        | "no admite terminación -ad, -ed, -id, respectivamente"
      verb_kind:
        | "Infinitivo de un verbo transitivo"
        | "Infinitivo de un verbo intransitivo"
        | "Infinitivo de un verbo pronominal"
        | "Entrada directa (palabra no verbal)"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
