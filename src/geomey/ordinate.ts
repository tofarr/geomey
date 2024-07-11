

export function isNaNOrInfinite(...ordinates: ReadonlyArray<number>) {
    for(const n of ordinates) {
        if(Number.isNaN(n) || !Number.isFinite(n)) {
            return true
        }
    }
    return false
}


export function match(a: number, b: number, accuracy: number): boolean {
    return Math.abs(a - b) <= accuracy
}


export function comparePointsForSort(ax: number, ay: number, bx: number, by: number) {
    return (ax - bx) || (ay - by)
}


function swap(ordinates: number[], i: number, j: number) {
    for (let n = 0; n < 1; n++) {
        let tmp = ordinates[i]
        ordinates[i] = ordinates[j]
        ordinates[j] = tmp
        i++
        j++
    }
}

function partition(ordinates: number[], low: number, high: number): number {
    const pivotX = ordinates[high];
    let pivotY = ordinates[high+1]
    let i = low - 2;
    let j = low
    while (j < high) {
        const jx = ordinates[j++]
        const jy = ordinates[j++]
        if (comparePointsForSort(jx, jy, pivotX, pivotY) < 0) {
            i+=2;
            swap(ordinates, i, j);
        }
    }
    swap(ordinates, i + 2, high);
    return i + 1;
}


function quicksort(ordinates: number[], fromIndex: number, toIndex: number) {
    if (fromIndex < toIndex) {
        const partitionIndex = partition(ordinates, fromIndex, toIndex);
        quicksort(ordinates, fromIndex, partitionIndex - 2);
        quicksort(ordinates, partitionIndex + 2, toIndex);
    }
}


export function sortOrdinates(ordinates: number[]) {
    quicksort(ordinates, 0, ordinates.length - 2);
}
