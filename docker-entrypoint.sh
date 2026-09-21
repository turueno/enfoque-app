#!/bin/sh
set -e

# Asegurar que /app/data pertenezca al usuario y tenga permisos completos de escritura
mkdir -p /app/data
chmod 777 /app/data 2>/dev/null || true

# Si no existe la base de datos en el volumen persistente montado, copiar la semilla inicial
if [ ! -f /app/data/enfoque.db ]; then
  echo "=> Volumen inicial vacío detectado. Sembrando base de datos inicial desde /app/seed-data/enfoque.db..."
  cp /app/seed-data/enfoque.db /app/data/enfoque.db
  chmod 666 /app/data/enfoque.db 2>/dev/null || true
  echo "=> Base de datos sembrada exitosamente en /app/data/enfoque.db"
fi

exec "$@"
