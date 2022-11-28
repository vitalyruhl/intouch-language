import * as assert from "assert";
// import * as vscode from "vscode";

const fo = require("../../formats")
const functions = require("../../functions")
let config = functions.getConfig()


suite('test formats.ts - Format or even not format the comments...', () => {

  test('simple multiline comment', () => {
    let testString = `{
      Changelog:
        V0.0.1		25.10.2021 		ViRu 	define Tests
        V0.0.2		27.10.2021 		ViRu 	add some Tests and modify comments 
        V1.0.0		28.10.2021 		ViRu 	add Test for next futures 
        V1.1.0		02.11.2021 		ViRu 	Add Comment-Blocks for Nesting and Folding in code without keywords 
        V1.1.1		22.01.2022 		ViRu 	Add add test for new issue on dashed variable, test for #region folding 
      }`
    let toBeString = `{
      Changelog:
        V0.0.1		25.10.2021 		ViRu 	define Tests
        V0.0.2		27.10.2021 		ViRu 	add some Tests and modify comments 
        V1.0.0		28.10.2021 		ViRu 	add Test for next futures 
        V1.1.0		02.11.2021 		ViRu 	Add Comment-Blocks for Nesting and Folding in code without keywords 
        V1.1.1		22.01.2022 		ViRu 	Add add test for new issue on dashed variable, test for #region folding 
      }`
    assert.equal(fo.forFormat(testString,config),toBeString)
  });

  test('dashes in comment', () => {
    let testString = '{-------------------------------------------}'
    let toBeString = '{-------------------------------------------}'
    assert.equal(fo.forFormat(testString,config),toBeString)
  });

  test('some code in comment', () => {
    let testString = `{>------------------------------------------------------------------------------}
    {Formating-Test comment:
      if that if is Big after Formatting, then the code is wrong...
      if sys_Debug_info > 0 then LogMessage(Funkt +"Erste-MA:["   + Text(iErsteMA,"#")  "]"); endif;
      if sys_Debug_info > 0 then LogMessage(Funkt+ "Bezeichnung:["+ sFUBezeichnung           + "]"); endif;
    {<------------------------------------------------------------------------------}
    ` 
    let toBeString = `{>------------------------------------------------------------------------------}
    {Formating-Test comment:
      if that if is Big after Formatting, then the code is wrong...
      if sys_Debug_info > 0 then LogMessage(Funkt +"Erste-MA:["   + Text(iErsteMA,"#")  "]"); endif;
      if sys_Debug_info > 0 then LogMessage(Funkt+ "Bezeichnung:["+ sFUBezeichnung           + "]"); endif;
    {<------------------------------------------------------------------------------}
    ` 
    assert.equal(fo.forFormat(testString,config),toBeString)
  });
});

