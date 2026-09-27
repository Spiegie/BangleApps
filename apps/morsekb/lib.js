// Morse Keyboard for Bangle.js
// Touch-based 4-button Morse input

exports.input = function(options) {
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
  let currentSignals = "";
  let outputText = "";
  let pauseCount = 0;
  let resolver;
  let swipeListener = null;

  // -------------------- BUTTON LAYOUT --------------------
  const W = g.getWidth();
  const H = g.getHeight();
  const BW = W/2;
  const BH = H/2;

  const buttons = {
    dot  : {x:0,   y:0,  w:BW, h:BH},
    dash : {x:BW,  y:0,  w:BW, h:BH},
    ret  : {x:0,   y:BH, w:BW, h:BH},
    del  : {x:BW,  y:BH, w:BW, h:BH}
  };

  // -------------------- UI DRAWING --------------------
  function drawUI() {
    g.clear();
    g.setFont("6x8", 2);
    g.drawString("Text:" + outputText.slice(-20), 10, BH);
    g.drawString(".", 2, 2);
    g.drawString("-", W-8, 2);
    g.drawString("ret", 2, H-20);
    g.drawString("del", W-40, H-20);
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

  function addChar(c) {
    outputText += c;
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

  function handleTouch(x, y) {
    for (let k in buttons) {
      let b = buttons[k];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        if (k === "dot") addSignal(".");
        else if (k === "dash") addSignal("-");
        else if (k === "ret") pausePressed();
        else if (k === "del") deletePressed();
        return true;
      }
    }
    return false;
  }

  function handleSwipe(lr, ud) {
    if (lr === 1) {
      // Swipe right - DONE
      commitCharacter();
      cleanup();
      resolver(outputText);
    } else if (lr === -1) {
      // Swipe left - CANCEL
      cleanup();
      resolver(undefined);
    }
    if (ud === 1) {
      // Swipe up - Special menu
      openSpecialMenu();
    }
  }

  function cleanup() {
    Bangle.setUI();
    if (swipeListener) {
      Bangle.removeListener('swipe', swipeListener);
      swipeListener = null;
    }
    g.clearRect(Bangle.appRect);
  }

  return new Promise((resolve, reject) => {
    resolver = resolve;

    // Setup swipe listener for newer firmwares
    if (Bangle.prependListener) {
      swipeListener = handleSwipe;
      Bangle.prependListener('swipe', swipeListener);
    } else {
      // For older firmwares, use drag events as fallback
      Bangle.on('swipe', handleSwipe);
    }

    // Intercept swipes to prevent propagation
    let catchSwipe = () => {
      E.stopEventPropagation && E.stopEventPropagation();
    };
    Bangle.prependListener && Bangle.prependListener('swipe', catchSwipe);

    Bangle.setUI({
      mode: "custom",
      touch: (_, xy) => {
        handleTouch(xy.x, xy.y);
      },
      drag: (e) => {
        // Fallback drag-based swipe detection for older firmwares
        if (e.x > 30) {
          // Drag right
          handleSwipe(1, 0);
        } else if (e.x < -30) {
          // Drag left
          handleSwipe(-1, 0);
        }
        if (e.y > 1) {
          // Drag up
          handleSwipe(0, 1);
        }
      },
      back: () => {
        cleanup();
      }
    });

    g.clearRect(Bangle.appRect);
    drawUI();
  });
}
