import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
execFileSync(process.execPath,[path.join(root,'scripts/build.mjs')],{stdio:'inherit'});
const base=(process.env.BASE_PATH??'').replace(/\/$/,'');const dist=path.join(root,'dist');const port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.pdf':'application/pdf','.mp4':'video/mp4','.xml':'application/xml','.txt':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);res.end('Bad URL');return}
 if(!pathname.startsWith(base+'/')&&pathname!==base){res.writeHead(302,{Location:base+'/en/'});res.end();return}
 let rest=pathname.slice(base.length).replace(/^\//,'');let full=path.resolve(dist,rest);
 if(!full.startsWith(dist+path.sep)&&full!==dist){res.writeHead(403);res.end();return}
 if(!path.extname(full))full=path.join(full,'index.html');
 if(!fs.existsSync(full)){res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');return}
 res.writeHead(200,{'Content-Type':mime[path.extname(full)]||'application/octet-stream'});fs.createReadStream(full).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log(`Local portfolio: http://127.0.0.1:${port}${base}/en/`));
