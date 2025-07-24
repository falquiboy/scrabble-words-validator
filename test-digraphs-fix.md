# 🧪 TEST: Fix Dígrafos en Leaves

## Casos de Prueba Críticos:

### 1. **Rack con CH**
- **Input**: Rack="CHARO", Word="HARO"
- **Expected Leave**: "[CH]" 
- **Previous Bug**: No encontraba "[CH]" en la tabla
- **Fix**: processDigraphs("CHARO") → "ÇARO", luego Ç → "[CH]"

### 2. **Rack con LL**  
- **Input**: Rack="LLAMA", Word="LAMA"
- **Expected Leave**: "[LL]"
- **Fix**: processDigraphs("LLAMA") → "KAMA", luego K → "[LL]"

### 3. **Rack con RR**
- **Input**: Rack="PERRO", Word="PERO" 
- **Expected Leave**: "[RR]"
- **Fix**: processDigraphs("PERRO") → "PEWO", luego W → "[RR]"

### 4. **Rack con Ñ**
- **Input**: Rack="NIÑO", Word="NIÑO"
- **Expected Leave**: "" (vacío)
- **Fix**: processDigraphs preserva Ñ correctamente

### 5. **Combinaciones Complejas**
- **Input**: Rack="CHARRO", Word="HARO"
- **Expected Leave**: "[CH][RR]"
- **Fix**: "CHARRO" → "ÇAWO" → leave="ÇW" → "[CH][RR]"

## 🔍 Debugging en Console:

Deberías ver logs como:
```
🔄 calculateLeave: "CHARO" -> "ÇARO", "HARO" -> "HARO"
🎯 calculateLeave result: "[CH]"
```

## 📋 Para Testing:

1. Buscar palabras con dígrafos: **CHARO**, **LLAMA**, **PERRO**
2. Activar equity view
3. Verificar que encuentra valores en leaves table
4. Ver logs de conversión en console