#!/usr/bin/env -S deno run --allow-net
// http://localhost:8000/

import { ConnInfo, serve } from "https://deno.land/std@0.114.0/http/server.ts";

async function resolveDns(
  query: string,
  recordType: "A" | "AAAA" | "ANAME" | "CNAME" | "PTR",
) {
  try {
    return await Deno.resolveDns(query, recordType);
  } catch (e) {
    console.log(e);
  }
  return [];
}

async function handler(req: Request, connInfo: ConnInfo) {
  const url = new URL(req.url);
  if (url.pathname === "/ip") {
    const addr = connInfo.remoteAddr as Deno.NetAddr;
    return new Response(JSON.stringify({ ip: addr.hostname }), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } else if (url.pathname === "/dns") {
    const query = url.searchParams.get("query");
    if (query) {
      const a = await resolveDns(query, "A");
      const aaaa = await resolveDns(query, "AAAA");
      const aname = await resolveDns(query, "ANAME");
      const cname = await resolveDns(query, "CNAME");
      const ptr = await resolveDns(query, "PTR");
      return new Response(
        JSON.stringify({
          A: a,
          AAAA: aaaa,
          ANAME: aname,
          CNAME: cname,
          PTR: ptr,
        }),
        {
          headers: { "content-type": "application/json; charset=utf-8" },
        },
      );
    }
  }
  return new Response("{}", {
    status: 400,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

serve(handler);
console.log("Listening");
