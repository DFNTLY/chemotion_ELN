import React, { Component, useEffect} from 'react';
import { Grid, Row, Col, Nav, NavItem , Button, Form, FormGroup,ControlLabel,FormControl,HelpBlock} from 'react-bootstrap';
import { a, search } from 'react-dom-factories';
import Dropzone from 'react-dropzone';
import AutomticCurationFetcher from 'src/fetchers/AutomaticCurationFetcher.js';


export default class DictionaryCuration extends Component  {
    constructor(props) {
        super(props);
        this.saveFile = this.saveFile.bind(this)
        this.handleChangeCustom = this.handleChangeCustom.bind(this);
        this.handleChangeEstablished = this.handleChangeEstablished.bind(this);
        this.handleChangeCustomSearch = this.handleChangeCustomSearch.bind(this)
        this.handleChangeEstablishedSearch = this.handleChangeEstablishedSearch.bind(this)
        this.checkCvEstDictionary= this.checkCvEstDictionary.bind(this)
        this.state = {
            customValue: '',
            establishedValue:"",
            file: null,
            customSearch: "",
            establishedSearch :"",
            affObject : null,
            establishedDictionaryText :"",
            customDictionaryText: "",
            loading :false
        }}
    
    async componentDidMount(){
      var initTime = new Date();
      console.log(`start: ${initTime}`)
      const customDictionaryText = AutomticCurationFetcher.dictionaryFetch("custom", "custom.dic")
      const establishedDictionaryText = AutomticCurationFetcher.dictionaryFetch("en_US", "en_US.dic")
      const affixText = AutomticCurationFetcher.dictionaryFetch("en_US", "en_US.aff")

      const [new_customDictionaryText, new_establishedDictionaryText, new_affixText ] = await Promise.all([customDictionaryText,establishedDictionaryText,affixText])
      console.log(`fetch done: ${Date.now() - initTime}`)
      // var affObject = this.convertAffxStrtoObj(new_affixText)
      console.log(`aff converted done: ${Date.now() - initTime}`)
      this.setState({
        establishedValue : new_establishedDictionaryText,
        establishedDictionaryText : new_establishedDictionaryText,
        customValue : new_customDictionaryText,
        customDictionaryText : new_customDictionaryText,
        affObject: {},
        loading : true
        }
        ,
      //   ()=>{this.applyAffix(); console.log(`aff done: ${Date.now() - initTime}`)}
      ); 
        this.fileDisplay()  
    }
    useDictionary(word){
      var Typo = require("typo-js");
      var us_dictionary = new Typo("en_US", false, false, { dictionaryPath: "/typojs" });
      var is_word_correct = us_dictionary.check(word)
      return is_word_correct
      }
 
    
    // convertAffxStrtoObj(affixStr){
     
    //   var affixArray =affixStr.split("\n")
    //   var iArray = []
    //   var affixObject = {}
    //   var aff1stLine ={}
    //   for (var i =0 ; i < affixArray.length; i++){
    //     var affixLine = affixArray[i]
    //     if (affixLine.match(/((SFX)|(PFX)) [A-Z] ((Y)|(N)) \d/g)){
    //       iArray.push(i)
    //     }
    //   }

    //   for (var i =0 ; i < iArray.length; i++){
    //     var startingLine = (affixArray[iArray[i]])
    //     var numOfLines = startingLine.match(/\d/).join()
    //     var affixLetter= startingLine.match(/ [A-Z] /)
    //     affixLetter[0] = affixLetter[0].replaceAll(" ", "") 
    //     var endingLine = iArray[i] + parseInt(numOfLines)
      
    //       for (var j = iArray[i] ; j <= endingLine; j++){

    //         if (affixArray[j].match(/((SFX)|(PFX)) [A-Z] ((Y)|(N)) \d/g))
    //         {
    //           var splitLine =affixArray[j].split(" ")
    //           var sOrP =splitLine[0]
    //           var affixLetter = splitLine[1]
    //           var yesNo = splitLine[2]
    //           var numOfLines = splitLine[3]
    //            aff1stLine = {[affixLetter]: [sOrP,yesNo,numOfLines]}

    //         }
    //         else{
    //         var selectedLine = affixArray[j];
    //         var slicedLine = selectedLine.split(/\s* /);
    //         // for (var property in slicedLine){
    //         //   property = property.replace(" ","")
    //         // }
    //         // var slicedLine = slicedLine.filter((x)=> x != "" );
    //         var sOrP = slicedLine[0]
    //         var affixLetter = slicedLine[1]
    //         var removedLetter = slicedLine[2];
    //         var addedaffix = slicedLine[3]
    //         var lastChar = slicedLine[4]
    //         var affNthLine =  {[lastChar] :[sOrP,removedLetter,addedaffix]}
           
    //         // charMap.lastChar = removedLetter
    //         // affixMap.affix = charMap
    //         // affixObject[affixLetter] = [affixMap]
    //          }
    //          var affObject = new Object 
    //           affObject = {[affixLetter]:[aff1stLine]}
    //         for (var k = 0; k < numOfLines; k++){
    //           // console.log(affNthLine)
    //          affObject[affixLetter].push(affNthLine)}
    //          Object.assign(affixObject,affObject)
    //          console.log(affixObject)
    //       }}
          
          
    //   return affixObject
    // }

    // applyAffix(){
    //   var dictionaryString = this.state.establishedValue
    //   var dictionaryArray = dictionaryString.split("\n")
    //   var objectsToLoad = dictionaryArray.length
    //   for(var entry of dictionaryArray){
    //     entry = entry.replace("!","")
    //     // console.log(entry)
    //     if (/\/[A-Z]/.test(entry)){
    //       var entrySplitArray = entry.split("/")
    //       var word = entrySplitArray[0]
    //       var affix = entrySplitArray[1]
    //       affix = affix.split("")
    //       var newDictArray = [word]
    //       newDictArray = newDictArray.concat(this.workWithaffObject(word,affix, this.state.affObject))
    //       dictionaryArray[dictionaryArray.indexOf(entry)] = newDictArray
    //     }
    //     else{
    //     }
    //   }
    //   dictionaryArray = dictionaryArray.flat()
    //   console.log("affix applied")
    //   dictionaryString = dictionaryArray.join("\n")
    //   this.setState({
    //     establishedDictionaryText: dictionaryString,
    //     establishedValue: dictionaryString,
    //     loading : false
    //   })
    // }

    // workWithaffObject (word, inputAff, affixObject){
    // var newWordArray = []
    // for(var indvidualAff of inputAff){
    //   var sOrP = affixObject[indvidualAff][1]
    //   var affMap = affixObject[indvidualAff][0]
    //   var wordLastChar = word.charAt(word.length-1)
    //   var removeChar = affixObject[indvidualAff][0]
     
    //   var affKey = Object.keys(affMap)
    //   for(var key of affKey){
    //     const keyRegex = new RegExp(key)
    //     if (keyRegex.test(wordLastChar)){
    //       if (sOrP == "SFX"){
    //         newWordArray.push(word + affMap.get(key))
    //       }
    //       else {
    //         newWordArray.push(affMap.get(key) + word)
    //       }
    //     }
    //     else{
    //     }
    //   }
    // }
    //   return (newWordArray)
    // }

    handleSearchSubmit(DictionaryText,search,valueState){
      var dictionaryArray = DictionaryText.split("\n")
      var searchTerm = search
      var count = []
      var newDictString =""
      for (var dictEntry of dictionaryArray){
        if (dictEntry.includes(searchTerm)){
          count.push(dictionaryArray.indexOf(dictEntry))
        }
      }
      for (var countValue of count){
        newDictString = newDictString + dictionaryArray[countValue] + "\n"
      }
      this.setState({[valueState]: newDictString})
    }

    saveFile(){
      var new_dic = this.state.customValue
      new_dic = encodeURIComponent(new_dic)
      console.log(new_dic)
      AutomticCurationFetcher.saveFetch(new_dic)
    }

    handleChangeCustom(e) {
      this.setState({ customValue: e.target.value });
    }
    
    handleChangeEstablished(e) {
      this.setState({ establishedValue: e.target.value });
    }

    handleChangeCustomSearch(e) {
      this.setState({ customSearch: e.target.value });
    }

    handleChangeEstablishedSearch(e) {
      this.setState({ establishedSearch: e.target.value });
    }

    handleFileDrop(attach) {
        this.setState({ file: attach[0] });
    }
    
    handleAttachmentRemove() {
        this.setState({ file: null });
    }

    // checkCustomVsEstablished(custom,established){
    //   var customArray = custom.split("\n")
    //   var establishedArray = established.split("\n")
    //   var newCustomArray = customArray.filter(val => !establishedArray.includes(val));
    //   var removed_entries = customArray.filter(val => establishedArray.includes(val))
    //   console.log(removed_entries)
    //   console.log("finished checking")
    //   this.setState({customValue: newCustomArray.join("\n")})
    // }

    checkCvEstDictionary(custom){
      var Typo = require("typo-js");
        var us_dictionary = new Typo("en_US", false, false, { dictionaryPath: "/typojs" });
      var customArray = custom.split("\n")
      for (var customEntry of customArray){
        var is_word_correct = us_dictionary.check(customEntry)
        if (is_word_correct == true){
          var customArray = customArray.filter(e => e !== customEntry)
        }
      }
      this.setState({customValue: customArray.join("\n")})
    }

    creatDictionaryFromString(){
      var input = 'The Tetrarchy was the administrative division of the Roman Empire instituted by Roman emperor Diocletian in 293 AD, marking the end of the Crisis of the Third Century and the recovery of the Roman Empire. The first phase, sometimes referred to as the Diarchy ("the rule of two"), involved the designation of the general Maximian as co-emperor firstly as Caesar (junior emperor) in 285, followed by his promotion to Augustus in 286. Diocletian took care of matters in the Eastern regions of the Empire while Maximian similarly took charge of the Western regions. In 293, feeling more focus was needed on both civic and military problems, Diocletian, with Maximian\'s consent, expanded the imperial college by appointing two Caesars (one responsible to each Augustus) Galerius and Constantius Chlorus. '
      // input = input.replaceAll(/\d/g, "")
      input = input.replaceAll(" ", "\n")
      input = input.replaceAll(/[\.\,\?\!\(\) \"\d]/g, "")
      input = input.toLowerCase()
      console.log(input)
    }

    dropzoneOrfilePreview() {
        const { file } = this.state;
        return file ? (
          <div>
            {file.name}
            <Button bsSize="xsmall" bsStyle="danger" onClick={() => this.handleAttachmentRemove()} className="pull-right">
              <i className="fa fa-trash-o" />
            </Button>
          </div>
        ) : (
          <Dropzone
            onDrop={attach => this.handleFileDrop(attach)}
            style={{ height: 50, width: '100%', border: '3px dashed lightgray' }}
            // accept ={".dic"}
            >
            <div style={{ textAlign: 'center', paddingTop: 12, color: 'gray' }}>
              Drop File, or Click to Select.
            </div>
          </Dropzone>
        );
      }

    fileDisplay(){
      if (this.state.file !== null){
        this.state.file.text().then((text) =>this.setState({customValue :text}))
      }
    }

    loading(){
      if (this.state.loading == true){
      return (
        <div>
        affix loading
        </div>)}
      else
      return (<></>)
      
    }
    
    render() {
        return(
        <div>
            {this.dropzoneOrfilePreview()}
            <Button onClick={()=> this.checkCvEstDictionary(this.state.customValue)}>Check Custom Dictionary</Button>
            <Button onClick={()=> this.saveFile()}>Save dictionary</Button>
            {/* <Button onClick={()=> this.applyAffix()}>load affix</Button> */}
            {/* <Button onClick={()=> this.creatDictionaryFromString()}>Create dictionary</Button> */}
            <Row>
              <Col lg={6}>
             
                  <FormGroup controlId="customDictionary">
                      <ControlLabel>Custom Dictionary
                        <Row>
                          <Col lg={6}>
                            <FormControl
                              type="text"
                              placeholder="Enter Search"
                              onChange={this.handleChangeCustomSearch}/>
                          </Col>
                          <Col lg={5}> 
                            <Button type='submit' onClick={()=> 
                              this.handleSearchSubmit(this.state.customDictionaryText,this.state.customSearch,"customValue")}>
                              Submit
                            </Button>
                          </Col>
                        </Row>
                      </ControlLabel>
                      <FormControl
                        componentClass="textarea"
                        value={this.state.customValue}
                        onChange={this.handleChangeCustom}
                        style={{width: 500, height: 600}}
                      />
                      <FormControl.Feedback />
                  </FormGroup>
                  </Col>
                  <Col lg={6}>
                  <FormGroup controlId="establishedDictionary">
                      <ControlLabel>Established Dictionary
                        <Row>
                          <Col lg={6}>
                            <FormControl
                              type="text"
                              // value={this.state.value}
                              placeholder="Enter Search"
                              onChange={this.handleChangeEstablishedSearch}/>
                          </Col>
                          <Col lg={5}> 
                            <Button type='submit' onClick={()=> 
                              this.handleSearchSubmit
                              (this.state.establishedDictionaryText,this.state.establishedSearch,"establishedValue")}>
                              Submit
                            </Button>
                          </Col>
                        </Row>
                        </ControlLabel>
                      <FormControl
                          componentClass="textarea"
                          value={this.state.establishedValue}
                          onChange={this.handleChangeEstablished}
                          style={{width: 500, height: 600}}
                      />
                      <FormControl.Feedback />
                  </FormGroup>
                 
                  </Col>
                </Row>
            </div>
        )
    }   
}
