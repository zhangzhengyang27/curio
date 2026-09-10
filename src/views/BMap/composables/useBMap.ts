const scriptCache = new Map<string, Promise<void>>();
const styleCache = new Map<string, Promise<void>>();

export const loadScript = (src: string): Promise<void> => {
  const cached = scriptCache.get(src);
  if (cached) {
    return cached;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`脚本加载失败：${src}`)), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    });
    script.addEventListener("error", () => reject(new Error(`脚本加载失败：${src}`)));
    document.body.appendChild(script);
  });

  scriptCache.set(src, promise);
  return promise;
};

export const loadStyle = (href: string): Promise<void> => {
  const cached = styleCache.get(href);
  if (cached) {
    return cached;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLLinkElement>(`link[href="${href}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`样式加载失败：${href}`)), {
        once: true,
      });
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.addEventListener("load", () => {
      link.dataset.loaded = "true";
      resolve();
    });
    link.addEventListener("error", () => reject(new Error(`样式加载失败：${href}`)));
    document.head.appendChild(link);
  });

  styleCache.set(href, promise);
  return promise;
};

/**
 * 百度地图 GL SDK 的引入地址。
 * AK 通过构建期环境变量 VITE_BMAP_AK 注入（见 .env.example），不写入仓库。
 * @returns 未配置 AK 时返回 null。
 */
export const getBMapScriptSrc = (): string | null => {
  const ak = import.meta.env.VITE_BMAP_AK;
  if (!ak) {
    return null;
  }
  return `https://api.map.baidu.com/api?type=webgl&v=1.0&ak=${encodeURIComponent(ak)}`;
};

/**
 * 确保百度地图 GL SDK 可用：按需动态加载脚本，已加载则直接返回。
 * 未配置 AK 时抛出可读错误，由调用方展示降级提示（而不是整页白屏）。
 */
export const ensureBMapSDK = async (timeout = 8000): Promise<void> => {
  if (window.BMapGL) {
    return;
  }
  const src = getBMapScriptSrc();
  if (!src) {
    throw new Error("未配置百度地图 AK：请在 .env.local 中设置 VITE_BMAP_AK 后重启开发服务器");
  }
  await loadScript(src);
  await waitForBMapGL(timeout);
};

export const waitForBMapGL = (timeout = 6000): Promise<void> =>
  new Promise((resolve, reject) => {
    if (window.BMapGL) {
      resolve();
      return;
    }

    const intervalMs = 200;
    let elapsed = 0;
    const timer = window.setInterval(() => {
      elapsed += intervalMs;
      if (window.BMapGL) {
        window.clearInterval(timer);
        resolve();
        return;
      }
      if (elapsed >= timeout) {
        window.clearInterval(timer);
        reject(new Error("百度地图脚本未加载，请检查 AK 或网络"));
      }
    }, intervalMs);
  });
