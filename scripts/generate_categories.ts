import fs from "fs";
import path from "path";

const CATEGORIES_MD_PATH = path.join(__dirname, "../categories.md");
const OUTPUT_PATH = path.join(__dirname, "../lib/categories.ts");

interface CategoryNode {
  id: string;
  name: string;
  label: string;
  parentId: string | null;
  children: string[];
}

function parseCategories() {
  console.log("Reading from " + CATEGORIES_MD_PATH + "...");
  const content = fs.readFileSync(CATEGORIES_MD_PATH, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim().length > 0);

  const categories: Record<string, CategoryNode> = {};
  const labelToId: Record<string, string> = {};

  lines.forEach((line, index) => {
    if (index === 0 && line.startsWith("CategoryId")) return; // Skip header

    // ID is fixed width 24 chars
    const match = line.match(/^([a-f0-9]{24})\s+(.+)$/);
    if (!match) {
      return;
    }

    const id = match[1];
    const rest = match[2];

    // Find split point
    // Heuristic: Split at a space such that the right part (Label) ends with the left part (Name)
    // We iterate from right to left to find the LAST valid split?
    // No, iterate from left or find valid splits.
    // "Amusement Park Arts and Entertainment > Amusement Park"
    // Name="Amusement Park", Label="Arts...Park"

    let bestName = "";
    let bestLabel = "";

    // Split by spaces
    // We assume separation is at least one space.
    // There might be multiple spaces.

    // Optimization: iterate indices of spaces
    for (let i = 1; i < rest.length - 1; i++) {
      if (rest[i] === " ") {
        // Potential split
        const nameCandidate = rest.substring(0, i).trim();
        const labelCandidate = rest.substring(i + 1).trim();

        if (labelCandidate.endsWith(nameCandidate)) {
          // Valid candidate
          // Prefer the one where labelCandidate == nameCandidate (Root) or labelCandidate includes ' > '
          if (labelCandidate === nameCandidate || labelCandidate.includes(" > ")) {
            // If we have multiple matches, which one to pick?
            // "Bar Bar" -> Name "Bar", Label "Bar".
            // "Foo Bar Foo Bar" -> Name "Foo Bar", Label "Foo Bar".
            // What if "Foo Bar Bar" (Child Name "Bar", Parent "Foo Bar")
            // Label "Foo Bar > Bar". Name "Bar".
            // Split 1: Name "Foo", Label "Bar Bar" (No)
            // Split 2: Name "Foo Bar", Label "Bar" (No)

            // Actually, we want the *longest* match for Label?
            // No, checking the file, Name appears first.
            // "Amusement Park Arts..."
            // Name is "Amusement Park".

            // Use first valid split from the left?
            // "Amusement Park Arts..."
            // "Amusement" / "Park Arts..." -> Label "Park Arts..." does not end with "Amusement".
            // "Amusement Park" / "Arts... Park" -> Ends with "Amusement Park".

            bestName = nameCandidate;
            bestLabel = labelCandidate;
            // Since we scan from left, the first match that satisfies condition is likely correct?
            // Wait, "Amusement Park" contains space. i=9 (space after Amusement).
            // Label "Park Arts... Amusement Park". Ends with "Amusement"? No.

            // So we overwrite.
            // Wait, if we keep going?
            // If we find another split?
            // Unlikely to have multiple splits satisfying the condition unless ambiguous.
            // Let's stick with the first one found? No, let's try finding the *correct* one.
            // Actually, for "Amusement Park Arts...", only the split after "Park" works.

            break;
          }
        }
      }
    }

    if (!bestName) {
      console.warn("Could not parse: " + rest);
      return;
    }

    labelToId[bestLabel] = id;
    categories[id] = {
      id,
      name: bestName,
      label: bestLabel,
      parentId: null,
      children: [],
    };
  });

  // Build Hierarchy
  Object.values(categories).forEach((cat) => {
    if (cat.label.includes(" > ")) {
      const parts = cat.label.split(" > ");
      parts.pop();
      const parentLabel = parts.join(" > ");
      const parentId = labelToId[parentLabel];

      if (parentId && categories[parentId]) {
        cat.parentId = parentId;
        categories[parentId].children.push(cat.id);
      }
    }
  });

  const outputContent = `/**
 * Auto-generated Category Map from categories.md
 * Do not edit manually.
 */

export interface CategoryNode {
    id: string;
    name: string;
    label: string;
    parentId: string | null;
    children: string[];
}

export const CATEGORIES: Record<string, CategoryNode> = ${JSON.stringify(categories, null, 2)};

export function getCategoryById(id: string): CategoryNode | undefined {
    return CATEGORIES[id];
}

export function getAllChildIds(id: string): string[] {
    const output: string[] = [];
    const stack = [id];
    while (stack.length) {
        const curr = stack.pop();
        if (curr && CATEGORIES[curr]) {
            output.push(curr);
            stack.push(...CATEGORIES[curr].children);
        }
    }
    return output;
}

export function isCategoryMatch(candidateId: string, targetId: string): boolean {
    if (candidateId === targetId) return true;
    let curr = CATEGORIES[candidateId];
    while (curr && curr.parentId) {
        if (curr.parentId === targetId) return true;
        curr = CATEGORIES[curr.parentId];
    }
    return false;
}
`;

  fs.writeFileSync(OUTPUT_PATH, outputContent);
  console.log("Generated " + OUTPUT_PATH + " with " + Object.keys(categories).length + " categories.");
}

parseCategories();
