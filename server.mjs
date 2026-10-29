import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(root, 'dist');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.m4a': 'audio/mp4' };
function json(res, code, body, extra={}) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra });
  res.end(JSON.stringify(body));
}
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','same-origin');
  res.setHeader('Permissions-Policy','microphone=(self), camera=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; media-src 'self' blob:; frame-src 'none'; object-src 'none'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'");
  try {
    const url = new URL(req.url, 'http://localhost');
    if(url.pathname.startsWith('/api/')) return json(res,404,{error:'未找到接口。'});
    if(!['GET','HEAD'].includes(req.method)) return json(res,405,{error:'不支持此请求。'});
    const path=resolve(publicDir,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
    if(!path.startsWith(publicDir+sep)) return json(res,403,{error:'禁止访问。'});
    const content=await readFile(path);
    const headers={'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-cache','Accept-Ranges':'bytes'};
    if(req.method==='GET' && req.headers.range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      let start=match?.[1]?Number(match[1]):0;
      let end=match?.[2]?Number(match[2]):content.length-1;
      if(match && !match[1] && match[2]){start=Math.max(0,content.length-Number(match[2]));end=content.length-1;}
      if(!match || (!match[1]&&!match[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start>end || start>=content.length){
        res.writeHead(416,{...headers,'Content-Range':`bytes */${content.length}`});return res.end();
      }
      end=Math.min(end,content.length-1);
      res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${content.length}`,'Content-Length':end-start+1});
      return res.end(content.subarray(start,end+1));
    }
    res.writeHead(200,{...headers,'Content-Length':content.length});
    res.end(req.method==='HEAD'?undefined:content);
  } catch(err) {
    if(err.code==='ENOENT') return json(res,404,{error:'页面不存在。'});
    if(err instanceof SyntaxError || err.message==='BODY_TOO_LARGE') return json(res,400,{error:'提交内容格式不正确或过长。'});
    console.error(err.message);
    json(res,500,{error:'小屋暂时没有收到消息，请稍后重试。'});
  }
});
const port=Number(process.env.PORT||4173);
server.listen(port,process.env.HOST||'127.0.0.1',()=>console.log(`Birthday room: http://127.0.0.1:${server.address().port}`));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
