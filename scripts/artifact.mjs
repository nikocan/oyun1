// dist-artifact/index.html'i claude.ai Artifact sayfası biçimine çevirir
// (doctype/html/head/body etiketleri yayınlarken otomatik eklenir).
import { readFileSync, writeFileSync } from 'node:fs';
const src = readFileSync('dist-artifact/index.html', 'utf8');
const styles = [...src.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0]).join('\n');
const scripts = [...src.matchAll(/<script[^>]*>[\s\S]*?<\/script>/g)].map((m) => m[0]).join('\n');
const out = `<title>Taş Ustası</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>:root{--safe-top:0px;--safe-bottom:0px}</style>
${styles}
<div id="app"></div>
${scripts}
`;
writeFileSync('dist-artifact/tas-ustasi.html', out);
console.log('artifact:', (out.length / 1024).toFixed(0), 'KB');
