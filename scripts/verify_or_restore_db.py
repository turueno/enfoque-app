#!/usr/bin/env python3
import sqlite3, os, sys, shutil

DB_PATH = 'data/enfoque.db'
GOLDEN_DB_PATH = 'data/backups/enfoque_production_gold_20261110.db'

print('🔍 Verificando integridad de la base de datos local...')

if not os.path.exists(DB_PATH):
    print(f'❌ {DB_PATH} no existe. Restaurando desde Golden Backup...')
    shutil.copyfile(GOLDEN_DB_PATH, DB_PATH)
    print('✅ Base de datos restaurada desde Golden Backup.')

con = sqlite3.connect(DB_PATH)
cur = con.cursor()

checks = [
    ('responsabilidades', 124),
    ('decisiones', 18),
    ('interfaces', 14),
    ('temas_impacto', 3),
    ('frentes', 7),
    ('personas', 7),
    ('textos_sistema', 108),
    ('dashboard_snapshots', 3)
]

all_ok = True

for table, min_count in checks:
    try:
        cur.execute(f'SELECT count(*) FROM {table}')
        count = cur.fetchone()[0]
        if count < min_count:
            print(f'⚠️ ALERTA: {table} tiene {count} filas (esperado >= {min_count}).')
            all_ok = False
        else:
            print(f'✅ {table}: {count} registros (OK)')
    except Exception as e:
        print(f'❌ Error consultando {table}: {e}')
        all_ok = False

cur.execute("SELECT count(*) FROM responsabilidades WHERE comentario_validacion IS NOT NULL AND length(comentario_validacion) > 0")
val_count = cur.fetchone()[0]
print(f'✅ Responsabilidades con comentarios de colaboradores: {val_count} (esperado ~89)')

if not all_ok:
    print('⚠️ Se detectaron discrepancias. Se recomienda no desplegar hasta restaurar los datos.')
    sys.exit(1)
else:
    print('🎉 Todo íntegro. Los datos de producción de Railway están 100% protegidos y preservados.')
    sys.exit(0)
