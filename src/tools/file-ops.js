import { readdir, rename, stat } from "fs/promises";
import { join, extname, basename } from "path";

async function listFiles({ directory, include_hidden = false }) {
  const absDir = directory.replace(/^~/, process.env.HOME);

  const info = await stat(absDir);
  if (!info.isDirectory()) {
    return { error: `${directory} 不是一个目录` };
  }

  const entries = await readdir(absDir, { withFileTypes: true });
  const files = entries
    .filter((e) => {
      if (!include_hidden && e.name.startsWith(".")) return false;
      return e.isFile();
    })
    .map((e) => ({
      name: e.name,
      ext: extname(e.name),
      nameWithoutExt: basename(e.name, extname(e.name)),
    }));

  return {
    directory: absDir,
    total: files.length,
    files,
  };
}

async function batchRenameFiles({ directory, renames }) {
  const absDir = directory.replace(/^~/, process.env.HOME);

  const info = await stat(absDir);
  if (!info.isDirectory()) {
    return { error: `${directory} 不是一个目录` };
  }

  const existing = new Set(
    (await readdir(absDir)).map((n) => n.toLowerCase())
  );

  const results = [];
  const pending = [];

  for (const { from, to } of renames) {
    if (!from || !to) {
      results.push({ from, to, status: "skipped", reason: "名称为空" });
      continue;
    }
    if (from === to) {
      results.push({ from, to, status: "skipped", reason: "名称未变" });
      continue;
    }
    if (
      existing.has(to.toLowerCase()) &&
      from.toLowerCase() !== to.toLowerCase()
    ) {
      results.push({ from, to, status: "skipped", reason: "目标文件已存在" });
      continue;
    }
    pending.push({ from, to });
  }

  for (const { from, to } of pending) {
    try {
      await rename(join(absDir, from), join(absDir, to));
      existing.delete(from.toLowerCase());
      existing.add(to.toLowerCase());
      results.push({ from, to, status: "ok" });
    } catch (err) {
      results.push({ from, to, status: "error", reason: err.message });
    }
  }

  const succeeded = results.filter((r) => r.status === "ok").length;
  const failed = results.filter((r) => r.status !== "ok").length;

  return { directory: absDir, succeeded, failed, details: results };
}

export const listFilesTool = {
  definition: {
    type: "function",
    function: {
      name: "list_files",
      description:
        "列出指定目录下的所有文件（不含子目录中的文件）。返回文件名、扩展名等信息。在批量重命名前应先调用此工具查看目录内容。",
      parameters: {
        type: "object",
        properties: {
          directory: {
            type: "string",
            description: "目标目录的绝对路径，如 /Users/xxx/photos",
          },
          include_hidden: {
            type: "boolean",
            description: "是否包含隐藏文件（以 . 开头的文件），默认 false",
          },
        },
        required: ["directory"],
      },
    },
  },
  handler: listFiles,
};

export const batchRenameTool = {
  definition: {
    type: "function",
    function: {
      name: "batch_rename_files",
      description:
        "批量重命名指定目录下的文件。需提供一个重命名映射数组，每项包含原文件名(from)和新文件名(to)。操作前会检查冲突，跳过有问题的项。建议先用 list_files 查看文件再构建重命名计划。",
      parameters: {
        type: "object",
        properties: {
          directory: {
            type: "string",
            description: "文件所在目录的绝对路径",
          },
          renames: {
            type: "array",
            description: "重命名映射数组",
            items: {
              type: "object",
              properties: {
                from: {
                  type: "string",
                  description: "原文件名（不含路径）",
                },
                to: {
                  type: "string",
                  description: "新文件名（不含路径）",
                },
              },
              required: ["from", "to"],
            },
          },
        },
        required: ["directory", "renames"],
      },
    },
  },
  handler: batchRenameFiles,
};
