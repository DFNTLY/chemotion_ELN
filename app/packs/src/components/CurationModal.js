import React, { Component , useState} from 'react';
import { Grid,Button, ButtonToolbar, FormControl, Glyphicon, Modal, Table, Popover,Tooltip,OverlayTrigger,Overlay, Panel, Alert,Col, Row, ControlLabel} from 'react-bootstrap';
import PropTypes, { array } from 'prop-types';
import AutomticCurationFetcher from 'src/fetchers/AutomaticCurationFetcher.js';


export default class CurationModal extends Component {
    constructor(props) {
      var Typo = require("typo-js");
      super(props);
      this.handleShow = this.handleShow.bind(this);
      this.handleClose = this.handleClose.bind(this);
      this.handleSuggest = this.handleSuggest.bind(this);
      this.handleSuggest = this.handleSuggest.bind(this);
      this.changeCorectWord = this.changeCorectWord.bind(this)
      this.handleSuggestChange = this.handleSuggestChange.bind(this)
      this.handleDictionaryLang = this.handleDictionaryLang.bind(this)
      this.handlePromptDismiss = this.handlePromptDismiss.bind(this);
      this.handlePromptShow = this.handlePromptShow.bind(this);
      this.convertStringToObject = this.convertStringToObject.bind(this);
      this.updateDescription = this.updateDescription.bind(this)
      this.scrollToId = this.scrollToId.bind(this)
      this.state = {
        desc : this.cleanData(this.props.description),
        show : false, 
        mispelledWords : [],
        correctedWords: [],
        suggestion : [],
        suggestionIndex : 0,
        correctWord : "",
        subscriptList : [],
        dictionaryLanguage: "US",
        showPrompt : false,
        descriptionObject : {},
        cus_dictionary : new Typo("custom", false, false, { dictionaryPath: "/typojs" }),
        uk_dictionary : new Typo("en_UK", false, false, { dictionaryPath: "/typojs" }),
        us_dictionary : new Typo("en_US", false, false, { dictionaryPath: "/typojs" }),
        showCorrectButton: true,
        idKeyArray : []
    }}

    

    handlePromptDismiss() {
      this.setState({ showPrompt: false });
    }

    handlePromptShow() {
      this.setState({ showPrompt: true });
    }

    handleDictionaryLang(){
      (this.state.dictionaryLanguage === "US")
        ? this.setState({dictionaryLanguage: "UK"})
        : this.setState({dictionaryLanguage: "US"})
      this.spellCheck(this.state.desc)
    }

    updateDescription(){
      this.setState({desc: this.cleanData(this.props.description) }, (() => {this.spellCheck(this.state.desc );
      }))
    }

    convertStringToObject(input_string){
      var word_with_subscript = input_string.match(/\b[a-z]\w*\d[a-z]*/gi);
      var regex_string = '';
      var new_array = [];
      var output_object = new Object
      if (word_with_subscript != null){
      for (let i= 0; i< word_with_subscript.length; i++){
        if (i == word_with_subscript.length -1 ){
          regex_string = regex_string.concat(word_with_subscript[i]) ;
          }
        else
          regex_string = regex_string.concat(`${word_with_subscript[i]}|`)
      };}
      else{regex_string = "no match"}
      var regex_sub = new RegExp(`(${regex_string})` ,"g");
      new_array = input_string.split(regex_sub);
      for (let i = 0 ; i < new_array.length; i++){
        if (new_array[i].match(/\b[a-z]\w*\d[a-z]*/gi)){
          new_array[i] = new_array[i].split(/(\d)/g)
        }
      }
      new_array = new_array.flat()
      for (let i = 0 ; i < new_array.length; i++){
        if (new_array[i].match(/\d/) && new_array[i].length == 1){
          new_array[i] = {"attributes":{"script":"sub"}, "insert":new_array[i]}
        }
        else
          new_array[i] = {"insert": new_array[i]}
      };
      output_object = {"ops" : new_array}
      output_object["ops"] = output_object["ops"].filter((x)=> x["insert"] != "" )
      this.setState({descriptionObject:output_object},()=>{      
        this.props.onChange(this.state.descriptionObject);
                 });
      return output_object
    }

    handleSuggestChange(e){
      const new_word = e.target.value
      this.setState({correctWord:new_word})
    }

    advanceSuggestion(index,miss_spelled_words){
      var correctedArray = this.state.correctedWords
      if (index < miss_spelled_words.length ){
      index = index +1 }
      else {
        index = 0
      }
      correctedArray.push(miss_spelled_words[index - 1])
      this.handleSuggest(miss_spelled_words, index)
      this.setState( {suggestionIndex : index,
        correctedArray: correctedArray
      } ) 
    }



    reverseSuggestion(input,miss_spelled_words){
      if (input < miss_spelled_words.length){
      input = input -1 }
      else {
        input = 0
      }
      this.handleSuggest(miss_spelled_words, input)
      this.setState( {suggestionIndex : input} ) 
    }

    handleClose() {
      this.setState({ show: false });
    }

    handleShow() {
     
      this.setState({ show: true }, this.updateDescription);
    
   
    }

    handleSuggest(miss_spelled_words, index){
      var Typo = require("typo-js");
      var dictionary = new Typo( "en_US", false, false, { dictionaryPath: "/typojs" });
      var mispelled_word = miss_spelled_words[index]
     
      if (typeof mispelled_word === "string" )
      {  
        if (/(.)\1{4,}/.test(mispelled_word))
        {

          var repeatedCharacter = mispelled_word.match(/(.)\1{4,}/)
          var newMisspeled = mispelled_word.replace(/(.)\1{4,}/, repeatedCharacter[0].charAt(0)  ) 
          var ms_suggestion = [newMisspeled]
        }
        else
        var ms_suggestion = dictionary.suggest(mispelled_word)
        this.setState({ suggestion : ms_suggestion}) 
      }   
      else {
        console.log("run spell check")
      }
    }

    useAllDicitonary(en_dictionary,custom_dictionary, word){
      var is_word_correct = false ;
      if (en_dictionary.check(word)){
        is_word_correct = true}
      else { if(custom_dictionary.check(word)){
        is_word_correct = true
      }}
      return is_word_correct
    }

    checkSubScript(input_text){
      if(/\b[a-z]\w*\d[a-z]*/gi.test(input_text)){
      var potential_mol_form = input_text.match(/\b[a-z]\w*\d[a-z]*/gi)
      var split_form = potential_mol_form[0].split(/(\d)/g) 
        // Clean off empty strings
        split_form = split_form.filter(n => n) 
        return split_form.map((part, index) => (
          <React.Fragment key={index}>
            {(split_form[index].match(/\d/))
              ? (<sub>{part}</sub>) 
              : (part)}
          </React.Fragment>
        )) 
    }}

    spellCheck(description){
      if(description !== undefined){
        // var Typo = require("typo-js");
        var cus_dictionary = this.state.cus_dictionary
        var  uk_dictionary = this.state.uk_dictionary
        var  us_dictionary = this.state.us_dictionary
        var ms_words = [];
        var ss_list = []
        var italics_array =[]
        var word_array = description.split(/[\s]|[\n]|[\b]/g)
  
        if (this.state.dictionaryLanguage === "UK"){
          var en_dictionary = uk_dictionary
          console.log("uk used")
        }
        else {
          var en_dictionary = us_dictionary
          console.log("us used")
        }
        for (let i = 0; i < word_array.length; i++){
          var punctuation = /[\.\,\?\!\(\)\"\;\`\*\[\]\:]/g;
          word_array[i] = word_array[i].replace(/\[\d+\]/g, "")
          var double_space_regex= /\s\s/g
          word_array[i] = word_array[i].replace(punctuation, " ");
          word_array[i] = word_array[i].replace(double_space_regex, " ")
          // check if word has a number in it
          if (/\b[\p{Script=Latin}]+\b/giu.test(word_array[i])){
            if(word_array[i].includes("°") ){
              var spell_checked_word = true
            }
            if(/\/.+\//gi.test(word_array[i])){
             
              italics_array.push(word_array[i])
              var spell_checked_word = true
            }
            else{
              if(/[a-z]*\-[a-z]*/.test(word_array[i]))
                {
             
                }
              else{
       
                if(/'/.test( word_array[i])){
           
                  var sliceIndex = word_array[i].indexOf("\'")
           
                  word_array[i] = word_array[i].substring(0 ,sliceIndex) 
                }
                if(/—/.test(word_array[i])){
                  var sliceIndex = word_array[i].indexOf("—")
                  word_array[i] = word_array[i].substring(0,sliceIndex)
                  word_array.push(word_array[i].slice(sliceIndex))
                }
                
                var spell_checked_word = this.useAllDicitonary(en_dictionary,cus_dictionary,word_array[i]);
              }
          }}
          else
            {if(/\b[a-z]\w*\d[a-z]*/gi.test(word_array[i]))
              {ss_list.push(word_array[i])}
            else{
              var spell_checked_word = true; }
            }
          if(spell_checked_word == false){
            ms_words.push(word_array[i]);
    
          } 
        }
        ms_words = ms_words.filter((x)=> x != "" )
        this.setState({mispelledWords: ms_words, subscriptList:ss_list}, ()=>{
    
        })
        this.handleSuggest(ms_words, 0)
        }
      else{}}

    cleanMisspelledArray(input_array){
      const counts = {};
      input_array.forEach(function (x) { counts[x] = (counts[x] || 0) + 1; });
      return counts
    }

    changeMisspelling(description,selected_choice,ms_words,index){
      if (selected_choice !== ""){
        var fixed_description = description.replace(ms_words[index], selected_choice);}
      else{
        var fixed_description = description}
          if (index < ms_words.length){
            index= index +1 }
          else {
            index = 0
      }
      var correctedWords = this.state.correctedWords
      correctedWords.push(ms_words[index - 1])
      this.setState({suggestionIndex : index, 
        desc :fixed_description,
        correctedWords: correctedWords});
      this.handleSuggest(ms_words, index);
      this.setState({correctWord: "", showCorrectButton: true})
    }

    removeSpaces(introarray){
      for(var entry of introarray){
        var index = introarray.indexOf(entry)
        introarray[index] = entry.replaceAll(" ","")
      }
      return introarray
    }

    getHighlightedText(text, mispelledWords,ms_index,subscriptList) {
      var correctedArray = this.state.correctedWords
      var idArray = this.state.idKeyArray
      var idindex = 0
      for (var entry of mispelledWords){
        var index = mispelledWords.indexOf(entry)
        mispelledWords[index] = entry.replaceAll(" ","")
      }
      if(text !== undefined){
        var combined_array = mispelledWords.concat(subscriptList)
        for (var entry of combined_array){
          var index = combined_array.indexOf(entry)
          combined_array[index] = entry.replaceAll(" ","")
        }
        var highlight = combined_array.join("|")
        highlight = highlight.replaceAll(" ","")
        highlight = "\\b(" + highlight + ")\\b"
        var regexHighlight = new RegExp(highlight, "gi")
        var parts = text.split(regexHighlight);
        var output_div
        parts.filter((x)=> x != "" )
        var list_items = parts.map((part, index) => (
          <React.Fragment key={index}>
            {(()=> 
            {
              var highlight_current = mispelledWords[ms_index]
              highlight_current = "\\b(" + highlight_current + ")\\b"
              var regexHighlightCurrent = new RegExp(highlight_current, "gi")

              var highlightWithOutCurrent = mispelledWords.toSpliced(ms_index, 1)
              highlightWithOutCurrent = highlightWithOutCurrent.join("|")
              highlightWithOutCurrent = "\\b(" + highlightWithOutCurrent + ")\\b"
              var regexHighlightWithOutCurrent = new RegExp(highlightWithOutCurrent, "gi")
              if(subscriptList.includes(part)){
                output_div =  this.checkSubScript(part)   
              }
              else if(regexHighlightCurrent.test(part) && !correctedArray.includes(part) )
                {
                  output_div = (<b id={idindex} style={{backgroundColor:"#32a852"}}>{part}</b>) 
                  idArray.push(idindex)
                  idindex = idindex + 1
                }
              else if(regexHighlightWithOutCurrent.test(part) && !correctedArray.includes(part) ) 
                {
                  output_div = (<b id={idindex} style={{backgroundColor:"#e8bb49"}}>{part}</b>)
                  idArray.push(idindex)
                  idindex = idindex + 1
                }
              else if(correctedArray.includes(part)){
                  output_div = <span id={idindex}> {part} </span>
                  idArray.push(idindex)
                  idindex = idindex + 1
                }
                
              }
              )
              ()
            }
           
          {combined_array.includes(part)
            ? (output_div)
            : (part)} 
        </React.Fragment>)
        )
        
        return (
          <div>
            {list_items}
          </div>
        );}
        // console.log(idArray)
        this.setState({idKeyArray: idArray})}

    uniq(a) {
      var prims = {"boolean":{}, "number":{}, "string":{}}, objs = [];
      return a.filter(function(item) {
          var type = typeof item;
          if(type in prims)
              return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
          else
              return objs.indexOf(item) >= 0 ? false : objs.push(item);
      });
    }

    changeCorectWord(changeEvent) {
      this.setState({correctWord: changeEvent.target.value,
        showCorrectButton:false
      }) 
    }

    cleanData(description){
      if (description !== undefined){
        var newDescription = ""
        if(typeof description === "string"){
          return description 
        }
        else if(typeof description.value == "object" && description.value.ops !== undefined){
          for (var element of description.value.ops){
            newDescription = newDescription + element.insert
          }
          return newDescription
        }

        else{
        const array_input = Object.values(description);
        let array_output =[];
        array_input.forEach((element) => {
            array_output = array_output.concat(element.insert);
        });
      
        const str_out = (array_output.join(""));
        return str_out;}}
      else  
      return
      // throw Error('data is not in correct format')
    }

    amendUpdate(input){
      var Typo = require("typo-js");
      AutomticCurationFetcher.amendFetch(input)
      this.setState({cus_dictionary: new Typo("custom", false, false, { dictionaryPath: "/typojs" })})


    }

    scrollToId(){
      var sugIndex = this.state.suggestionIndex
      var idArray = this.state.idKeyArray
      var querryselector = `#\\3${idArray[sugIndex]}`
      console.log(querryselector)
      var element = document.querySelector(querryselector) 
      // console.log(element)
      if(element !== null){
      element.scrollIntoView({behavior :"smooth", alignToTop: true})
    }
  }

    render() {
      var CustomPopover = () =>  (
          <Grid className="customPopover">
            <Col md={3} style={{paddingLeft: 0, marginLeft: "-15px"}}>
              <h4><b>{this.state.correctWord} </b> added To dictionary
              </h4>
            </Col>
            <Col md={3}>
              <ButtonToolbar>
                <Button onClick={()=> {AutomticCurationFetcher.removeFetch(this.state.mispelledWords[this.state.suggestionIndex]) ;this.handlePromptDismiss()}}>Remove last entry</Button>
                <Button onClick={()=>{this.changeMisspelling(this.state.desc, this.state.correctWord, this.state.mispelledWords, this.state.suggestionIndex);this.handlePromptDismiss()}}>Next</Button>
              </ButtonToolbar> 
            </Col>
          </Grid>
        );
     
    
      const Compo = ({ text, mispelledWords,index ,subscriptList}) => {
        return <div>{this.getHighlightedText(text, mispelledWords,index, subscriptList )}</div>;
      };

      const SuggestBox = ({suggest_array, suggestionIndex}) =>{
        if (suggestionIndex <  this.state.mispelledWords.length ){
          return suggest_array.map((suggestion,id) =>  (
            <div key={id}>
              <label> 
                <input type="radio" value= {suggestion} onChange={this.changeCorectWord} checked={this.state.correctWord === suggestion} style={{marginRight:5}}/>
                {suggestion}
                </label> 
             </div>  
        ));}
        else if (suggestionIndex >= this.state.mispelledWords.length ){
        return(
        <div>
          <h5>No corrections detected</h5>
        </div>)}
        else{
          return (
            <div>
              <h5>None</h5>
            </div>
          )
        }
      };

      const DictionaryButton = ({state})=>{
        if (state == true){
          return(<></>)
        }
        else{
          return(
            <Button 
            bsStyle="success" 
            onClick= {() => { 
            this.amendUpdate(this.state.correctWord); this.handlePromptShow()
            }}>
                add to dictionary {state}
            </Button>
      )}}

      let formWindow;
        if(this.state.showPrompt == false){
          formWindow =  
          <form>
            <FormControl
              type="text"
              value={this.state.value}
              placeholder="Enter text"
              onChange={this.handleSuggestChange}
              maxLength={30}
              /> 
          </form>;
        }
        else{
          formWindow = <CustomPopover></CustomPopover>;
        }

      return (
        <span>
          <Button  onClick={() => {this.handleShow()}} style={{float:"none"}}  
          id={this.props.ref}>
            <span  title="Curate Data" className="glyphicon glyphicon-check" style={{color: "#369b1e"}}/>
          </Button>
    
          <Modal show={this.state.show} onHide={this.handleClose} onEntered={this.scrollToId} >
            <Modal.Header closeButton>
              <Modal.Title>
                <Col md={6}><span style={{paddingRight:10}}>Spell Check: English {this.state.dictionaryLanguage}   </span>
                  <Button onClick={()=> this.handleDictionaryLang()}><i class="fa fa-language" ></i>
                  </Button>
                </Col>
              </Modal.Title> 
            </Modal.Header>
            <Modal.Body>
              <Panel >
                <Panel.Heading>
                <Grid >
                  <Row style={{paddingTop:5}}>
                    <Col md={3} sm={3} style={{paddingLeft:0}} > {formWindow}</Col>
                    <Col md={2} style={{paddingLeft:0}}> <DictionaryButton state={this.state.showPrompt}></DictionaryButton></Col>
                  </Row>
                </Grid>
                </Panel.Heading>
                <Panel.Body style={{overflowY:"scroll",height:300}}>
                  <Compo text={this.state.desc} 
                    mispelledWords={this.state.mispelledWords} 
                    index={this.state.suggestionIndex} 
                    subscriptList={this.state.subscriptList} /> 
                </Panel.Body> 
                <Panel>
                  <Panel.Heading>
                  <Row>
                  <Col md={7}>
                 <h5> Suggestions for : <b>{this.state.mispelledWords[this.state.suggestionIndex]}
                  </b>  </h5></Col><Col md={5}><Button onClick={()=> {this.amendUpdate(this.state.mispelledWords[this.state.suggestionIndex]);this.advanceSuggestion(this.state.suggestionIndex,this.state.mispelledWords)}}>Add Selected Word
                    </Button></Col>
                    </Row>
                  </Panel.Heading>
                  <Panel.Body>
                    <Col md={6}>
                      <SuggestBox suggest_array={this.state.suggestion} suggestionIndex={this.state.suggestionIndex}></SuggestBox>
                    </Col>
                    <Col md={6}>
                    </Col>
                  </Panel.Body>
              <Panel.Footer><ButtonToolbar>
              <Button onClick={this.scrollToId}></Button>
                <Button onClick={()=>{this.advanceSuggestion(this.state.suggestionIndex,this.state.mispelledWords); this.scrollToId()}}>Ignore</Button>
                <Button onClick={()=>this.reverseSuggestion(this.state.suggestionIndex,this.state.mispelledWords)}>Go Back</Button>
                <Button onClick={()=>
                {this.changeMisspelling(this.state.desc, this.state.correctWord, this.state.mispelledWords, this.state.suggestionIndex);
                this.convertStringToObject(this.state.desc)
                this.scrollToId()}}
                disabled={this.state.showCorrectButton}>
                Correct</Button>
                {/* <Button onClick={()=> this.convertStringToObject(this.state.desc)}>convert string</Button> */}
                {/* save issue is here */}
                <div className='pull-right'><Button onClick={()=> {
            
                  this.convertStringToObject(this.state.desc); 
                  this.handleClose()
                  }}> 
                  <i class="fa fa-floppy-o"></i> </Button>
                </div>
              </ButtonToolbar> 
              </Panel.Footer>
            </Panel>
        </Panel>
    </Modal.Body>
  </Modal>
</span>
      );
    }
  }

CurationModal.propTypes = {
    reaction: PropTypes.object,
    onChange: PropTypes.func,
    ref: PropTypes.string
  };
  
