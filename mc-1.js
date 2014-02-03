  // THis plugs into the debugger sceen of www.microcorruption.com/cpu/debugger
  // and thus makes assumptions about how that debugger stores "memory" 
  // values in the DOM. If the memory is defined, there should be a div
  // named 'memorylocationXXXX' for each byte where XXXX is the hex address
  // (uppercase letters) and the content of the div is the hex value of that
  // memory location.

  // The plugin tries to display the headers of the linked list used by the
  // malloc functions of Algiers and Chernobyl

  // This list has a root hook at 0x2400 (pointer to first header), 
  // 0x2402 (available heap size), and 0x2404 (initialized flag, 0 = initialized)

  // Create a div
  newdiv=document.createElement("div")
  newdiv.setAttribute("class","teal-box")
  newdiv.setAttribute("id","rudolf")
  newdiv.innerHTML="<h2>Plugin: malloc list</h2><code id='mc-list'>Text to follow</code>"

  console.debug("created newdiv")

  // Find column 2 and append a new div ... note, we still have the POINTER to the div so we can change contents via that pointer
  document.getElementsByClassName("column-2")[0].appendChild(newdiv)

  console.debug("attached to main div")

  // read "memory" data. Assume 0 if not defined
  // note that this will read a word and the system is low endian, thus
  // the byte swapping
  function readMem(memLocStrLoHex) {
    // find and print info about first list element
    // memLocStrLoHex = "2400"
    memLocStrHiHex = (parseInt(memLocStrLoHex,16)+1).toString(16).toUpperCase()

    memLoLoc=document.getElementById("memorylocation" + memLocStrLoHex)
    if (memLoLoc) { memLoVal=parseInt(memLoLoc.innerHTML,16) }
    else          { memLoVal=0 }

    memHiLoc=document.getElementById("memorylocation" + memLocStrHiHex)
    if (memHiLoc) { memHiVal=parseInt(memHiLoc.innerHTML,16) }
    else          { memHiVal=0 }

    memValue = ( memHiVal * 256 + memLoVal).toString(16).toUpperCase()

    return memValue;
  }

  // recursively examine malloc list. It doesn't test for proper end,
  // just maximum depth
  function getListElement(addrStrPrevPtr,maxFollow) {
    var addrStrNextPtr = (parseInt(addrStrPrevPtr,16)+2).toString(16).toUpperCase()
    var addrStrSizePtr = (parseInt(addrStrPrevPtr,16)+4).toString(16).toUpperCase()

    var curElemPrevPtr = readMem(addrStrPrevPtr)
    var curElemNextPtr = readMem(addrStrNextPtr)
    var curElemSizeHex = readMem(addrStrSizePtr)

    var curElemSizeNum = parseInt(curElemSizeHex,16)
    var curElemSizeDec = ((curElemSizeNum & ~1) / 2).toString()
    if (curElemSizeNum & 1) { var curElemAlloc = "(used)" }
    else                    { var curElemAlloc = "(free)" }
    

    var nxtElemPrevPtr = readMem(curElemNextPtr)

    var tailStr = ""
    if (maxFollow>0) { tailStr = getListElement(curElemNextPtr,maxFollow-1) }
    return "Prev(0x" + addrStrPrevPtr + "): 0x" + curElemPrevPtr + "<br>" +
           "Next(0x" + addrStrNextPtr + "): 0x" + curElemNextPtr + "&lt;-&gt;" +
           "Prev(0x" + curElemNextPtr + "): 0x" + nxtElemPrevPtr + "<br>" +
           "Size(0x" + addrStrSizePtr + "): 0x" + curElemSizeHex + ": " + curElemSizeDec + "bytes " + curElemAlloc    + "<br>" +
           "<br>" + 
           tailStr
  }

  function printMallocInfo() {

    myStr = ""

    listStart= readMem("2400")
    myStr += "List start:  0x" + listStart+"<br>"

    listSize = readMem("2402")
    myStr += "List maxmem: 0x" + listSize +"<br>"

    listInit = readMem("2404")
    myStr += "List init:   0x" + listInit +"<br>"

    myStr += "<br>"

    eloc = document.getElementById('mc-list')
    if (eloc) {
      eloc.innerHTML = myStr
    }

    if ((listStart != "0" ) && (listInit == "0")) {
      eloc.innerHTML +=  getListElement(listStart,10)
    } else {
      eloc.innerHTML += "Waiting for list to be initialized"
    }
  } 


  // Add redraw on DOM change event and prevent race conditions
  var mcListTimeout = null;
  document.addEventListener("DOMSubtreeModified", function() {
    if(mcListTimeout) {
        clearTimeout(mcListTimeout);
    }
    mcListTimeout = setTimeout(printMallocInfo, 500);
  }, false);
