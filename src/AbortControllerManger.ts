import { v4 as uuidv4 } from 'uuid';

/**
 * 取消控制管理器
 *
 * 通过 Map 缓存管理所有请求的 AbortController。
 *
 * 支持新增、删除 AbortController
 * 支持执行单个 AbortController 的 abort 逻辑
 * 支持以路由地址基础执行所有相关的 AbortController 的 abort 逻辑。
 */

type Controller = AbortController & { key: string }

class AbortControllerManager {
  public abortControllerMap: Map<string, Controller>;

  constructor() {
    this.abortControllerMap = new Map();
  }

  static generateAbortControllerKey = (route?: string) => {
    return `${route}-${uuidv4()}`;
  }

  add(key?: string) {
    if (key && this.abortControllerMap.has(key)) return this.abortControllerMap.get(key);

    const controller = new AbortController()
    const value = {
      key: key ? key : AbortControllerManager.generateAbortControllerKey(),
      signal: controller.signal,
      abort: () => controller.abort()
    }
    this.abortControllerMap.set(value.key, value);

    this.print('add')
    return value;
  }

  delete(key: string) {
    if (this.abortControllerMap.has(key)) this.abortControllerMap.delete(key);
    this.print('delete')
    return key;
  }

  cancel(key: string) {
    if (this.abortControllerMap.has(key)) this.abortControllerMap.get(key)?.abort();
    this.print('cancel');
  }

  cancelByRoute(route = '') {
    for (let key of this.abortControllerMap.keys()) {
      const pattern = new RegExp(`${route}-`, '');
      console.log(pattern.test(key))
      if (pattern.test(key)) {
        this.abortControllerMap.get(key)?.abort()
        this.abortControllerMap.delete(key);
      }
    }
    this.print('cancelByRoute');

    return []
  }
  print(operate: string) {
    // console.log(operate, this.abortControllerMap);
  }
}

export default AbortControllerManager;
