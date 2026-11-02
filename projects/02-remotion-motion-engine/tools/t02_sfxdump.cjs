const esbuild=require('/workspace/tongzhengshi/project/app/node_modules/esbuild');
const r=esbuild.buildSync({entryPoints:['/workspace/tongzhengshi/project/app/src/t02/T02Full.tsx'],bundle:true,platform:'node',format:'cjs',write:false,external:['react','react-dom','remotion'],loader:{'.json':'json'}});
const m={exports:{}};new Function('module','exports','require',r.outputFiles[0].text)(m,m.exports,require);
console.log(JSON.stringify(m.exports.SFX_LIST));
