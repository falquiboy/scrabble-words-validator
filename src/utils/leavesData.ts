import { supabase } from "@/integrations/supabase/client";

export interface LeaveInfo {
  leave: string;
  leaves: number;
}

/**
 * Calcula el residuo (leave) de un rack después de formar una palabra
 * Convierte dígrafos CH->Ç, LL->K, RR->W para match con la tabla
 * @param rack - Las letras disponibles (ej: "CASERON")
 * @param word - La palabra formada (ej: "CERON")
 * @returns El residuo restante (ej: "AS")
 */
export function calculateLeave(rack: string, word: string): string {
  const rackLetters = rack.split('').sort();
  const wordLetters = word.split('').sort();
  
  const leave = [...rackLetters];
  
  // Remover las letras de la palabra del rack
  for (const letter of wordLetters) {
    const index = leave.indexOf(letter);
    if (index !== -1) {
      leave.splice(index, 1);
    }
  }
  
  // Convertir dígrafos para que coincidan con formato de tabla: Ç->[CH], K->[LL], W->[RR]
  let leaveStr = leave.sort().join('');
  leaveStr = leaveStr.replace(/Ç/g, '[CH]');
  leaveStr = leaveStr.replace(/K/g, '[LL]');
  leaveStr = leaveStr.replace(/W/g, '[RR]');
  
  return leaveStr;
}

/**
 * Busca el valor de un residuo en la tabla leaves
 * @param leaveStr - El residuo (ej: "AS", "[CH]A")
 * @returns El valor del residuo o null si no se encuentra
 */
export async function getLeaveValue(leaveStr: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('leaves')
      .select('leaves')
      .eq('leave', leaveStr)
      .single();
    
    if (error) {
      console.warn(`No se encontró valor para residuo "${leaveStr}":`, error);
      return null;
    }
    
    return data?.leaves || null;
  } catch (error) {
    console.error('Error consultando leaves:', error);
    return null;
  }
}

/**
 * Calcula el valor potencial de una jugada (valor de palabra + valor de residuo)
 * @param wordValue - Valor nominal de la palabra
 * @param rack - Rack completo (ej: "CASERON")
 * @param word - Palabra formada (ej: "CERON") 
 * @returns Valor potencial redondeado a 2 decimales
 */
export async function calculatePotentialValue(
  wordValue: number, 
  rack: string, 
  word: string
): Promise<number> {
  const leave = calculateLeave(rack, word);
  const leaveValue = await getLeaveValue(leave);
  
  if (leaveValue === null) {
    console.warn(`No se encontró valor para residuo "${leave}"`);
    return wordValue; // Solo devolver valor de palabra si no hay residuo
  }
  
  const potentialValue = wordValue + leaveValue;
  return Math.round(potentialValue * 100) / 100; // Redondear a 2 decimales
}

