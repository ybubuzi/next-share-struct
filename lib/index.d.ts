

declare enum TypeEnum {
    OBJECT,
    ARRAY,
    STRING,
    INT8,
    UINT8,
    INT16,
    UINT16,
    INT32,
    UINT32,
    INT64,
    UINT64,
    FLOAT32,
    FLOAT64,
}
declare enum TypeCategory {
    NUMBER,
    OBJECT,
    ARRAY,
    STRING
}
declare interface FieldMate {
    offset: number,
    get: Function,
    set: Function,
    category: TypeCategory,
    mate?: ObjectMateContext,
    length?: number
}
declare type NumberType = TypeEnum.INT8 | TypeEnum.UINT8 | TypeEnum.INT16 | TypeEnum.UINT16 | TypeEnum.INT32 | TypeEnum.UINT32 | TypeEnum.INT64 | TypeEnum.UINT64 | TypeEnum.FLOAT32 | TypeEnum.FLOAT64
declare type ClassMateCache = {
    offset: number,
    fieldCahce: {
        [key: string]: FieldMate
    }
}

declare type StringMate = {
    type: TypeEnum.STRING,
    length: number
}
declare type ObjectMateContext = {
    name: string,
    category: TypeCategory.NUMBER,
    type: NumberType
} | {
    name: string,
    category: TypeCategory.STRING,
    type: StringMate
    length: number
} | {
    name: string,
    category: TypeCategory.ARRAY
    type: ArrayMate
} | {
    name: string,
    category: TypeCategory.OBJECT
    type: ObjectMate
}
// 复杂对象
declare type ObjectMate = Array<ObjectMateContext>

// 数组元对象
declare type ArrayMate = {
    capacity: number    // 数组的容量大小 
    category: TypeCategory.OBJECT
    itemType: ObjectMate
} | {
    capacity: number    // 数组的容量大小 
    category: TypeCategory.ARRAY
    itemType: ArrayMate
} | {
    capacity: number    // 数组的容量大小 
    category: TypeCategory.STRING
    itemType: StringMate
} | {
    capacity: number    // 数组的容量大小 
    category: TypeCategory.NUMBER
    itemType: NumberType
}
type DefaultWrapperReturnFn = (_: any, name: any) => void
// StringWrapper, NumberWrapper, ObjectWrapper, CreateShareObject, ArrayWrapper
declare function NumberWrapper(typ: NumberType, cache: ClassMateCache): DefaultWrapperReturnFn
declare function StringWrapper(size: number, cache: ClassMateCache): DefaultWrapperReturnFn
declare function ObjectWrapper(mate: ObjectMate, cache: ClassMateCache): DefaultWrapperReturnFn
declare function ArrayWrapper(mate: ArrayMate, cache: ClassMateCache): DefaultWrapperReturnFn
declare function CreateShareObject<T extends abstract new (...args: any) => any>(MateCache: ClassMateCache, data: DataView,
    clazz: T, ...args: any[]): InstanceType<T>;
export {
    TypeEnum, ClassMateCache, ObjectMate, TypeCategory, ArrayMate,
    NumberWrapper,StringWrapper,ObjectWrapper,ArrayWrapper,CreateShareObject
}