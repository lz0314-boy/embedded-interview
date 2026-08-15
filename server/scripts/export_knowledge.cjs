const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..", "..");
const sources = [
  "js/data.js",
  "js/data_resume.js",
  "js/data_rtthread.js",
  "js/data_linux_lab.js",
  "js/data_supplement.js"
];

const htmlEntities = new Map([
  ["amp", "&"], ["lt", "<"], ["gt", ">"], ["quot", '"'],
  ["apos", "'"], ["nbsp", " "], ["#39", "'"]
]);

function decodeEntities(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity.startsWith("#x")) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith("#")) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    return htmlEntities.get(entity.toLowerCase()) ?? match;
  });
}

function htmlToText(value) {
  if (!value) return "";
  return decodeEntities(String(value)
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|li|ol|ul|tr|table|pre|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, ""))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const context = vm.createContext({ console });
const program = sources
  .map((relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8"))
  .join("\n\n") + "\n;globalThis.__EMBEDDED_DATA__ = EMBEDDED_DATA;";
vm.runInContext(program, context, { filename: "embedded-data.bundle.js" });

const documents = [];
for (const category of context.__EMBEDDED_DATA__) {
  for (const question of category.questions ?? []) {
    const followups = (question.followups ?? []).map((item) => ({
      question: htmlToText(item.q),
      answer: htmlToText(item.a)
    }));
    documents.push({
      id: question.id,
      category_id: category.id,
      category: category.name,
      title: htmlToText(question.q),
      brief: htmlToText(question.brief),
      answer: htmlToText(question.a),
      followups,
      tags: question.tags ?? [],
      priority: question.priority ?? "normal",
      difficulty: question.difficulty ?? "base",
      status: question.status ?? (category.track === "resume" ? "resume_narrative" : "curated"),
      evidence: htmlToText(question.evidence),
      boundary: htmlToText(question.boundary),
      caution: htmlToText(question.caution),
      source: `website:${question.id}`
    });
  }
}

const outputPath = path.join(root, "server", "knowledge", "public", "interview.json");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(documents, null, 2)}\n`, "utf8");
console.log(`Exported ${documents.length} knowledge documents to ${path.relative(root, outputPath)}`);
