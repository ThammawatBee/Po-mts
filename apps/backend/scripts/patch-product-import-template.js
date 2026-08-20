const fs = require("fs")
const path = require("path")
const { MedusaError } = require("@medusajs/framework/utils")

const dashboardPackagePath = require.resolve("@medusajs/dashboard/package.json")
const dashboardAppPath = path.join(path.dirname(dashboardPackagePath), "dist/app.js")
const templatePath = path.resolve(
  __dirname,
  "../../../product-import-example-new-products.csv"
)

const escapeTemplateLiteral = (value) =>
  value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\${/g, "\\${")

const template = fs.readFileSync(templatePath, "utf8").trimEnd()
const appBundle = fs.readFileSync(dashboardAppPath, "utf8")
const replacement = `ProductImportCSV = \`data:text/csv;charset=utf-8,${escapeTemplateLiteral(template)}\`;`
const templatePattern =
  /ProductImportCSV = `data:text\/csv;charset=utf-8,[\s\S]*?`;/

if (!templatePattern.test(appBundle)) {
  throw new MedusaError(
    MedusaError.Types.UNEXPECTED_STATE,
    "Could not find Medusa product import template in dashboard bundle"
  )
}

const patched = appBundle.replace(templatePattern, replacement)

if (patched !== appBundle) {
  fs.writeFileSync(dashboardAppPath, patched)
}

console.log(`Patched product import template in ${dashboardAppPath}`)
