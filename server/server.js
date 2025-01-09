// server.js
import express from 'express';
import cors from 'cors';
import { createApp } from 'vue';
import { renderToStream } from '@vue/server-renderer';

const app = express();

// 默认允许所有来源
app.use(cors());

// 模拟获取用户信息和产品列表的 API
const fetchUserInfo = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ name: 'John Doe', age: 30 });
    }, 5000);
  });
};

const fetchProductList = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, name: 'Product 1', price: 100 },
        { id: 2, name: 'Product 2', price: 200 },
      ]);
    }, 2000);
  });
};

// 创建一个 Vue 组件：用户信息模块
const UserInfo = {
  props: ['user'],
  template: `
    <div class="user-info">
      <h2>User Info</h2>
      <p>Name: {{ user.name }}</p>
      <p>Age: {{ user.age }}</p>
    </div>
  `,
};

// 创建一个 Vue 组件：产品列表模块
const ProductList = {
  props: ['products'],
  template: `
    <div class="product-list">
      <h2>Product List</h2>
      <ul>
        <li v-for="product in products" :key="product.id">
          {{ product.name }} - {{ product.price }}
        </li>
      </ul>
    </div>
  `,
};

app.get('/', async (req, res) => {
  try {
    // 获取用户信息和产品列表
    const [userInfo, productList] = await Promise.all([fetchUserInfo(), fetchProductList()]);

    // 创建 Vue 应用
    const vueApp = createApp({
      components: { UserInfo, ProductList },
      data() {
        return { userInfo, productList };
      },
      template: `
        <div>
          <UserInfo :user="userInfo" />
          <ProductList :products="productList" />
        </div>
      `,
    });

    // 使用 renderToStream 渲染为流
    const stream = await renderToStream(vueApp);

    // 设置响应头，启用流式传输
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Transfer-Encoding', 'chunked');

    // 将流传输到客户端
    stream.pipe(res);
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

// 启动服务器
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
