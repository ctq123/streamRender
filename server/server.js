// server.js
import express from 'express';
import cors from 'cors';
import { createSSRApp } from 'vue';
import { renderToWebStream } from '@vue/server-renderer';
import { pipeline, Readable } from 'stream';

const app = express();

// 默认允许所有来源
app.use(cors());

// 模拟获取用户信息和产品列表的 API
const fetchUserInfo = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ name: 'John Doe', age: 30 });
    }, 1000);
  });
};

const fetchProductList = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, name: 'Product 1', price: 100 },
        { id: 2, name: 'Product 2', price: 200 },
      ]);
    }, 3000);
  });
};

// 创建一个 Vue 组件：用户信息模块
const UserInfo = {
  props: ['user'],
  template: `
    <div class="user-info">
      <h2>User Info</h2>
      <p>Name: {{ user?.name }}</p>
      <p>Age: {{ user?.age }}</p>
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
    // console.time('Request fetched')
    // 获取用户信息和产品列表
    // const [userInfo, productList] = await Promise.all([fetchUserInfo(), fetchProductList()]);
    // console.timeEnd('Request fetched')

    // 创建 Vue 应用
    const vueApp = createSSRApp({
      components: { UserInfo, ProductList },
      data() {
        return { userInfo: null, productList: [] };
      },
      template: `
        <div>
          <UserInfo :user="userInfo" />
          <ProductList :products="productList" />
        </div>
      `,
    });

    // 设置响应头，启用流式传输
    res.setHeader('Content-Type', 'text/html;charset=utf-8');
    // res.setHeader('Transfer-Encoding', 'chunked');

    console.log("vueApp", vueApp)
    console.log("vueApp._component", vueApp._component)

     // 使用 renderToWebStream 渲染为流
     const stream = new Readable({
      async read() {
        const reader = renderToWebStream(vueApp).getReader()
        const { done, value } = await reader.read()
        if (!done) {
          console.log('value', value)
          this.push(value) // 开始流
        }
        
        fetchUserInfo().then(async (data) => {
          if (vueApp._component && vueApp._component.data) {
            vueApp._component.data.UserInfo = data;
            const reader2 = renderToWebStream(vueApp).getReader()
            const { done, value: v2 } = await reader2.read()
            if (!done) {
              this.push(v2)
            }
          }
        })

        fetchProductList().then(async (data) => {
          if (vueApp._component && vueApp._component.data) {
            vueApp._component.data.productList = data;
            const reader3 = renderToWebStream(vueApp).getReader()
            const { done, value: v3 } = await reader3.read()
            if (!done) {
              this.push(v3)
            }
            this.push(null)// 结束流
          }
        })
      }
    });

    
    // fetchUserInfo().then((data) => {
    //   if (vueApp._component && vueApp._component.data) {
    //     vueApp._component.data().UserInfo = data;
    //     stream.pipeTo(res.writable).catch(e => {
    //       console.error(e)
    //       res.status(500).send('Server Error');
    //     })
    //   }
    // })

    // fetchProductList().then((data) => {
    //   if (vueApp._component && vueApp._component.data) {
    //     vueApp._component.data().productList = data;
    //     stream.pipeTo(res.writable).catch(e => {
    //       console.error(e)
    //       res.status(500).send('Server Error');
    //     })
    //   }
    // })


    // stream.pipeTo(res.writable).catch(e => {
    //   console.error(e)
    //   res.status(500).send('Server Error');
    // })

    pipeline(stream, res, (e) => {
      if (e) {
        console.error(e)
        res.status(500).send('Server Error');
      }
    })

    // 将流传输到客户端
    // stream.pipe(res);
  } catch (error) {
    console.error('error', error)
    res.status(500).send('Server Error');
  }
});

// 启动服务器
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
