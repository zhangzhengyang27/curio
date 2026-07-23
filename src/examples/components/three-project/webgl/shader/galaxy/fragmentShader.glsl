// 片元着色器：
// - 使用 gl_PointCoord 构建圆形点并做径向衰减
// - 与从顶点传入的颜色混合，得到带有发光边缘的粒子
varying vec2 vUv;
varying vec3 vColor;
void main(){
    // 点的像素坐标,二维，设置颜色
    // gl_FragColor = vec4(gl_PointCoord,0.0,1.0);

    // 设置圆形点
    // float strength = 1.0-distance(gl_PointCoord,vec2(0.5));
    // strength = step(0.5,strength);
    // gl_FragColor = vec4(strength,strength,strength,strength);


    // 设置渐变圆
    // float strength = distance(gl_PointCoord,vec2(0.5));
    // strength *= 2.0;
    // strength = 1.0-strength;
    // strength = pow(strength,1.5);
    // gl_FragColor = vec4(strength,strength,strength,strength);



    // 将顶点颜色混入进来
    // strength：距点心越近越亮（径向衰减），pow 控制边缘柔和程度
    float strength = distance(gl_PointCoord,vec2(0.5));
    strength *= 2.0;
    strength = 1.0-strength;
    strength = pow(strength,1.5);

    // 将强度混合进颜色：中心颜色接近 vColor，边缘逐渐衰减至黑
    vec3 mixColor = mix(vec3(0.0),vColor,strength);
    gl_FragColor = vec4(mixColor,strength);
    

}