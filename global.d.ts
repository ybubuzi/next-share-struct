export { };
declare global {
    interface DataView {
        getString(byteOffset: number): string;
        setString(byteOffset: number, value: string, capacity: number): string;
    }
}