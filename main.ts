#!/usr/bin/env -S deno run --allow-net=:8000
// http://localhost:8000/

import { ConnInfo, serve } from "https://deno.land/std@0.114.0/http/server.ts";

function handler(req: Request, connInfo: ConnInfo) {
  const url = new URL(req.url);
  if (url.pathname == "/ip") {
    const addr = connInfo.remoteAddr as Deno.NetAddr;
    return new Response(JSON.stringify({ ip: addr.hostname }), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } else {
    return new Response("{}", {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}

serve(handler);
console.log("Listening");
