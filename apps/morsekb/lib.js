// Morse Keyboard for Bangle.js
// Touch-based 4-button Morse input

exports.input = function(options) {
  g.clear();

  // -------------------- MORSE TABLE --------------------
  const MORSE = {
    ".-":"A", "-...":"B", "-.-.":"C", "-..":"D", ".":"E",
    "..-.":"F", "--.":"G", "....":"H", "..":"I", ".---":"J",
    "-.-":"K", ".-..":"L", "--":"M", "-.":"N", "---":"O",
    ".--.":"P", "--.-":"Q", ".-.":"R", "...":"S", "-":"T",
    "..-":"U", "...-":"V", ".--":"W", "-..-":"X", "-.--":"Y",
    "--..":"Z",
    "-----":"0", ".----":"1", "..---":"2", "...--":"3",
    "....-":"4", ".....":"5", "-....":"6", "--...":"7",
    "---..":"8", "----.":"9"
  };

  // -------------------- STATE --------------------
  let currentSignals = "";   // ".-" etc
  let outputText = "";
  let pauseCount = 0;
  let resolver;

  // -------------------- BUTTON LAYOUT --------------------
  const W = g.getWidth();
  const H = g.getHeight();
  const BW = W/2;
  const BH = H/2;

  const buttons = {
    dot  : {x:0,   y:0,  w:BW, h:BH, label:""},
    dash : {x:BW,  y:0,  w:BW, h:BH, label:""},
    ret  : {x:0,   y:BH, w:BW, h:BH, label:""},
    del  : {x:BW,  y:BH, w:BW, h:BH, label:""}
  };

  // -------------------- UI DRAWING --------------------

  function drawUI() {
    g.clear();
    g.setFont("6x8", 2);
    g.drawString("Text:" + outputText.slice(-20), 10, BH);
    g.setFont("6x8", 2);
    g.drawString(".", 2, 2);
    g.drawString("-", W-8, 2);
    g.drawString("ret", 2, H-20);
    g.drawString("del", W-40, H-20);

    g.setFont("6x8", 2);
    g.drawString("Morse: " + currentSignals, 10, BH+40);
  }

  // -------------------- INPUT HANDLING --------------------
  function addSignal(s) {
    currentSignals += s;
    pauseCount = 0;
    Bangle.buzz(30);
    drawUI();
  }

  function commitCharacter() {
    if (!currentSignals) return;
    let ch = MORSE[currentSignals] || "?";
    outputText += ch;
    currentSignals = "";
    drawUI();
  }

  function deletePressed() {
    if (currentSignals.length) {
      currentSignals = currentSignals.slice(0, -1);
    } else if (outputText.length) {
      outputText = outputText.slice(0, -1);
    }
    Bangle.buzz(50);
    drawUI();
  }

  function pausePressed() {
    pauseCount++;
    if (pauseCount === 1) {
      commitCharacter();
    } else if (pauseCount === 3) {
      outputText += " ";
      pauseCount = 0;
    }
    Bangle.buzz(20);
    drawUI();
  }

  function exitMenu() {
    Bangle.setUI("touch");
    drawUI();
  }

  function openSpecialMenu() {
    E.showMenu({
      "" : { title : "Special" },
      "." : () => {addChar("."); exitMenu();},
      "," : () => {addChar(","); exitMenu();},
      "?" : () => {addChar("?"); exitMenu();},
      "!" : () => {addChar("!"); exitMenu();},
      "-" : () => {addChar("-"); exitMenu();},
      "< Back" : () => exitMenu()
    });
  }

  function cleanup() {
    Bangle.setUI();
    Bangle.removeListener("swipe", onSwipe);
    Bangle.removeListener("touch", onTouch);
    g.clearRect(Bangle.appRect);
  }

  function addChar(c) {
    outputText += c;
    drawUI();
  }

  function onSwipe(lr, ud) {
    if (lr === 1) {        // DONE
      commitCharacter();
      cleanup();
      resolver(outputText);
    } else if (lr === -1) { // CANCEL
      cleanup();
      resolver(undefined);
    }
    if (ud === 1) {
      openSpecialMenu();
    }
  }

  // -------------------- TOUCH DISPATCH --------------------
  function onTouch(_, xy) {
    let x = xy.x, y = xy.y;
    for (let k in buttons) {
      let b = buttons[k];
      if (x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h) {
        if (k==="dot") addSignal(".");
        else if (k==="dash") addSignal("-");
        else if (k==="ret") pausePressed();
        else if (k==="del") deletePressed();
        return;
      }
    }
  };

  return new Promise(resolve => {
    g.clearRect(Bangle.appRect);
    g.clear();
    resolver = resolve;

    // Listen for swipe right to finish
    if (Bangle.prependListener) {
      Bangle.prependListener('swipe', onSwipe);
      Bangle.prependListener('touch', onTouch);
    } 
    else {
      Bangle.on('swipe', onSwipe);
      Bangle.on("touch", onTouch);
    }

  });
};