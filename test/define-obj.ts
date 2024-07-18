import { TypeEnum, ClassMateCache, ObjectMate, TypeCategory, ArrayMate } from '../src/core'
import { StringWrapper, NumberWrapper, ObjectWrapper, CreateShareObject, ArrayWrapper } from '../src/wrapper'

const MateCache: ClassMateCache = new Proxy({
    offset: 0,
    fieldCahce: {}
},{ })



const FieldInstanceDefine: ObjectMate = [
    {
        name: "data",
        category: TypeCategory.NUMBER,
        type: TypeEnum.UINT32
    }, {
        name: "child",
        category: TypeCategory.OBJECT,
        type: [{
            name: "id",
            category: TypeCategory.NUMBER,
            type: TypeEnum.UINT16
        }]
    }
]
const ArrDefine:ArrayMate = {
    capacity: 20,
    category: TypeCategory.OBJECT,
    itemType: FieldInstanceDefine
}

interface Voo {
    data: number,
    child: {
        id: number
    }
}

class Aoo {
    @NumberWrapper(TypeEnum.UINT32, MateCache)
    public speed: number = 0
    @StringWrapper(100,MateCache)
    public msg:string = ''
    @ObjectWrapper(FieldInstanceDefine, MateCache)
    public instace: Voo
    @ArrayWrapper(ArrDefine,MateCache)
    public arr:Voo[] = []
    constructor() {
        this.instace = {  } as any
    }
}
function CreateAoo(data: DataView){
    return CreateShareObject(MateCache, data, Aoo)
}
export default CreateAoo

