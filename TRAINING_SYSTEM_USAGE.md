# 🎯 Guía de Uso - Sistema de Entrenamiento Dual

## 🚀 ¡Sistema COMPLETAMENTE FUNCIONAL!

### ✅ **Estado Actual:**
- **Tablas creadas**: training_patterns, training_rules, training_sessions, training_logs
- **Datos iniciales**: 1 patrón + 3 reglas operativas
- **Integración completa**: En la aplicación React
- **Migración diccionario**: 22K/91K entradas (24%) - continúa automáticamente

## 🎮 **Cómo Usar el Sistema:**

### **1. Acceder al Sistema de Entrenamiento**
```
📱 Aplicación corriendo en: http://localhost:8080/
🔑 Atajo de teclado: Ctrl + Shift + T
```

### **2. Credenciales de Superuser:**
```
Email: alfredo.falconer@gmail.com
Password: scrabble2025

Alternativas:
- admin@maslexico.app / scrabble2025
- trainer@maslexico.app / scrabble2025
```

### **3. Flujo de Entrenamiento:**

#### **🔧 Modo Superuser (Entrenamiento):**
1. **Login** con credenciales autorizadas
2. **Modo automático**: `superuser`
3. **Funcionalidades disponibles**:
   - ✅ Ver SQL queries y debug info
   - ✅ Crear reglas de filtrado
   - ✅ Corregir respuestas del agente
   - ✅ Ver logs de sesión completos
   - ✅ Estadísticas del motor de reglas

#### **👤 Modo Producción (Usuario Final):**
1. **Sin login** (automático)
2. **Filtrado automático**: 
   - ❌ SQL oculto
   - ❌ Debug info removido
   - ✅ Máximo 100 resultados
   - ✅ Respuestas limpias

## 🛠️ **Componentes del Sistema:**

### **📊 TrainingSystemDemo**
- **Comparación lado a lado**: Original vs Filtrado
- **Estadísticas en tiempo real**: Motor de reglas
- **Simulación de consultas**: Prueba el filtrado
- **Interface completa**: Todos los tabs funcionales

### **🔧 SuperuserInterface**
- **Tab Debug**: SQL queries, metadata, correcciones
- **Tab Reglas**: Crear nuevas reglas dinámicamente
- **Tab Patrones**: Ver patrones aprendidos (próximamente)
- **Tab Logs**: Historial de sesión y estadísticas

### **⚙️ RuleEngine**
- **Evaluación dinámica**: `mode=production AND result_count>100`
- **4 tipos de acciones**: allow, filter, transform, deny
- **Contexto inteligente**: mode, result_count, has_sql, etc.
- **Validación de consultas**: Antes de procesamiento

## 🔄 **Sistema de Reglas Activas:**

### **1. `limit_results_production`**
```javascript
// Limita resultados en modo producción
condition: "mode=production AND result_count>100"
action: "transform" 
params: { max_results: 100, add_message: "Mostrando primeros 100 resultados" }
```

### **2. `hide_sql_production`**
```javascript
// Oculta información técnica en producción
condition: "mode=production"
action: "filter"
params: { remove_fields: ["sql_query", "debug_info"] }
```

### **3. `allow_all_superuser`**
```javascript
// Permite todo en modo superuser
condition: "mode=superuser"
action: "allow"
params: {}
```

## 🧪 **Pruebas del Sistema:**

### **Test 1: Filtrado Automático**
1. Abre http://localhost:8080/
2. Presiona `Ctrl + Shift + T`
3. Sin login = modo producción
4. Verifica que SQL esté oculto en respuesta filtrada

### **Test 2: Modo Superuser**
1. Haz login con alfredo.falconer@gmail.com
2. Verifica modo `superuser` en la interface
3. Comprueba que SQL sea visible
4. Prueba creación de reglas

### **Test 3: Persistencia de Sesión**
1. Crea una sesión de entrenamiento
2. Recarga la página
3. Verifica que la sesión se mantenga

## 📈 **Estadísticas en Tiempo Real:**

La aplicación muestra:
- **Total de reglas**: 3 activas
- **Confianza promedio**: 0.9
- **Reglas por tipo**: transform(1), filter(1), allow(1)
- **Consultas procesadas**: Contador en vivo
- **Correcciones aplicadas**: Durante entrenamiento

## 🔧 **Para Desarrolladores:**

### **Archivos Clave:**
```
src/hooks/useTrainingMode.ts       - Autenticación dual
src/utils/RuleEngine.ts            - Motor de filtrado
src/components/SuperuserInterface.tsx - Panel entrenamiento
src/components/TrainingSystemDemo.tsx - Demo completo
```

### **Base de Datos:**
```sql
-- Ver patrones
SELECT * FROM training_patterns;

-- Ver reglas activas
SELECT * FROM training_rules WHERE active = true;

-- Ver sesiones
SELECT * FROM training_sessions ORDER BY started_at DESC;
```

## 🎯 **Próximos Pasos:**

1. ✅ **Sistema funcional** - COMPLETO
2. 🔄 **Migración diccionario** - En progreso (22K/91K)
3. ⏳ **Integrar con consultas reales** - Cuando migración termine
4. ⏳ **Entrenamiento en producción** - Con usuarios reales
5. ⏳ **Deploy a Netlify** - Sistema completo

## 🚨 **Atajos de Teclado:**

- `Ctrl + Shift + T`: Mostrar/ocultar sistema de entrenamiento
- `Ctrl + PageDown`: Navegación entre módulos (→)
- `Ctrl + PageUp`: Navegación entre módulos (←)

**¡El sistema está listo para entrenar el agente de IA y servir a la comunidad global del Scrabble en español!** 🎉