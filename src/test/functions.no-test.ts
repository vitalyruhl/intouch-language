const fu = require("../functions")
// import {cloneArray} from "../functions"


test('test clone array', () => {
    const arr = [1,2,3]
    expect(fu.cloneArray(arr)).toEqual(arr)
    expect(fu.cloneArray(arr)).not.toBe(arr)
  })

