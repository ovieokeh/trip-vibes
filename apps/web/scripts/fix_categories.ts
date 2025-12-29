import * as fs from "fs";
import * as path from "path";
import { CATEGORIES, CategoryNode } from "../lib/categories";

const CATEGORIES_FILE = path.join(__dirname, "../lib/categories.ts");

function fixCategories() {
  console.log("Fixing categories hierarchy...");

  const newCategories: Record<string, CategoryNode> = {};

  // First, clone the categories and reset parent/children
  for (const [id, node] of Object.entries(CATEGORIES)) {
    newCategories[id] = {
      ...node,
      parentId: null,
      children: [],
    };
  }

  // Create a lookup for label -> id
  const labelToId: Record<string, string> = {};
  for (const [id, node] of Object.entries(CATEGORIES)) {
    labelToId[node.label] = id;
  }

  // Now, for each category, find its parent based on label
  for (const [id, node] of Object.entries(newCategories)) {
    const parts = node.label.split(" > ");

    // Try to find the closest ancestor that exists in our map
    let parentId: string | null = null;
    for (let i = parts.length - 2; i >= 0; i--) {
      const ancestorLabel = parts.slice(0, i + 1).join(" > ");
      if (labelToId[ancestorLabel]) {
        parentId = labelToId[ancestorLabel];
        break;
      }
    }

    if (parentId) {
      node.parentId = parentId;
      // We'll add children in a second pass to avoid duplicates and ensure all parents are updated
    }
  }

  // Second pass: Populate children arrays
  for (const [id, node] of Object.entries(newCategories)) {
    if (node.parentId && newCategories[node.parentId]) {
      if (!newCategories[node.parentId].children.includes(id)) {
        newCategories[node.parentId].children.push(id);
      }
    }
  }

  // Sort children for consistency
  for (const node of Object.values(newCategories)) {
    node.children.sort();
  }

  // Generate the new file content
  const content = `/**
 * Auto-generated Category Map from categories.md
 * Fixed by script.
 */

export interface CategoryNode {
    id: string;
    name: string;
    label: string;
    parentId: string | null;
    children: string[];
}

export const CATEGORIES: Record<string, CategoryNode> = ${JSON.stringify(newCategories, null, 2)};
`;

  fs.writeFileSync(CATEGORIES_FILE, content);
  console.log("Successfully updated lib/categories.ts");
}

fixCategories();
