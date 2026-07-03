# 🚨 Plan de Rollback de Emergencia

Si algo sale mal durante/después de la migración, ejecutar INMEDIATAMENTE:

## OPCIÓN 1: Rollback Automático (Si el servidor está UP)

```bash
# En el servidor de producción
cd /path/to/crm

# 1. PARAR SERVIDOR
pm2 stop crm-api  # o ctrl+C si está en foreground

# 2. RESTAURAR BD
# Buscar el backup más reciente
ls -lht pg.db.backup-* | head -1

# Restaurar (ejemplo)
cp pg.db.backup-2026-07-03-143055 pg.db

# 3. REVERTIR CÓDIGO al commit anterior a d48dc4f
git log --oneline | head -10  # Ver últimos commits
git reset --hard <COMMIT-ANTERIOR>  # p.ej. git reset --hard 9f49a7c

# 4. REINICIAR SERVIDOR
npm start
```

---

## OPCIÓN 2: Rollback Manual (Si el servidor está DOWN)

```bash
# 1. SSH a producción
ssh user@production-server

# 2. Entrar al directorio
cd /path/to/crm

# 3. Verificar backups disponibles
ls -lh pg.db.backup-*

# 4. RESTAURAR BD (NO USAR RM, COPIAR)
cp pg.db.backup-2026-07-03-143055 pg.db

# 5. VERIFICAR BD RESTAURADA
sqlite3 pg.db "SELECT COUNT(*) FROM contacts;"  # debe mostrar leads antiguos

# 6. Limpiar código de migración
git status
git log --oneline | head -5

# Si necesitas revertir cambios:
git reset --hard <COMMIT-ANTERIOR>

# 7. REINICIAR SERVIDOR
npm start

# 8. VERIFICAR LOG
tail -f nohup.out  # o logs del servidor
```

---

## ⚠️ Validación Post-Rollback

Después de restaurar, VERIFICAR:

```bash
# 1. BD está accesible
sqlite3 pg.db "SELECT COUNT(*) FROM contacts;" 

# 2. No hay tablas nuevas (si es rollback completo)
sqlite3 pg.db ".tables"  # NO debe mostrar 'leads' o 'intereses'

# 3. Servidor está UP
curl http://localhost:8000/api/crm/leads

# 4. Código está en commit correcto
git log --oneline | head -1
```

---

## 🔍 Diagnóstico Rápido

Si ves errores como estos después de migración, ejecutar ROLLBACK INMEDIATAMENTE:

### ❌ Error: "no such table: leads"
```
→ Migración falló a mitad, BD en estado inconsistente
→ ROLLBACK + Revisar migración (dry-run) en staging
```

### ❌ Error: "UNIQUE constraint failed"
```
→ Hay leads duplicados sin resolver
→ ROLLBACK + Revisar deduplicación
```

### ❌ Error: "FOREIGN KEY constraint"
```
→ Hay intereses sin lead asociado (orfandades)
→ ROLLBACK + Revisar integridad post-migración
```

### ❌ Error: "leads visible pero sin propiedades"
```
→ Migración creó leads pero no intereses
→ ROLLBACK + Ejecutar migración nuevamente (más lentamente)
```

---

## 📞 Si Nada Funciona

1. **Detener TODO**
   ```bash
   pm2 kill  # o kill -9 $(lsof -t -i :8000)
   ```

2. **Restaurar BD del backup más antiguo disponible**
   ```bash
   ls -lht pg.db.backup-* | tail -1  # El más antiguo
   cp pg.db.backup-XXXX pg.db
   ```

3. **Revertir a commit muy anterior (antes de migración)**
   ```bash
   git reset --hard <COMMIT-ANTERIOR-A-d48dc4f>
   ```

4. **Iniciar servidor con BD antigua**
   ```bash
   npm start
   ```

5. **Llamar a soporte técnico** para investigación post-mortem

---

## 🛑 NUNCA Hacer Esto

❌ NO borrar `pg.db.backup-*` archivos antes de 48 horas post-migración  
❌ NO ejecutar `DROP TABLE` manualmente  
❌ NO ignorar errores de "FOREIGN KEY constraint"  
❌ NO cambiar código mientras se ejecuta migración  
❌ NO reiniciar servidor a mitad de migración  

---

## 📋 Checklist de Rollback

Si decides rollback:

```
[ ] Detener servidor (pm2 stop / ctrl+C)
[ ] Copiar pg.db.backup-TIMESTAMP → pg.db
[ ] Ejecutar: git reset --hard <COMMIT-ANTERIOR>
[ ] Ejecutar: git log --oneline | head -1 (verificar)
[ ] Ejecutar: npm start
[ ] Verificar: curl http://localhost:8000/api/crm/leads
[ ] Verificar: Navegar a BD en navegador, ver leads antiguos
[ ] Notificar al cliente: "Rollback completado, sistema operativo"
```

---

**Última actualización:** 2026-07-03  
**Versionado:** Migración v1.0  
**Estado:** Listo para usar en emergencia
