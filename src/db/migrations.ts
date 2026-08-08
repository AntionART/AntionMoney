import type { SQLiteDatabase } from 'expo-sqlite';

const DB_VERSION = 7;

const DEFAULT_CATEGORIES: Array<{ nombre: string; icono: string; color: string; tipo: 'gasto' | 'ahorro' }> = [
  { nombre: 'Comida', icono: 'restaurant-outline', color: '#6B6B6B', tipo: 'gasto' },
  { nombre: 'Transporte', icono: 'car-outline', color: '#6B6B6B', tipo: 'gasto' },
  { nombre: 'Vivienda', icono: 'home-outline', color: '#6B6B6B', tipo: 'gasto' },
  { nombre: 'Ocio', icono: 'game-controller-outline', color: '#6B6B6B', tipo: 'gasto' },
  { nombre: 'Salud', icono: 'medkit-outline', color: '#6B6B6B', tipo: 'gasto' },
  { nombre: 'Ahorro', icono: 'trending-up-outline', color: '#3FA65C', tipo: 'ahorro' },
];

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DB_VERSION) {
    return;
  }

  if (currentVersion < 1) {
    await migrarV1(db);
  }
  if (currentVersion < 2) {
    await migrarV2(db);
  }
  if (currentVersion < 3) {
    await migrarV3(db);
  }
  if (currentVersion < 4) {
    await migrarV4(db);
  }
  if (currentVersion < 5) {
    await migrarV5(db);
  }
  if (currentVersion < 6) {
    await migrarV6(db);
  }
  if (currentVersion < 7) {
    await migrarV7(db);
  }

  await db.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
}

async function migrarV1(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS usuario (
      id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
      nombre TEXT NOT NULL DEFAULT '',
      ingreso_mensual REAL NOT NULL DEFAULT 0,
      moneda_principal TEXT NOT NULL DEFAULT 'COP',
      modo_tema TEXT NOT NULL DEFAULT 'oscuro',
      proposito_principal TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS cuenta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      moneda TEXT NOT NULL DEFAULT 'COP',
      saldo_actual REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS categoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      icono TEXT NOT NULL,
      color TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK (tipo IN ('gasto', 'ahorro'))
    );

    CREATE TABLE IF NOT EXISTS transaccion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cuenta_id INTEGER REFERENCES cuenta(id),
      monto REAL NOT NULL,
      moneda TEXT NOT NULL DEFAULT 'COP',
      categoria_id INTEGER REFERENCES categoria(id),
      nota TEXT NOT NULL DEFAULT '',
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      es_impulso INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const usuarioExistente = await db.getFirstAsync('SELECT id FROM usuario WHERE id = 1');
  if (!usuarioExistente) {
    await db.runAsync(
      'INSERT INTO usuario (id, nombre, ingreso_mensual, moneda_principal, modo_tema) VALUES (1, ?, ?, ?, ?)',
      ['', 0, 'COP', 'oscuro']
    );
  }

  const categoriasExistentes = await db.getFirstAsync('SELECT id FROM categoria LIMIT 1');
  if (!categoriasExistentes) {
    for (const cat of DEFAULT_CATEGORIES) {
      await db.runAsync(
        'INSERT INTO categoria (nombre, icono, color, tipo) VALUES (?, ?, ?, ?)',
        [cat.nombre, cat.icono, cat.color, cat.tipo]
      );
    }
  }
}

async function migrarV2(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS meta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      monto_objetivo REAL NOT NULL,
      monto_actual REAL NOT NULL DEFAULT 0,
      fecha_limite TEXT,
      estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'cumplida')),
      prioridad INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS aporte_meta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meta_id INTEGER NOT NULL REFERENCES meta(id),
      monto REAL NOT NULL,
      fecha TEXT NOT NULL
    );
  `);
}

async function migrarV3(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tentacion_pendiente (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descripcion TEXT NOT NULL,
      monto_estimado REAL NOT NULL,
      fecha_creacion TEXT NOT NULL DEFAULT (datetime('now')),
      fecha_disponible TEXT NOT NULL,
      resuelto INTEGER NOT NULL DEFAULT 0,
      notification_id TEXT
    );

    ALTER TABLE usuario ADD COLUMN recordatorio_diario_activo INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE usuario ADD COLUMN recordatorio_diario_hora INTEGER NOT NULL DEFAULT 20;
    ALTER TABLE usuario ADD COLUMN recordatorio_notification_id TEXT;
  `);
}

async function migrarV4(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS deuda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      monto_total REAL NOT NULL,
      saldo_pendiente REAL NOT NULL,
      contraparte TEXT NOT NULL DEFAULT '',
      tasa_interes REAL,
      numero_cuotas INTEGER NOT NULL DEFAULT 1,
      fecha_proxima_cuota TEXT,
      en_mora INTEGER NOT NULL DEFAULT 0,
      afecta_disponible INTEGER NOT NULL DEFAULT 0,
      estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'pagada')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pago_deuda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deuda_id INTEGER NOT NULL REFERENCES deuda(id),
      monto REAL NOT NULL,
      fecha TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gasto_recurrente (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      monto REAL NOT NULL,
      categoria_id INTEGER REFERENCES categoria(id),
      dia_del_mes INTEGER NOT NULL,
      activo INTEGER NOT NULL DEFAULT 1,
      afecta_disponible INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    ALTER TABLE transaccion ADD COLUMN gasto_recurrente_id INTEGER REFERENCES gasto_recurrente(id);
  `);
}

async function migrarV5(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS indice_disciplina_historial (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL UNIQUE,
      valor INTEGER NOT NULL,
      desglose_json TEXT NOT NULL
    );
  `);
}

async function migrarV6(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS salud_financiera_historial (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL UNIQUE,
      valor INTEGER NOT NULL,
      desglose_json TEXT NOT NULL
    );
  `);
}

async function migrarV7(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS modo_ciclo_vida (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      modo TEXT NOT NULL CHECK (modo IN ('supervivencia', 'recuperacion', 'construccion', 'normal')),
      causa TEXT NOT NULL DEFAULT '',
      fecha_activacion TEXT NOT NULL,
      fecha_desactivacion TEXT
    );

    CREATE TABLE IF NOT EXISTS hito_memoria_financiera (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT NOT NULL DEFAULT '',
      monto REAL,
      fecha TEXT NOT NULL,
      generado_automaticamente INTEGER NOT NULL DEFAULT 1,
      es_cumpleanos_financiero INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS diario_financiero_entrada (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL UNIQUE,
      como_estuvo TEXT NOT NULL CHECK (como_estuvo IN ('excelente', 'normal', 'dificil')),
      motivo TEXT NOT NULL DEFAULT '',
      motivo_texto_libre TEXT NOT NULL DEFAULT ''
    );

    ALTER TABLE transaccion ADD COLUMN contexto_emocional TEXT;
    ALTER TABLE usuario ADD COLUMN onboarding_completado INTEGER NOT NULL DEFAULT 0;

    UPDATE usuario SET onboarding_completado = 1 WHERE ingreso_mensual > 0;
  `);
}
