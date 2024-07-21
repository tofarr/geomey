import { SpatialConsumer, SpatialIndex } from ".";
import { Rectangle } from "../geom/Rectangle";
import { Tolerance } from "../Tolerance";


export interface ZOrderIndexEntry<T> {
    rectangle: Rectangle
    minZ: number
    maxZ: number
    value: T
}


export class ZOrderIndex<T> implements SpatialIndex<T> {
    readonly tolerance: Tolerance
    private entries: ZOrderIndexEntry<T>[]
    private sorted: boolean

    constructor(tolerance: Tolerance) {
        this.tolerance = tolerance
        this.entries = []
    }
    add(rectangle: Rectangle, value: T){
        this.entries.push({
            rectangle: rectangle,
            minZ: calculateZOrder(rectangle.minX, rectangle.minY, this.tolerance.tolerance),
            maxZ: calculateZOrder(rectangle.maxX, rectangle.maxY, this.tolerance.tolerance),
            value
        })
        this.sorted = false
    }
    remove(rectangle: Rectangle, matcher: (value: T) => boolean): boolean {
        const { entries } = this
        const { tolerance: t } = this.tolerance
        const { length } = entries
        const minZ = calculateZOrder(rectangle.minX, rectangle.minY, t)
        const maxZ = calculateZOrder(rectangle.maxX, rectangle.maxY, t)
        let index = firstIndexOf(minZ, entries)
        while (index < length) {
            const entry = entries[index]
            if (entry.minZ > maxZ) {
                return false
            }
            if (entry.maxZ >= minZ){
                if(entry.minZ == minZ && matcher(entry.value)){
                    entries.splice(index, 1)
                    return true
                }
            }
            index++
        }
    }
    findIntersecting(rectangle: Rectangle, consumer: SpatialConsumer<T>){
        const { entries, sorted, tolerance } = this
        const { tolerance: t } = tolerance
        const { length } = entries
        if(!sorted){
            this.sort()
        }
        const minZ = calculateZOrder(rectangle.minX, rectangle.minY, t)
        const maxZ = calculateZOrder(rectangle.maxX, rectangle.maxY, t)
        let index = firstIndexOf(minZ, entries)
        while (index < length) {
            const entry = entries[index++]
            if (entry.minZ > maxZ) {
                return
            }
            if (entry.maxZ < minZ){
                continue
            }
            if(consumer(entry.value, entry.rectangle) === false){
                return
            }
        }
    }
    findAll(consumer: SpatialConsumer<T>) {
        for(const entry of this.entries) {
            if(consumer(entry.value, entry.rectangle) === false){
                return
            }
        }
    }
    sort(){
        this.entries.sort((a, b) => a.minZ - b.minZ)
    }
}

/** 
 * Find the first index of an item matching the z value given in the sorted entry array given
 */
export function firstIndexOf(z: number, entries: ZOrderIndexEntry<any>[]){
    let min = 0
    let max = entries.length - 1
    while (min < max) {
        const pivot = (min + max) >> 1
        const entry = entries[pivot]
        if (entry.minZ > z) {
            max = pivot
        } else {
            min = pivot
        }
    }
    return min
}

export function calculateZOrder(x: number, y: number, tolerance: number){
    x = Math.round(x / tolerance)
    y = Math.round(y / tolerance)
    let result = 0
    let shift = 0
    while(x || y) {
        result |= ((x & 1) | ((y & 1) << 1)) << shift
        shift += 2
        x >> 1
        y >> 1
    }
    return result
}
