import './dataview_extra'
import { NumberType, ClassMateCache, NumberSizeMap, TypeCategory, ObjectMate, TypeEnum, ArrayMate, StringMate } from './core'

function GetNumberFiexdSize(mate: NumberType) {
    const pack = NumberSizeMap[mate]
    return pack.size
}
function GetStringFiexdSize(mate: StringMate) {
    return mate.length + 8
}

function GetObjectFiexdSize(mate: ObjectMate): number {
    let total = 0
    for (let i = 0; i < mate.length; i++) {
        const m = mate[i]
        total += GetCategoryFiexdSize(m.category, m.type)
    }
    return total
}
/**
 * 获取数组类固定长度
 * @param mate 
 * @returns 
 */
function GetArrayFiexdSize(mate: ArrayMate): number {
    // 初始8大小用于记录数组的已用长度和总容量信息
    let total = 8
    let itemSize = GetCategoryFiexdSize(mate.category, mate.itemType)
    total += itemSize * mate.capacity
    return total

}
function GetCategoryFiexdSize(category: TypeCategory, typ: (ObjectMate | ArrayMate | NumberType | StringMate)) {
    let itemSize = 0
    switch (category) {
        case TypeCategory.OBJECT:
            itemSize = GetObjectFiexdSize(typ as ObjectMate)
            break
        case TypeCategory.ARRAY:
            itemSize = GetArrayFiexdSize(typ as ArrayMate)
            break
        case TypeCategory.NUMBER:
            itemSize = GetNumberFiexdSize(typ as NumberType)
            break
        case TypeCategory.STRING:
            itemSize = GetStringFiexdSize(typ as StringMate)
            break
    }
    return itemSize
}

export function assertString(param: unknown): asserts param is string {
    if (typeof param === 'string') {
        return
    }
    throw new Error('The attribute name of the exception')
}


function GenerateObjectMateCache(offset: number, mate: ObjectMate) {

    let totalOffset = 0
    const proxyCache = {
        offset: offset,
        fieldCahce: {}
    } as ClassMateCache
    for (let i = 0; i < mate.length; i++) {
        const fieldMate = mate[i]
        totalOffset += GetCategoryFiexdSize(fieldMate.category, fieldMate.type)
        proxyCache.fieldCahce[fieldMate.name] = {} as any
        proxyCache.fieldCahce[fieldMate.name].offset = offset + totalOffset
        proxyCache.fieldCahce[fieldMate.name].category = fieldMate.category
        proxyCache.fieldCahce[fieldMate.name].mate = fieldMate
        proxyCache.fieldCahce[fieldMate.name].length = (fieldMate as any).length
        switch (fieldMate.category) {
            case TypeCategory.NUMBER:
                const pack = NumberSizeMap[fieldMate.type]
                proxyCache.fieldCahce[fieldMate.name].get = pack.get
                proxyCache.fieldCahce[fieldMate.name].set = pack.set
                break
            case TypeCategory.STRING:
                proxyCache.fieldCahce[fieldMate.name].get = DataView.prototype.getString
                proxyCache.fieldCahce[fieldMate.name].set = DataView.prototype.setString
                break
            case TypeCategory.OBJECT:
                proxyCache.fieldCahce[fieldMate.name].get = function (data: DataView) {
                    const proxyCache = GenerateObjectMateCache(offset, mate)
                    return ObjectProxy(data, proxyCache)
                }
                proxyCache.fieldCahce[fieldMate.name].set = function (data: DataView, value: any) {
                    const target = this as any
                    Object.keys(value).forEach(key => {
                        target[key] = value[key]
                    })
                }
                break
        }

    }
    return proxyCache
}

function ObjectCacheItem(offset: number, category: TypeCategory, mate: ObjectMate) {
    return {
        offset, category,
        get: function (data: DataView) {
            const proxyCache = GenerateObjectMateCache.call(this, offset, mate)
            return ObjectProxy(data, proxyCache)
        },
        set: function (data: DataView, value: any) {
            const target = this as any
            Object.keys(value).forEach(key => {
                target[key] = value[key]
            })
        }
    }
}

function GenerateArrayMateCache(offset: number, mate: ArrayMate) {
    let totalOffset = 0
    const proxyCache = {
        offset: offset,
        fieldCahce: {}
    } as ClassMateCache
}

function ArrayCacheItem(offset: number, category: TypeCategory, mate: ArrayMate) {
    return {
        offset, category,
        get: function (data: DataView) {

        }
    }
}

/**
 * 数值型装饰器
 * @param typ 
 * @param cache 
 * @returns 
 */
export function NumberWrapper(typ: NumberType, cache: ClassMateCache) {
    const category = TypeCategory.NUMBER
    const { offset, fieldCahce } = cache
    const { size, get, set } = NumberSizeMap[typ]
    cache.offset = offset + size
    return (_: any, name: any) => {
        assertString(name)
        fieldCahce[name] = {
            offset, category,
            get: function (data: DataView) {
                return get.call(data, this.offset)
            },
            set: function (data: DataView, value: number) {
                return set.call(data, this.offset, value)
            },
        }
    }
}


export function StringWrapper(size: number, cache: ClassMateCache) {
    const category = TypeCategory.STRING
    const { offset, fieldCahce } = cache
    cache.offset = offset + size
    return (_: any, name: any) => {
        assertString(name)
        fieldCahce[name] = {
            offset, category, length: size,
            get: function (data: DataView) {
                return data.getString(this.offset)
            },
            set: function (data: DataView, value: string) {
                data.setString(offset, value, this.length as number)
            }
        }
    }
}

export function ObjectWrapper(mate: ObjectMate, cache: ClassMateCache) {
    const category = TypeCategory.OBJECT
    const { offset, fieldCahce } = cache
    const propertySize = GetObjectFiexdSize(mate)
    cache.offset = offset + propertySize
    return (_: unknown, name: string) => {
        assertString(name)
        fieldCahce[name] = ObjectCacheItem(offset, category, mate)
    }
}

export function ArrayWrapper(mate: ArrayMate, cache: ClassMateCache) {
    const category = TypeCategory.ARRAY
    const { offset, fieldCahce } = cache
    const propertySize = GetArrayFiexdSize(mate)
    cache.offset = offset + 8 + propertySize
    return (_: unknown, name: string) => {
        assertString(name)
        fieldCahce[name] = {
            offset, category,
            get: function (data: DataView) {
                return ArrayProxy(data, offset, mate)
            },
            set: function (data: DataView, value: any) {
                if (!Array.isArray(value)) {
                    return
                }
                if (value.length > mate.capacity) {
                    throw new Error('Beyond the boundary')
                }
                this.length = value.length
                for (let i = 0; i < value.length; i++) {
                    const item = value[i]
                    // @ts-ignore
                    switch (mate.category) {
                        case TypeCategory.NUMBER:
                        case TypeCategory.STRING:
                            // @ts-ignore
                            this[i] = item
                            break
                        case TypeCategory.OBJECT:
                            Object.keys(item).forEach(key => {
                                // @ts-ignore
                                this[i][key] = item[key]
                            })
                            break
                        case TypeCategory.ARRAY:
                            // @ts-ignore
                            this[i].length = item.length
                            // @ts-ignore
                            this[i] = item
                            break
                    }
                }
            }
        }
    }
}

function ObjectProxy(data: DataView, cache: ClassMateCache, initInstance: Record<string, any> = {}) {

    initInstance.__mate__ = {} as any
    initInstance.__cache__ = cache


    const proxy = new Proxy(initInstance, {
        get(target, name) {
            assertString(name)
            if (name === '__mate__') {
                return target.__mate__
            }
            const __name__ = `__${name}__`
            const fieldCache = cache.fieldCahce[name]
            if (!fieldCache) {
                return undefined
            }
            if (fieldCache.category == TypeCategory.NUMBER) {
                return fieldCache.get.call(data, fieldCache.offset)
            }
            if (fieldCache.category == TypeCategory.STRING) {
                if (!fieldCache.mate) {
                    return undefined
                }
                const length = (fieldCache.mate as any).length as number
                return fieldCache.get.call(data, length)
            }
            if (fieldCache.category == TypeCategory.OBJECT) {
                if (target[__name__]) {
                    return target[__name__]
                }
                if (fieldCache.mate && fieldCache.mate.category == TypeCategory.OBJECT) {
                    const proxyCache = GenerateObjectMateCache(fieldCache.offset, fieldCache.mate.type)
                    const proxy = ObjectProxy(data, proxyCache)
                    target[__name__] = proxy
                    return target[__name__]
                }
                return undefined
            }
        },
        set(target, name, value) {
            assertString(name)
            const __name__ = `__${name}__`
            if (name === '__mate__') {
                target.__mate__ = value
                return true
            }
            const fieldCache = cache.fieldCahce[name]
            if (!fieldCache) {
                throw new Error('field not found')
            }

            switch (fieldCache.category) {
                case TypeCategory.NUMBER:
                case TypeCategory.STRING:
                    fieldCache.set.call(data, fieldCache.offset, value)
                    break
                case TypeCategory.OBJECT:
                    if (!target[__name__]) {
                        // @ts-ignore
                        this.get(target, name)
                    }
                    fieldCache.set.call(target[__name__], data, value)
                    break
            }

            return true
        }
    })
    return proxy
}

function ArrayProxy(data: DataView, offset: number, mate: ArrayMate, initInstance: Record<string, any> = {}) {
    // @ts-ignore
    initInstance.__mate__ = new Array(mate.capacity) as any
    const itemSize = GetCategoryFiexdSize(mate.capacity, mate.itemType)
    const proxy = new Proxy(initInstance, {
        get(target, name) {
            assertString(name)
            if (name === '__mate__') {
                return target.__mate__
            }
            const length = data.getUint32(offset)
            if (name == 'length') {
                return length
            }
            const idx = +name
            if (Number.isNaN(idx)) {
                // 不是索引
                return undefined
            }

            if (idx >= length) {
                return undefined
            }
            const offsetItem = offset + 8 + idx * itemSize
            // 基本类型，直接读取获取
            switch (mate.category) {
                case TypeCategory.NUMBER:
                    return NumberSizeMap[mate.itemType].get.call(data, offsetItem)
                case TypeCategory.STRING:
                    return data.getString(offsetItem)
            }
            // 引用类型，使用代理对象
            if (target[idx]) {
                return target[idx]
            }
            if (mate.category == TypeCategory.OBJECT) {
                const proxyCache = GenerateObjectMateCache(offsetItem, mate.itemType)
                const proxy = ObjectProxy(data, proxyCache)
                target[idx] = proxy
                return proxy
            }
            if (mate.capacity == TypeCategory.ARRAY) {
                const proxy = ArrayProxy(data, offsetItem, mate.itemType)
                target[idx] = proxy
                return proxy
            }
            return undefined
        },
        set(target, name, value) {
            assertString(name)
            if (name === '__mate__') {
                return target.__mate__
            }
            if (name === "length") {
                data.setUint32(offset, value)
                return true
            }
            const idx = +name
            if (Number.isNaN(idx)) {
                // 不是索引
                return false
            }
            const length = data.getUint32(offset)
            if (idx >= length) {
                throw new Error('The subscript is out of bounds')
            }
            const offsetItem = offset + 8 + idx * itemSize
            // 基本类型，直接读取获取
            switch (mate.category) {
                case TypeCategory.NUMBER:
                    return NumberSizeMap[mate.itemType].set.call(data, offsetItem, value)
                case TypeCategory.STRING:
                    return data.setString(offsetItem, value, mate.itemType.length)
            }
            if (!target[idx]) {
                // @ts-ignore
                this.get(target, name)
            }
            switch (mate.category) {
                case TypeCategory.OBJECT:
                    break
                case TypeCategory.ARRAY:
                    break
            }
            return true
        }
    })
    return proxy
}

export function CreateShareObject<T extends abstract new (...args: any) => any>(MateCache: ClassMateCache, data: DataView,
    clazz: T, ...args: any[]): InstanceType<T> {
    // @ts-expect-error
    const example = new clazz(...args)
    const proxy = new Proxy(example, {
        get(target: any, name) {
            assertString(name)
            const __name__ = `__${name}__`
            let __target__: any = target[__name__]
            if (target[__name__]) {
                return __target__
            }
            const mate = MateCache.fieldCahce[name]
            __target__ = mate.get.call(mate, data)
            switch (mate.category) {
                case TypeCategory.OBJECT:
                case TypeCategory.ARRAY:
                    target[__name__] = __target__
                    break
            }
            return __target__
        },
        set(target, name, value) {
            assertString(name)
            const __name__ = `__${name}__`
            const mate = MateCache.fieldCahce[name]
            switch (mate.category) {
                case TypeCategory.NUMBER:
                case TypeCategory.STRING:
                    mate.set.call(mate, data, value)
                    break
                case TypeCategory.OBJECT:
                case TypeCategory.ARRAY:
                    if (!target[__name__]) {
                        // @ts-ignore
                        this.get(target, name)
                    }
                    mate.set.call(target[__name__], data, value)
                    break

            }
            return true
        }
    })
    return proxy
}