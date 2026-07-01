const defAttr = () => ({
  image: null,
  wrapS: 'CLAMP_TO_EDGE',
  wrapT: 'CLAMP_TO_EDGE',
  magFilter: 'LINEAR',
  minFilter: 'LINEAR',
  format: 'RGBA',
})

export default class Texture{
  constructor(attr){
    Object.assign(this,defAttr(),attr)
    this.init()
  }
  init(){
    
  }
}