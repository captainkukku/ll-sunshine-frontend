// scripts/update-json-paths.js
const fs = require('fs');
const path = require('path');

const jsonPath = path.resolve(__dirname, '../public/data/ll_sunshine_points.json');
// 如果你要保留原文件，也可以改成另一个输出文件名
// const outPath = path.resolve(__dirname, '../public/data/ll_sunshine_points_local.json');
const outPath = jsonPath;

function main() {
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const arr = JSON.parse(raw);

  const updated = arr.map(item => {
    // 从原始 URL 中截取文件名
    const url = item.ref || '';
    const filename = url.substring(url.lastIndexOf('/') + 1);

    // 新的本地路径 —— public 下 data/screenshots/ 里要有同名文件
    const localPath = `/data/screenshots/${filename}`;

    return {
      ...item,
      // 把 ref 字段也改成本地路径，或者你也可以新增 screenshotUrl 字段保留旧 ref
      ref: localPath,
      screenshotUrl: localPath,
    };
  });

  fs.writeFileSync(outPath, JSON.stringify(updated, null, 2), 'utf8');
  console.log(`✅ Updated ${updated.length} entries in ${outPath}`);
}

main();
