import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import AbortControllerManager from "./AbortControllerManger.js";

/**
 * 请求私有参数
 * 存放拦截中间流程需要的参数或者状态
 */
interface PrivateOption {
  retry?: boolean,
  retryCount?: number,
  abortControllerKey?: string
}

/**
 * 取消请求相关参数
 */
interface AbortOptions {
  signal?: any
}

/**
 * Axios 自定义 Config 配置
 */
export interface CustomConfig extends AxiosRequestConfig {
  privateOption: PrivateOption
}

type RequestHandlerOption = InternalAxiosRequestConfig & { privateOption?: PrivateOption } & AbortOptions

type ResponseHandlerOption = AxiosResponse & { config: RequestHandlerOption };

type processHandler<T> = (handlerOption: T) => Promise<T>;

const instance = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 30000,
  headers: { 'X-Custom-Header': 'foobar' }
});

/**
 * 请求拦截器
 */
instance.interceptors.request.use(async function (config) {
  // Do something before request is sent
  console.log('interceptors request');

  const handlers = [initPrivateOption, addAbortController];
  config = await processHandlers<RequestHandlerOption>(config, handlers);
  return config;
},
  async function (error) {
    // Do something with request error
    return Promise.reject(error);
  });

instance.interceptors.response.use(
  async (response) => {
    console.log('interceptors response');

    const handlers = [deleteAbortController];
    response = await processHandlers<ResponseHandlerOption>(response, handlers);
    return response;
  },
  async (error) => {
    try {
      let handleRes: any = error;
      handleRes = await handleLoginError(error);
      handleRes = await retryRequest(error);
      return handleRes;
    } catch (handleError) {
      // Do something with request error
      return Promise.reject(handleError);
    }
  }
);

/**
 * 请求/响应拦截阶段中间任务执行
 * 
 * 使用 Promise 链 + 方法链，
 * 上一个任务的返回是下一个任务结果。
 */

const processHandlers = async <T>(
  handlerOption: T,
  handlers: Array<processHandler<T>>
) => {
  try {
    for (const handler of handlers) {
      handlerOption = await handler(handlerOption);
    }
    return handlerOption;
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * 重试请求
 *
 * 重试请求默认开启
 *
 * 最大重试次数 maxRetryCount 默认等于 3
 * 
 * 不执行的判断逻辑
 * 1. 取消的网络请求
 * 2. 重试标志 retry 等于 false
* 3. 超过最大重试次数
 * 
 */
const retryRequest = async (error: any) => {
  const config = error.config;
  const privateOption = config.privateOption ? config.privateOption : {};
  const maxRetryCount = 3;
  privateOption.retryCount = privateOption.retryCount || 0;

  if (error.code == "ERR_CANCELED" ||
    privateOption.retry == false ||
    privateOption.retryCount == maxRetryCount) {
    return Promise.reject(error);
  } else {
    privateOption.retryCount += 1;
    config.privateOption = privateOption;
    return instance(config);
  }
}

/**
 * 初始化私有参数
 */
const initPrivateOption = async (config: RequestHandlerOption) => {
  if (!config['privateOption']) config.privateOption = {};
  return config;
}

// 取消控制器管理
export const abortControllerManager = new AbortControllerManager();

/**
 * 新增 AbortController
 */
const addAbortController = async (config: RequestHandlerOption) => {
  if (config?.privateOption?.abortControllerKey) {
    const value = abortControllerManager.add(config.privateOption.abortControllerKey);
    config.signal = value?.signal;
  }
  return config;
}

/**
 * 删除 AbortController
 */
const deleteAbortController = async (response: ResponseHandlerOption) => {
  if (response.config?.privateOption?.abortControllerKey) {
    abortControllerManager.delete(response.config.privateOption.abortControllerKey);
  }
  return response;
}

/**
 * 登录状态处理
 *
 * 登录失效根据 http 状态码 401 Unauthorized（未授权）进行判断。
 *
 * 只处理 3s 内的接口的登录失效。3s 后的登录失效会进行重新处理
 */
let isHandlingLoginError = false;
let loginErrorTimer: any = null;
const handleLoginError = async (error: any) => {
  if (error.status == 401) {
    if (!isHandlingLoginError) {
      isHandlingLoginError = true;

      console.log("retry login");

      if (loginErrorTimer) {
        clearTimeout(loginErrorTimer)
      }

      loginErrorTimer = setTimeout(() => {
        isHandlingLoginError = false;
        loginErrorTimer = null;
      }, 3000)
    }
  }
}

export default instance;
