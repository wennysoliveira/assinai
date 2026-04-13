import { execSync } from "child_process";
import { mkdirSync, existsSync } from "fs";
import path from "path";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Erro: variável DATABASE_URL não encontrada.");
  process.exit(1);
}

const backupsDir = path.resolve(process.cwd(), "backups");

if (!existsSync(backupsDir)) {
  mkdirSync(backupsDir, { recursive: true });
}

const now = new Date();
const timestamp = now
  .toISOString()
  .replace(/T/, "_")
  .replace(/:/g, "-")
  .replace(/\..+/, "");

const filename = `backup_${timestamp}.sql`;
const outputPath = path.join(backupsDir, filename);

console.log(`Exportando banco de dados...`);
console.log(`Destino: ${outputPath}`);

try {
  execSync(`pg_dump "${DATABASE_URL}" > "${outputPath}"`, {
    stdio: ["inherit", "inherit", "inherit"],
    shell: true,
  });

  console.log(`\nExportação concluída com sucesso!`);
  console.log(`Arquivo salvo em: backups/${filename}`);
} catch (error) {
  console.error("\nFalha ao exportar o banco de dados.");
  process.exit(1);
}
