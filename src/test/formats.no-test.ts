const fo = require("../formats")
const functions = require("../functions")
let config = functions.getConfig()


test('Ground Format #1', () =>{
  const testString = 'test String'
  const toBeString = 'test String'
  expect(fo.forFormat(testString,config)).toEqual(toBeString)
})


