#!/usr/bin/env -S deno run --allow-net
// http://localhost:8000/

import { ConnInfo, serve } from "https://deno.land/std@0.114.0/http/server.ts";

const HEADER = { "content-type": "application/json; charset=utf-8" };

function notFound() {
  return new Response("{}", {
    status: 400,
    headers: HEADER,
  });
}

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

function ip(connInfo: ConnInfo) {
  const addr = connInfo.remoteAddr as Deno.NetAddr;
  return new Response(JSON.stringify({ ip: addr.hostname }), {
    headers: HEADER,
  });
}

async function dns(url: URL) {
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
        headers: HEADER,
      },
    );
  }
  return notFound();
}

function spec() {
  return new Response(
    `
swagger: "2.0"
info:
  description: "description"
  version: "1.0.0"
  title: "chibapi"
  termsOfService: "http://swagger.io/terms/"
  contact:
    email: "apiteam@swagger.io"
  license:
    name: "Apache 2.0"
    url: "http://www.apache.org/licenses/LICENSE-2.0.html"
#host: "petstore.swagger.io"
#basePath: "/"
#schemes:
#- "https"
#- "http"
paths:
  /ip:
    get:
      summary: "summary"
      description: "description"
      operationId: "ip"
      produces:
      - "application/json"
      responses:
        "200":
          description: "successful operation"
          schema:
            $ref: "#/definitions/Ip"
  /dns:
    get:
      summary: "Logs user into the system"
      description: ""
      operationId: "dns"
      produces:
      - "application/json"
      parameters:
      - name: "query"
        in: "query"
        description: "description"
        default: "golang.org"
        required: true
        type: "string"
      responses:
        "200":
          description: "description"
          schema:
            $ref: "#/definitions/Dns"
        "400":
          description: "description"
definitions:
  Ip:
    type: "object"
    properties:
      ip:
        type: "string"
  Dns:
    type: "object"
    properties:
      A:
        type: "array"
        items:
          type: "string"
      AAAA:
        type: "array"
        items:
          type: "string"
      ANAME:
        type: "array"
        items:
          type: "string"
      CNAME:
        type: "array"
        items:
          type: "string"
      PTR:
        type: "array"
        items:
          type: "string"
externalDocs:
  description: "Find out more about Swagger"
  url: "http://swagger.io"
  `,
    {
      headers: { "content-type": "application/x-yaml; charset=utf-8" },
    },
  );
}

function swaggerUi(url: URL) {

  const specUrl = url.protocol + "//" + url.host + "/spec.yaml";

  const resourceBase = "https://unpkg.com/swagger-ui-dist@4.1.3/";
  return new Response(
    `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Swagger UI</title>
    <link rel="stylesheet" type="text/css" href="${resourceBase}/swagger-ui.css" />
    <link rel="icon" type="image/png" href="${resourceBase}/favicon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="${resourceBase}/favicon-16x16.png" sizes="16x16" />
    <style>
      html
      {
        box-sizing: border-box;
        overflow: -moz-scrollbars-vertical;
        overflow-y: scroll;
      }
      *,
      *:before,
      *:after
      {
        box-sizing: inherit;
      }
      body
      {
        margin:0;
        background: #fafafa;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${resourceBase}/swagger-ui-bundle.js" charset="UTF-8"> </script>
    <script src="${resourceBase}/swagger-ui-standalone-preset.js" charset="UTF-8"> </script>
    <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
      window.ui = ui;
    };
  </script>
  <style>
    .swagger-ui .topbar .download-url-wrapper { display: none } undefined
  </style>
  </body>
</html>
  `,
    {
      headers: { "content-type": "text/html; charset=utf-8" },
    },
  );
}

async function handler(req: Request, connInfo: ConnInfo) {
  const url = new URL(req.url);
  if (url.pathname === "/ip") {
    return ip(connInfo);
  } else if (url.pathname === "/dns") {
    return await dns(url);
  } else if (url.pathname === "/spec.yaml") {
    return spec();
  } else if (url.pathname === "/swagger-ui.html") {
    return swaggerUi(url);
  }
  return notFound();
}

serve(handler);
console.log("Listening");
