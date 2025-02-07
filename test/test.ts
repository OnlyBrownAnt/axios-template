import axios, { abortControllerManager, CustomConfig } from '../src/request.js';

async function testCancel1(id: number) {
  const controller = abortControllerManager.add();
  // 测试 Axios 请求
  const config: CustomConfig = { privateOption: { retry: true, abortControllerKey: controller?.key}, method: "post", url: '/api401', data: { input: id } };
  axios(config)
    .then((response) => {
      console.log("Final response:", response.data);
    })
    .catch((error) => {
      console.error("Final error:", error.message);
    });

  setTimeout(() => {
    controller?.abort();
  }, 1000)

}

async function testCancel2(id: number) {
  const controller = abortControllerManager.add();
  // 测试 Axios 请求
  const config: CustomConfig = { privateOption: { retry: true, abortControllerKey: controller?.key }, method: "post", url: '/api401', data: { input: id } };
  axios(config)
    .then((response) => {
      console.log("Final response:", response.data);
    })
    .catch((error) => {
      console.error("Final error:", error.message);
    });
}

testCancel1(1001);
testCancel2(1002);

export default {};
