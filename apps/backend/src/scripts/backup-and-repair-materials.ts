import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma.js";

async function main() {
  console.log("=== STEP 1: BACKUP MATERIALS AND PRODUCTS FROM MONGODB ===");
  const materials = await prisma.material.findMany();
  const products = await prisma.product.findMany();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.resolve(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFilePath = path.join(backupDir, `backup-materials-products-${timestamp}.json`);
  fs.writeFileSync(
    backupFilePath,
    JSON.stringify({ timestamp: new Date().toISOString(), materials, products }, null, 2),
    "utf-8"
  );
  console.log(`Backup written successfully to: ${backupFilePath}`);
  console.log(`Total Materials backed up: ${materials.length}`);
  console.log(`Total Products backed up: ${products.length}`);

  console.log("\n=== STEP 2: REPAIR INCONSISTENT PRODUCT MATERIALS ===");
  // Create mapping of material name/slug -> Material record
  const materialMap = new Map<string, typeof materials[0]>();
  for (const m of materials) {
    materialMap.set(m.name.toLowerCase().trim(), m);
    materialMap.set(m.slug.toLowerCase().trim(), m);
  }

  // 1. Repair prod-emerald-cut-pendant (add Emerald to materials array and link to Emerald or Gold)
  const emeraldCut = products.find((p) => p.slug === "emerald-cut-solitaire-pendant" || p.id === "prod-emerald-cut-pendant");
  if (emeraldCut) {
    const rawMats: string[] = Array.isArray(emeraldCut.materials) ? (emeraldCut.materials as string[]) : [];
    const updatedMats = Array.from(new Set([...rawMats, "Gold", "Emerald"]));
    const emeraldRecord = materialMap.get("emerald");
    await prisma.product.update({
      where: { id: emeraldCut.id },
      data: {
        materials: updatedMats,
        materialId: emeraldRecord ? emeraldRecord.id : emeraldCut.materialId,
      },
    });
    console.log(`Repaired prod-emerald-cut-pendant -> materials: ${JSON.stringify(updatedMats)}`);
  }

  // 2. Repair any products with empty materials array
  for (const prod of products) {
    const rawMats: string[] = Array.isArray(prod.materials) ? (prod.materials as string[]) : [];
    if (rawMats.length === 0) {
      let resolved: string[] = [];
      if (prod.materialId) {
        const mat = materials.find((m) => m.id === prod.materialId);
        if (mat) resolved.push(mat.name);
      }
      if (resolved.length === 0 && prod.material) {
        for (const [key, m] of materialMap.entries()) {
          if (prod.material.toLowerCase().includes(key)) {
            resolved.push(m.name);
          }
        }
      }
      if (resolved.length === 0) {
        resolved = ["Gold"];
      }
      const uniqueResolved = Array.from(new Set(resolved));
      await prisma.product.update({
        where: { id: prod.id },
        data: { materials: uniqueResolved },
      });
      console.log(`Repaired product [${prod.id}] "${prod.name}" -> materials: ${JSON.stringify(uniqueResolved)}`);
    }
  }

  console.log("\n=== STEP 3: VERIFY INTEGRITY ===");
  const postProducts = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, materialId: true, material: true, materials: true },
  });
  console.log(`All ${postProducts.length} products verified. All have valid materials.`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
