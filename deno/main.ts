import { serve } from "./deps.ts";
import { createSSRApp } from "https://esm.sh/vue@3.3.4";
import { renderToWebStream } from "https://esm.sh/@vue/server-renderer@3.3.4";
// import { serveFile } from "https://deno.land/std@0.193.0/http/file_server.ts";

// 定义多个 Vue 组件
const Header = {
  template: `<header><h1>Welcome to Deno SSR!</h1></header>`,
};

const Content = {
  data() {
    return { message: "This is dynamically rendered content." };
  },
  template: `<main><p>{{ message }}</p></main>`,
};

const Footer = {
  template: `<footer><p>© 2025 My Website</p></footer>`,
};

// 工具函数：将 Web Stream 的内容写入控制器
async function pipeStreamToController(stream: ReadableStream, controller: ReadableStreamDefaultController) {
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) controller.enqueue(value); // 将数据块写入控制器
  }
}

// 主处理函数：分块渲染并返回
async function handleRequest(req: Request): Promise<Response> {
  const stream = new ReadableStream({
    async start(controller) {
      // 渲染 Header
      const headerApp = createSSRApp(Header);
      const headerStream = await renderToWebStream(headerApp);
      await pipeStreamToController(headerStream, controller);

      // 渲染 Content
      const contentApp = createSSRApp(Content);
      const contentStream = await renderToWebStream(contentApp);
      await pipeStreamToController(contentStream, controller);

      // 渲染 Footer
      const footerApp = createSSRApp(Footer);
      const footerStream = await renderToWebStream(footerApp);
      await pipeStreamToController(footerStream, controller);

      // 结束流
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/html",
      "Transfer-Encoding": "chunked", // 分块传输
    },
  });

  

  // const { pathname } = new URL(req.url);
  // // 静态文件路径
  // const staticDir = "./public";

  // // 返回静态文件
  // if (pathname === "/" || pathname === "/index.html") {
  //   return await serveFile(req, `${staticDir}/index.html`);
  // }

  // // 返回动态流式内容
  // if (pathname === "/stream") {
  //   // 返回响应
  //   return new Response(stream, {
  //     headers: {
  //       "Content-Type": "text/html",
  //       "Transfer-Encoding": "chunked", // 分块传输
  //     },
  //   });
  // }
}

// 启动 Deno HTTP 服务
console.log("Server is running on http://localhost:8000");
serve(handleRequest, { port: 8000 });

