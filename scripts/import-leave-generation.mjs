import { createReadStream } from "node:fs";
import { rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import readline from "node:readline";

const args = process.argv.slice(2);

const readArg = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const generation = Number(readArg("--generation"));
const sourceFile = readArg("--file");
const batchSize = Number(readArg("--batch-size") ?? 100_000);
const useLinkedDatabase = args.includes("--linked");
const useLocalDatabase = args.includes("--local");
const dryRun = args.includes("--dry-run");

if (!Number.isInteger(generation) || generation < 0 || generation > 32_767 || !sourceFile) {
  console.error(
    "Uso: npm run supabase:import-leaves -- --generation <0..32767> --file <csv> " +
      "(--linked | --local) [--batch-size <n>] [--dry-run]"
  );
  process.exit(1);
}

if (!Number.isInteger(batchSize) || batchSize < 1) {
  console.error("--batch-size debe ser un entero positivo.");
  process.exit(1);
}

if (useLinkedDatabase === useLocalDatabase) {
  console.error("Selecciona exactamente un destino: --linked o --local.");
  process.exit(1);
}

const parseLine = (line, lineNumber) => {
  const columns = line.split(",");

  if (lineNumber === 1 && columns.join(",").toLowerCase() === "leave,value") {
    return null;
  }

  if (columns.length !== 2) {
    throw new Error(`Fila ${lineNumber}: se esperaban 2 columnas y llegaron ${columns.length}.`);
  }

  const [leave, rawValue] = columns;
  const value = Number(rawValue);

  if (!leave || rawValue.trim() === "" || !Number.isFinite(value)) {
    throw new Error(`Fila ${lineNumber}: residuo o valor inválido.`);
  }

  return { leave, value };
};

const visitRows = async (visitor) => {
  const input = createReadStream(sourceFile, { encoding: "utf8" });
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  let lineNumber = 0;

  for await (const line of lines) {
    lineNumber += 1;
    const row = parseLine(line, lineNumber);
    if (row) await visitor(row);
  }

  return lineNumber;
};

const runSupabaseQueryFile = (sqlFile) =>
  new Promise((resolve, reject) => {
    const supabaseCli = fileURLToPath(
      new URL("../node_modules/supabase/dist/supabase.js", import.meta.url)
    );
    const child = spawn(
      process.execPath,
      [
        supabaseCli,
        "db",
        "query",
        useLinkedDatabase ? "--linked" : "--local",
        "--file",
        sqlFile
      ],
      { stdio: "inherit", shell: false }
    );

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Supabase CLI terminó con código ${code}.`));
    });
  });

const escapeSqlString = (value) => value.replaceAll("'", "''");
const tempSqlFile = join(tmpdir(), `maslexico-leaves-${generation}-${process.pid}.sql`);

let validatedRows = 0;
const uniqueLeaves = new Set();

await visitRows(({ leave }) => {
  validatedRows += 1;
  if (!uniqueLeaves.add(leave)) {
    throw new Error(`Residuo duplicado en el CSV: ${leave}`);
  }
});

console.log(
  `Validado ${basename(sourceFile)}: ${validatedRows.toLocaleString("es-MX")} residuos únicos.`
);

if (dryRun) {
  console.log("Dry run completado; no se escribió en Supabase.");
  process.exit(0);
}

let batch = [];
let importedRows = 0;

const flushBatch = async () => {
  if (batch.length === 0) return;

  const values = batch
    .map(({ leave, value }) => `(${generation}, '${escapeSqlString(leave)}', ${value})`)
    .join(",\n");

  const sql = `insert into public.leave_values_by_generation (generation, leave, value)\nvalues\n${values}\non conflict (generation, leave) do update set value = excluded.value;\n`;

  await writeFile(tempSqlFile, sql, "utf8");
  await runSupabaseQueryFile(tempSqlFile);
  importedRows += batch.length;
  console.log(`Importados ${importedRows.toLocaleString("es-MX")} / ${validatedRows.toLocaleString("es-MX")}.`);
  batch = [];
};

try {
  await visitRows(async (row) => {
    batch.push(row);
    if (batch.length >= batchSize) await flushBatch();
  });
  await flushBatch();
} finally {
  await rm(tempSqlFile, { force: true });
}

console.log(`Generación ${generation} importada correctamente.`);
