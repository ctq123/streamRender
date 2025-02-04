import { createSSRApp } from 'https://esm.sh/vue@3.3.4';

// 动态插入流数据并渲染页面
async function loadStreamedContent() {
  // 获取服务端流式内容
  const response = await fetch('/');
  if (!response.body) {
    console.error('No response body available');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');

  // 动态插入流式内容到页面
  const container = document.getElementById('app') || document.body;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    container.innerHTML += decoder.decode(value); // 追加 HTML
  }

  // Vue 应用挂载
  const App = {
    template: `
      <div id="app">
        <header><h1>Welcome to Deno SSR!</h1></header>
        <main><p>This is dynamically rendered content.</p></main>
        <footer><p>© 2025 My Website</p></footer>
      </div>
    `,
  };

  createSSRApp(App).mount('#app'); // 挂载到服务端生成的 DOM 上
}

// 页面加载完成后运行
if (document.readyState === 'complete') {
  loadStreamedContent();
} else {
  window.addEventListener('DOMContentLoaded', loadStreamedContent);
}
