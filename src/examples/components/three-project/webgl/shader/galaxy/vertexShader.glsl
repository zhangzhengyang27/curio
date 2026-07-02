// 顶点着色器：
// - 接收粒子顶点位置与颜色
// - 基于顶点到中心距离添加旋转偏移，形成银河“扭转”效果
// - 设置 gl_PointSize 随距离缩放，从而在屏幕空间得到正确的点大小
// - 将顶点颜色传递给片元着色器用于最终混色
attribute float aScale;
varying vec2 vUv;
uniform float uTime;
// 获取顶点颜色传递给片元着色器
varying vec3 vColor;

void main(){
    // 将局部坐标转换到世界坐标
    vec4 modelPosition = modelMatrix * vec4( position, 1.0 );

    // 设置顶点旋转
    // 获取顶点的角度
    float angle = atan(modelPosition.x,modelPosition.z);
    // 获取顶点到中心的距离
    float distanceToCenter = length(modelPosition.xz);
    // 设置根据顶点到中心的距离，设置不同的旋转度数
    float angleOffset = 1.0/distanceToCenter*uTime;

    // 根据旋转的偏移值，旋转当前的点
    angle+=angleOffset;
    modelPosition.x = cos(angle)*distanceToCenter;
    modelPosition.z = sin(angle)*distanceToCenter;

    // 变换到观察空间
    vec4 viewPosition = viewMatrix * modelPosition;

    // 最终裁剪空间坐标
    gl_Position =  projectionMatrix * viewPosition;

    // 设置顶点大小
    // aScale：每个粒子的随机缩放因子
    // -viewPosition.z：随距离做透视缩放，越远的点越小
    gl_PointSize = 80.0*aScale/ -viewPosition.z;
    vUv=uv;
    vColor = color;
}