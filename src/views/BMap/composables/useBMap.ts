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

/** 是否配置了百度地图 AK（由构建期环境变量 VITE_BMAP_AK 决定）。 */
export const isBMapConfigured = (): boolean => Boolean(import.meta.env.VITE_BMAP_AK);

/**
 * 确保百度地图 GL SDK 可用。
 *
 * 注意：SDK 本身由 index.html 在**文档解析期**按 %VITE_BMAP_AK% 同步注入，
 * 这里只负责「等待 window.BMapGL 就绪」。不能用 loadScript() 动态 append 的方式加载，
 * 因为百度加载器内部依赖 document.write，运行时注入不会生效（详见 index.html 注释）。
 *
 * @throws 未配置 AK 时抛出可读错误，由调用方展示降级提示（而不是整页白屏）
 */
export const ensureBMapSDK = async (timeout = 8000): Promise<void> => {
  if (window.BMapGL) {
    return;
  }
  if (!isBMapConfigured()) {
    throw new Error("未配置百度地图 AK：请在 .env.local 中设置 VITE_BMAP_AK 后重启开发服务器");
  }
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
