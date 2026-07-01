const defAttr = () => ({
  image: undefined,
  wrapS: undefined,
  wrapT: undefined,
  magFilter: undefined,
  minFilter: undefined,
  format: undefined,
})

export default class Texture{
  constructor(attr){
    Object.assign(this,defAttr(),attr)
    this.init()
  }
  init(){
    
  }
}