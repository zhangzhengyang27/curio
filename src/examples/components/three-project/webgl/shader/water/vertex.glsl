// 顶点着色器：基于正弦波与 2D Perlin 噪声生成的“水面烟雾”位移效果
//
// 输入/Uniforms：
// - uWaresFrequency: 波纹频率（控制 sin 波的疏密）
// - uScale: 位移缩放（控制波高/烟雾强度）
// - uNoiseFrequency: 噪声频率（控制噪声花纹尺度）
// - uNoiseScale: 噪声强度（影响位移贡献）
// - uXzScale: Z 轴方向的频率缩放（拉伸/压缩波纹）
// - uTime: 时间（用于动画）
// - uXspeed/uZspeed: XY 波动的时间速度
// - uNoiseSpeed: 噪声随时间的流动速度
//
// 输出/Varyings：
// - vElevation: 原始位移值（供片元着色器做颜色映射等）

precision lowp float;
uniform float uWaresFrequency;
uniform float uScale;
uniform float uNoiseFrequency;
uniform float uNoiseScale;
uniform float uXzScale;
uniform float uTime;
uniform float uXspeed;
uniform float uZspeed;
uniform float uNoiseSpeed;

// 计算出的高度传递给片元着色器
varying float vElevation;

// 经典 2D Perlin 噪声实现（Stefan Gustavson 版本精简移植）
// permute: 对输入向量做置换打散，生成更均匀的伪随机索引
// 作用：用于选择不同的梯度方向，避免重复与条纹伪影
vec4 permute(vec4 x){
    return mod(((x*34.0)+1.0)*x, 289.0);
}

// fade: 平滑插值曲线（S-curve），在 0 与 1 处导数为 0
// 作用：用于在网格单元内对噪声进行平滑过渡插值
vec2 fade(vec2 t){
    return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// cnoise: 2D Perlin 噪声
// 步骤：
// 1) 将坐标 P 拆分为整数格点 Pi 与小数偏移 Pf
// 2) 使用 permute 获取四个角点的梯度方向索引
// 3) 计算四个角点的梯度与偏移向量的点积（n00/n10/n01/n11）
// 4) 通过 fade 计算的权重在 x/y 方向做双线性平滑插值
// 返回：范围约 [-1,1] 的连续平滑噪声（此处缩放为 ~[-2.3,2.3]）
float cnoise(vec2 P){
    vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod(Pi, 289.0);
    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;
    vec2 g00 = vec2(gx.x,gy.x);
    vec2 g10 = vec2(gx.y,gy.y);
    vec2 g01 = vec2(gx.z,gy.z);
    vec2 g11 = vec2(gx.w,gy.w);
    vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;
    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));
    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
}

void main(){
    // 顶点世界空间位置
    vec4 modelPosition = modelMatrix * vec4(position,1.0);

    // 基础正弦波叠加（随时间推进）
    float elevation = sin(modelPosition.x*uWaresFrequency + uTime*uXspeed)
                    * sin(modelPosition.z*uWaresFrequency*uXzScale + uTime*uZspeed);

    // 叠加 Perlin 噪声（取绝对值形成“烟雾”隆起，再取负制造下陷）
    elevation += -abs(cnoise(vec2(modelPosition.xz * uNoiseFrequency + uTime * uNoiseSpeed))) * uNoiseScale;
    
    // 将未缩放的位移传递给片元着色器（用于着色）
    vElevation = elevation;
    
    // 位移缩放，控制最终几何体起伏幅度
    elevation *= uScale;

    // 应用位移到顶点 y 轴
    modelPosition.y += elevation;

    // 投影到裁剪空间
    gl_Position = projectionMatrix * viewMatrix * modelPosition;
}