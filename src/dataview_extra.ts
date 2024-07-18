// @ts-ignore
DataView.prototype.getString = function (byteOffset: number) {
    const useLength = this.getUint32(byteOffset)
    byteOffset += 8
    const buffer = this.buffer.slice(byteOffset, byteOffset + useLength)
    return Buffer.from(buffer).toString()
}
// @ts-ignore
DataView.prototype.setString = function (byteOffset: number, value: string, capacity: number) {
    const buffer = Buffer.from(value)
    if (buffer.length > capacity) {
        throw new Error('Memory overflow due to string writing')
    }
    const useLength = buffer.length
    this.setUint32(byteOffset, useLength)
    this.setUint32(byteOffset + 4, capacity)
    byteOffset += 8
    for (let i = 0; i < buffer.length; i++) {
        this.setUint8(byteOffset + i, buffer[i])
    }
} 