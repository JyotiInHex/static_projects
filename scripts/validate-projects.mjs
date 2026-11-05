import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = path.join(root, 'projects.json');
const errors = [];
const exists = async (relativePath) => {
  try { await access(path.resolve(root, relativePath)); return true; }
  catch { return false; }
};

let registry;
try {
  registry = JSON.parse(await readFile(registryPath, 'utf8'));
} catch (error) {
  console.error(`✖ Could not parse projects.json: ${error.message}`);
  process.exit(1);
}

if (!registry || !Array.isArray(registry.projects)) {
  console.error('✖ projects.json must contain a "projects" array.');
  process.exit(1);
}

const slugs = new Set();
for (const [index, project] of registry.projects.entries()) {
  const label = project?.slug || `projects[${index}]`;
  if (!project || typeof project !== 'object') {
    errors.push(`${label}: entry must be an object`);
    continue;
  }
  for (const field of ['slug', 'title', 'description', 'path']) {
    if (typeof project[field] !== 'string' || !project[field].trim()) {
      errors.push(`${label}: missing required string "${field}"`);
    }
  }
  if (project.slug) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug)) errors.push(`${label}: slug must be lowercase kebab-case`);
    if (slugs.has(project.slug)) errors.push(`${label}: duplicate slug`);
    slugs.add(project.slug);
  }
  if (project.path && (!project.path.startsWith('./') || project.path.startsWith('../'))) {
    errors.push(`${label}: path must be repository-relative and start with "./"`);
  } else if (project.path && !(await exists(project.path.replace(/^\.\//, '')))) {
    errors.push(`${label}: path does not exist: ${project.path}`);
  }
  if (project.detailPath && !(await exists(project.detailPath.replace(/^\.\//, '')))) {
    errors.push(`${label}: detail page does not exist: ${project.detailPath}`);
  }
  if (project.status && !['Available', 'In development', 'Archived'].includes(project.status)) {
    errors.push(`${label}: status must be Available, In development, or Archived`);
  }
  if (project.preview && !(await exists(project.preview.replace(/^\.\//, '')))) {
    errors.push(`${label}: preview image does not exist: ${project.preview}`);
  }
  if (project.categories && (!Array.isArray(project.categories) || project.categories.some(value => typeof value !== 'string'))) {
    errors.push(`${label}: categories must be an array of strings`);
  }
  if (project.technologies && (!Array.isArray(project.technologies) || project.technologies.some(value => typeof value !== 'string'))) {
    errors.push(`${label}: technologies must be an array of strings`);
  }
  for (const field of ['source']) {
    if (project[field]) {
      try { if (new URL(project[field]).protocol !== 'https:') throw new Error(); }
      catch { errors.push(`${label}: "${field}" must be a valid HTTPS URL`); }
    }
  }
}

if (errors.length) {
  console.error('✖ Project registry validation failed:\n' + errors.map(error => '  - ' + error).join('\n'));
  process.exit(1);
}
console.log(`✓ Validated ${registry.projects.length} project(s) in projects.json`);
