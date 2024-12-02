import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { join } from "node:path"

function findAndCreateEnvExample(dirPath: string) {
  const files = readdirSync(dirPath)

  for (const file of files) {
    const filePath = join(dirPath, file)
    const stats = statSync(filePath)

    if (stats.isDirectory()) findAndCreateEnvExample(filePath)
    else if (file === ".env") createEnvExample(filePath)
  }
}

function createEnvExample(envFilePath: string): void {
  const envContent = readFileSync(envFilePath, "utf-8")
  const envExamplePath = `${envFilePath}-example`
  const envExampleContent = envContent.replace(/=.+/g, "=<YOUR_VALUE>")

  writeFileSync(envExamplePath, envExampleContent)
}

findAndCreateEnvExample(process.cwd())

console.info("Created .env-example files")
