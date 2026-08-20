const fs = require("fs")
const path = require("path")
const { MedusaError } = require("@medusajs/framework/utils")

const dashboardPackagePath = require.resolve("@medusajs/dashboard/package.json")
const dashboardAppPath = path.join(path.dirname(dashboardPackagePath), "dist/app.js")
const builtAdminAssetsPath = path.resolve(
  __dirname,
  "../.medusa/server/public/admin/assets"
)
const templatePath = path.resolve(
  __dirname,
  "../../../product-import-example-new-products.csv"
)

const escapeTemplateLiteral = (value) =>
  value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\${/g, "\\${")

const template = fs.readFileSync(templatePath, "utf8").trimEnd()
const templateDataUrl = `data:text/csv;charset=utf-8,${escapeTemplateLiteral(template)}`
const templatePattern =
  /data:text\/csv;charset=utf-8,Product Id[\s\S]*?(?=`)/

const patchFile = (filePath) => {
  const content = fs.readFileSync(filePath, "utf8")

  if (!templatePattern.test(content)) {
    return false
  }

  const patched = content.replace(templatePattern, templateDataUrl)

  if (patched !== content) {
    fs.writeFileSync(filePath, patched)
  }

  return true
}

const filesToPatch = [dashboardAppPath]

if (fs.existsSync(builtAdminAssetsPath)) {
  for (const file of fs.readdirSync(builtAdminAssetsPath)) {
    if (file.startsWith("product-import-") && file.endsWith(".js")) {
      filesToPatch.push(path.join(builtAdminAssetsPath, file))
    }
  }
}

const patchedFiles = filesToPatch.filter(patchFile)

if (!patchedFiles.length) {
  throw new MedusaError(
    MedusaError.Types.UNEXPECTED_STATE,
    "Could not find Medusa product import template in dashboard bundle or build output"
  )
}

for (const file of patchedFiles) {
  console.log(`Patched product import template in ${file}`)
}
