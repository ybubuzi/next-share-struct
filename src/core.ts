// 支持的序列化类型
export enum TypeEnum {
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

// Number 类型
export type NumberType = TypeEnum.INT8 | TypeEnum.UINT8 | TypeEnum.INT16 | TypeEnum.UINT16 | TypeEnum.INT32 | TypeEnum.UINT32 | TypeEnum.INT64 | TypeEnum.UINT64 | TypeEnum.FLOAT32 | TypeEnum.FLOAT64
// 类型分类
export enum TypeCategory {
    NUMBER,
    OBJECT,
    ARRAY,
    STRING
}
interface FieldMate {
    offset: number,
    get: Function,
    set: Function,
    category: TypeCategory,
    mate?: ObjectMateContext,
    length?: number
}
export type ClassMateCache = {
    offset: number,
    fieldCahce: {
        [key: string]: FieldMate
    }
}


// Number映射关系
export const NumberSizeMap = {
    [TypeEnum.INT8]: { size: 1, get: DataView.prototype.getInt8, set: DataView.prototype.setInt8 },
    [TypeEnum.UINT8]: { size: 1, get: DataView.prototype.getUint8, set: DataView.prototype.setUint8 },
    [TypeEnum.INT16]: { size: 2, get: DataView.prototype.getInt16, set: DataView.prototype.setInt16 },
    [TypeEnum.UINT16]: { size: 2, get: DataView.prototype.getUint16, set: DataView.prototype.setUint16 },
    [TypeEnum.INT32]: { size: 4, get: DataView.prototype.getInt32, set: DataView.prototype.setInt32 },
    [TypeEnum.UINT32]: { size: 4, get: DataView.prototype.getUint32, set: DataView.prototype.setInt32 },
    [TypeEnum.INT64]: { size: 8, get: DataView.prototype.getBigInt64, set: DataView.prototype.setBigInt64 },
    [TypeEnum.UINT64]: { size: 8, get: DataView.prototype.getBigUint64, set: DataView.prototype.setBigUint64 },
    [TypeEnum.FLOAT32]: { size: 4, get: DataView.prototype.getFloat32, set: DataView.prototype.setFloat32 },
    [TypeEnum.FLOAT64]: { size: 8, get: DataView.prototype.getFloat64, set: DataView.prototype.setFloat64 },
} as unknown as Record<NumberType, {
    size: 1 | 2 | 4 | 8,
    get: (byteOffset: number) => number,
    set: (byteOffset: number, value: number) => void
}>

export type StringMate = {
    type: TypeEnum.STRING,
    length: number
}
export type ObjectMateContext = {
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
export type ObjectMate = Array<ObjectMateContext>
 
// 数组元对象
export type ArrayMate = {
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