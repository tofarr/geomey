import { Geom2D } from "./";

// import * as mocha from 'mocha';
import * as chai from "chai";

const expect = chai.expect;
describe("Geomey", () => {
  it("rule 1 empty params should convert", () => {
    const g: Geom2D = { type: "foo", bounds: [1, 2, 3, 4]}
    expect(g.bounds[0]).to.equal(1);
  });

  /*
  it("rule 2 strings should convert", () => {
    let queryStr = "a~s=b";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { a: "b" };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("a=b").to.equal(queryStr);
  });

  it("rule 2 floats should convert", () => {
    let queryStr = "a~f=1";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { a: 1 };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("a=1").to.equal(queryStr);
  });

  it("rule 2 invalid floats should fail", () => {
    const queryStr = "a~f=a";
    expect(() => queryStrToJsonObj(queryStr)).to.throw();
  });

  it("rule 2 ints should convert", () => {
    let queryStr = "a~i=1";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { a: 1 };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("a=1").to.equal(queryStr);
  });

  it("rule 2 invalid ints should fail", () => {
    const queryStr = "a~i=a";
    expect(() => queryStrToJsonObj(queryStr)).to.throw();
  });

  it("rule 2 bools should convert", () => {
    let queryStr = "a~b=1";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { a: true };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("a=true").to.equal(queryStr);
  });

  it("rule 2 nulls should convert", () => {
    let queryStr = "a~n=";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { a: null };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("a=null").to.equal(queryStr);
    expect(() => queryStrToJsonObj("a~n=none")).to.throw();
  });

  it("rule 2 arrays should convert", () => {
    let queryStr = "a~a=";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { a: [] };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("a~a=").to.equal(queryStr);
    expect(() => queryStrToJsonObj("a~a=1")).to.throw();
  });

  it("rule 2 objs should convert", () => {
    let queryStr = "a~o=";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { a: {} };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("a~o=").to.equal(queryStr);
    expect(() => queryStrToJsonObj("a~o=1")).to.throw();
  });

  it("rule 2 int unknown should fail", () => {
    expect(() => queryStrToJsonObj("a~x=a")).to.throw();
  });

  it("rule 3 should convert", () => {
    let queryStr = "a~b=1";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { a: true };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("a=true").to.equal(queryStr);
    expect(JSON.stringify(expectedJsonObj)).to.equal(
      JSON.stringify(queryStrToJsonObj(queryStr)),
    );
    expect(() => queryStrToJsonObj("a~b=2")).to.throw();
  });

  it("rule 4 should convert", () => {
    let queryStr = "a~b=0";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { a: false };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("a=false").to.equal(queryStr);
    expect(JSON.stringify(expectedJsonObj)).to.equal(
      JSON.stringify(queryStrToJsonObj(queryStr)),
    );
    expect(() => queryStrToJsonObj("a~b=flase")).to.throw();
  });

  it("string boolean true should convert", () => {
    let queryStr = "a~s=true";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { a: "true" };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("a~s=true").to.equal(queryStr);
  });

  it("string boolean false should convert", () => {
    let queryStr = "a~s=false";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { a: "false" };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("a~s=false").to.equal(queryStr);
  });

  it("rule 5 should convert", () => {
    let queryStr = "a~n=";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { a: null };
    expect(JSON.stringify(expectedJsonObj)).to.equal(
      JSON.stringify(queryStrToJsonObj(queryStr)),
    );
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("a=null").to.equal(queryStr);
    expect(() => queryStrToJsonObj("a~b=None")).to.throw();
  });

  it("string null should convert", () => {
    let queryStr = "a~s=null";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { a: "null" };
    expect(JSON.stringify(expectedJsonObj)).to.equal(
      JSON.stringify(queryStrToJsonObj(queryStr)),
    );
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("a~s=null").to.equal(queryStr);
  });

  it("rule 7 infer null should convert", () => {
    let queryStr = "a=null";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { a: null };
    expect(JSON.stringify(expectedJsonObj)).to.equal(
      JSON.stringify(queryStrToJsonObj(queryStr)),
    );
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("a=null").to.equal(queryStr);
  });

  it("rule 7 infer true should convert", () => {
    let queryStr = "a=true";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { a: true };
    expect(JSON.stringify(expectedJsonObj)).to.equal(
      JSON.stringify(queryStrToJsonObj(queryStr)),
    );
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("a=true").to.equal(queryStr);
  });

  it("rule 7 infer false should convert", () => {
    let queryStr = "a=false";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { a: false };
    expect(JSON.stringify(expectedJsonObj)).to.equal(
      JSON.stringify(queryStrToJsonObj(queryStr)),
    );
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("a=false").to.equal(queryStr);
  });

  it("rule 7 infer int should convert", () => {
    let queryStr = "a=101";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { a: 101 };
    expect(JSON.stringify(expectedJsonObj)).to.equal(
      JSON.stringify(queryStrToJsonObj(queryStr)),
    );
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("a=101").to.equal(queryStr);
  });

  it("rule 7 infer float should convert", () => {
    let queryStr = "a=1.23";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { a: 1.23 };
    expect(JSON.stringify(expectedJsonObj)).to.equal(
      JSON.stringify(queryStrToJsonObj(queryStr)),
    );
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("a=1.23").to.equal(queryStr);
  });

  it("string int should convert", () => {
    let queryStr = "a~s=1";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { a: "1" };
    expect(JSON.stringify(expectedJsonObj)).to.equal(
      JSON.stringify(queryStrToJsonObj(queryStr)),
    );
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("a~s=1").to.equal(queryStr);
  });

  it("string float should convert", () => {
    let queryStr = "a~s=1.0";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { a: "1.0" };
    expect(JSON.stringify(expectedJsonObj)).to.equal(
      JSON.stringify(queryStrToJsonObj(queryStr)),
    );
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("a~s=1.0").to.equal(queryStr);
  });

  it("string should convert", () => {
    let queryStr = "foo~s=bar";
    let jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { foo: "bar" };
    expect(JSON.stringify(expectedJsonObj)).to.equal(
      JSON.stringify(queryStrToJsonObj(queryStr)),
    );
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("foo=bar").to.equal(queryStr);
    jsonObj = queryStrToJsonObj(queryStr);
    expect(JSON.stringify(expectedJsonObj)).to.equal(
      JSON.stringify(queryStrToJsonObj(queryStr)),
    );
  });

  it("rule 8 should convert", () => {
    let queryStr = "foo=1&foo=2";
    let jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { foo: [1, 2] };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("foo=1&foo=2").to.equal(queryStr);
    jsonObj = queryStrToJsonObj(queryStr);
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
  });

  it("rule 8 different types should convert", () => {
    let queryStr = "foo~b=1&foo~i=2";
    let jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { foo: [true, 2] };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("foo=true&foo=2").to.equal(queryStr);
    jsonObj = queryStrToJsonObj(queryStr);
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
  });

  it("rule 9 should convert", () => {
    const queryStr = "foo.flag=false&foo.value=2&foo.title=bar";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { foo: { flag: false, value: 2, title: "bar" } };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    const result = jsonObjToQueryStr(jsonObj);
    expect(queryStr).to.equal(result);
  });

  it("rule 9 invalid types should fail", () => {
    expect(() => queryStrToJsonObj("foo.bar~s.zap=1")).to.throw();
  });

  it("rule 10 example 1", () => {
    const queryStr = "foo=a&foo=b";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { foo: ["a", "b"] };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    const result = jsonObjToQueryStr(jsonObj);
    expect(queryStr).to.equal(result);
  });

  it("rule 10 example 2", () => {
    let queryStr = "foo~a.n=a&foo~a.n=b";
    let jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { foo: ["a", "b"] };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    queryStr = jsonObjToQueryStr(jsonObj);
    expect("foo=a&foo=b").to.equal(queryStr);
    jsonObj = queryStrToJsonObj(queryStr);
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
  });

  it("rule 10 example 3", () => {
    let queryStr = "foo~a.n.c=a&foo~a.n.c=b";
    let jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { foo: [{ c: "a" }, { c: "b" }] };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    queryStr = jsonObjToQueryStr(jsonObj);
    const expectedQueryStr = "foo~a.n.c=a&foo.n.c=b";
    expect(expectedQueryStr).to.equal(queryStr);
    jsonObj = queryStrToJsonObj(queryStr);
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
  });

  it("rule 10 example 4", () => {
    const queryStr = "foo~a=&foo.n.c=a&foo.n.c=b";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { foo: [{ c: "a" }, { c: "b" }] };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    const result = jsonObjToQueryStr(jsonObj);
    const expectedQueryStr = "foo~a.n.c=a&foo.n.c=b";
    expect(expectedQueryStr).to.equal(result);
  });

  it("rule 10 example 5", () => {
    const queryStr = "foo~a.n.c=a&foo.e.d=b";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { foo: [{ c: "a", d: "b" }] };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    const result = jsonObjToQueryStr(jsonObj);
    expect(queryStr).to.equal(result);
  });

  it("rule 10 example 6", () => {
    const queryStr = "foo~a.e.c=a&foo.e.d=b";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { foo: [{ c: "a", d: "b" }] };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    const result = jsonObjToQueryStr(jsonObj);
    const expectedResult = "foo~a.n.c=a&foo.e.d=b";
    expect(expectedResult).to.equal(result);
  });

  it("rule 10 example 7", () => {
    const queryStr = "foo~a.e.c=a&foo.e.c=b";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { foo: [{ c: ["a", "b"] }] };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    const result = jsonObjToQueryStr(jsonObj);
    const expectedResult = "foo~a.n.c=a&foo.e.c=b";
    expect(expectedResult).to.equal(result);
  });

  it("rule 10 example 8", () => {
    const queryStr = "foo~a.e~a.e~a.e=1";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { foo: [[[1]]] };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    const result = jsonObjToQueryStr(jsonObj);
    const expectedResult = "foo~a.n~a.n~a.n=1";
    expect(expectedResult).to.equal(result);
  });

  it("rule 10 example 9", () => {
    const queryStr = "foo~a.n~a.n~a.n=1&foo~a.n~a.n~a.n=2&foo~a.e~a.e~a.e=3";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { foo: [[[1]], [[2, 3]]] };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    const result = jsonObjToQueryStr(jsonObj);
    const expectedResult = "foo~a.n~a.n~a.n=1&foo.n~a.n~a.n=2&foo.e.e.n=3";
    expect(expectedResult).to.equal(result);
    const jsonObj2 = queryStrToJsonObj(result);
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj2));
  });

  it("rule 11 example 1", () => {
    expect(() => queryStrToJsonObj("a~a=&a.b=1")).to.throw();
  });

  it("rule 11 example 2", () => {
    expect(() => queryStrToJsonObj("a~a=&a.foo=1")).to.throw();
  });

  it("rule 12 example 1", () => {
    const queryStr = "a~~a=1";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { "a~a": 1 };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    const result = jsonObjToQueryStr(jsonObj);
    expect(queryStr).to.equal(result);
  });

  it("rule 12 example 2", () => {
    const queryStr = "a~~~b=1";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { "a~": true };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    const result = jsonObjToQueryStr(jsonObj);
    const expectedResult = "a~~=true";
    expect(JSON.stringify(expectedResult)).to.equal(JSON.stringify(result));
    expect(JSON.stringify(expectedJsonObj)).to.equal(
      JSON.stringify(queryStrToJsonObj(result)),
    );
  });

  it("rule 12 example 3", () => {
    const queryStr = "a~~~.b=1";
    const jsonObj = queryStrToJsonObj(queryStr);
    const expectedJsonObj = { "a~.b": 1 };
    expect(JSON.stringify(expectedJsonObj)).to.equal(JSON.stringify(jsonObj));
    const result = jsonObjToQueryStr(jsonObj);
    expect(queryStr).to.equal(result);
  });

  it("geometry should convert", () => {
    const jsonObj = {
      name: "geometry",
      points: [
        [1, 2],
        [3, 4],
      ],
      linestring: [1, 2, 3, 4],
    };
    const queryStr = jsonObjToQueryStr(jsonObj);
    const expectedQueryStr =
      "name=geometry" +
      "&points~a.n~a.n=1&points.e.n=2&points.n~a.n=3&points.e.n=4" +
      "&linestring=1&linestring=2&linestring=3&linestring=4";
    expect(expectedQueryStr).to.equal(queryStr);
    const result = jsonObjToQueryStr(jsonObj);
    expect(queryStr).to.equal(result);
    const resultingJsonObj = queryStrToJsonObj(result);
    expect(JSON.stringify(jsonObj)).to.equal(JSON.stringify(resultingJsonObj));
  });

  it("error path 1 should fail", () => {
    expect(() => queryStrToJsonObj("foo~a.b.c=1")).to.throw();
  });

  it("error path 2 should fail", () => {
    expect(() => queryStrToJsonObj("value=1&value.child=2")).to.throw();
  });

  it("error path 3 should fail", () => {
    expect(() =>
      queryStrToJsonObj("value=1&value.child.grandchild=2"),
    ).to.throw();
  });

  it("non json object should fail", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => jsonObjToQueryStr({ foo: new Date() as any })).to.throw();
  });

  it("uuids should convert", () => {
    // Tests case where uuid starts with a number. (Found in testing)
    const jsonObj = { id: "1194739a-8e75-47c1-98dd-887055a560c6" };
    const queryStr = jsonObjToQueryStr(jsonObj);
    const expectedQueryStr = "id=1194739a-8e75-47c1-98dd-887055a560c6";
    expect(queryStr).to.equal(expectedQueryStr);
    const result = queryStrToJsonObj(queryStr);
    expect(JSON.stringify(jsonObj)).to.equal(JSON.stringify(result));
  });

  it("Special number str should convert", () => {
    for (const n of ["NaN", "Infinity", "-Infinity"]) {
      const jsonObj = { id: n };
      const queryStr = jsonObjToQueryStr(jsonObj);
      const expectedQueryStr = `id~s=${n}`;
      expect(queryStr).to.equal(expectedQueryStr);
      const result = queryStrToJsonObj(queryStr);
      expect(JSON.stringify(jsonObj)).to.equal(JSON.stringify(result));
    }
  });

  it("Special number should convert", () => {
    for (const n of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ]) {
      const jsonObj = { id: n };
      const queryStr = jsonObjToQueryStr(jsonObj);
      const expectedQueryStr = `id=${n}`;
      expect(queryStr).to.equal(expectedQueryStr);
      const result = queryStrToJsonObj(queryStr);
      expect(JSON.stringify(jsonObj)).to.equal(JSON.stringify(result));
    }
  });
  */
});
