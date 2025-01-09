<script setup>
// import { ref } from 'vue'

defineProps({
  msg: String,
})

// 用于接收流式内容并渲染
const fetchStream = async () => {
      const response = await fetch('http://localhost:3000/'); // 服务器端渲染的地址
      const reader = response.body.getReader(); // 获取流的读取器
      const decoder = new TextDecoder();
      let htmlContent = '';
      
      // 读取流并累积数据
      while (true) {
        const { done, value } = await reader.read();
        if (done) break; // 数据读取完毕
        htmlContent += decoder.decode(value, { stream: true }); // 解码流并追加到内容中
        document.getElementById('streamApp').innerHTML = htmlContent; // 更新页面
      }
    };

  // 调用流式加载函数
  fetchStream();
</script>

<template>
  <h1>流式渲染</h1>

  <div>{{ msg }}</div>
  
  <div id="streamApp"></div>
</template>

<style scoped>
.user-info, .product-list {
  margin: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
}
</style>
