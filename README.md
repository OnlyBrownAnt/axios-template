# axios-template

这是一个使用 TypeScript 和 Axios 的示例项目，演示如何进行 HTTP 请求。

## 封装思路

1. 利用 Axiox 的拦截器，在请求和响应拦截阶段插入自定义拦截能力。
2. 需要设置默认的拦截能力，支持自定义拦截能力进行覆盖。
3. 自定义拦截能力在定义单个网络请求时进行设置。

## 已实现功能

1. 请求重试
2. 批量取消请求
3. 基于 Promise 链在拦截中间过程自定义处理
4. 集成 TypeScript
