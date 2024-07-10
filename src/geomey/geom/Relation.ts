

type PrependNextNum<A extends Array<unknown>> = A['length'] extends infer T ? ((t: T, ...a: A) => void) extends ((...x: infer X) => void) ? X : never : never;
type EnumerateInternal<A extends Array<unknown>, N extends number> = { 0: A, 1: EnumerateInternal<PrependNextNum<A>, N> }[N extends A['length'] ? 0 : 1];
export type Enumerate<N extends number> = EnumerateInternal<[], N> extends (infer E)[] ? E : never;
export type Relation = Enumerate<32>;

export const A_OUTSIDE_B: Relation = 1
export const B_OUTSIDE_A: Relation = 2
export const TOUCH: Relation = 4
export const A_INSIDE_B: Relation = 8
export const B_INSIDE_A: Relation = 16

export const DISJOINT = (A_OUTSIDE_B | B_OUTSIDE_A) as Relation


export function flipAB(relation: Relation): Relation {
    let result = relation & TOUCH
    if(relation & A_OUTSIDE_B){
        result |= B_OUTSIDE_A
    }
    if (relation & A_INSIDE_B) {
        result |= B_INSIDE_A
    }
    if(relation & B_OUTSIDE_A){
        result |= A_OUTSIDE_B
    }
    if (relation & B_INSIDE_A) {
        result |= A_INSIDE_B
    }
    return result as Relation
}
