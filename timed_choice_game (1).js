const STORY = {
  title: "Hospital Infiltration",
  startScene: "hospitalHallway",
  scenes: {
    hospitalHallway: {
      title: "The Hallway",
      text: "That night, he finally sneaks into the hospital, moving through the hallways like a shadow, almost like he's been there before. As he gets deeper inside, something starts to feel wrong. The place pulls at him. His focus slips for a second, like the building is dragging up troubled memories he can't fully understand.\n\nThen he spots a nurse walking straight toward him. He's close now. If he gets caught here, it's over.",
      timeLimit: 5,
      timeoutChoice: 2,
      choices: [
        {
          label: "Throw a glass jar on the floor to create a distraction.",
          result: "The jar shatters somewhere down the hall. The nurse turns toward the sound, giving him the opening he needs.",
          nextScene: "success"
        },
        {
          label: "Knock over a trash can to make noise.",
          result: "The crash echoes through the hallway. Messy, but effective. The nurse moves to investigate, and he slips past undetected.",
          nextScene: "success"
        },
        {
          label: "Hide behind a corner and wait for the nurse to pass by.",
          result: "He presses himself against the wall and waits, but the pause costs him. The nurse notices movement and starts heading straight for him.",
          nextScene: "failure"
        }
      ]
    },
    success: {
      title: "Undetected",
      text: "He makes it past without being seen and keeps moving deeper into the hospital.",
      choices: [
        {
          label: "Continue",
          result: "He disappears deeper into the building.",
          nextScene: "END"
        }
      ]
    },
    failure: {
      title: "Caught",
      text: "The nurse sees him before he can recover. Whatever comes next, the quiet approach is over.",
      choices: [
        {
          label: "Continue",
          result: "The situation slips out of his control.",
          nextScene: "END"
        }
      ]
    }
  },
  endings: {
    success: {
      title: "Outcome: Undetected",
      text: "He gets past the nurse and continues deeper into the hospital without raising immediate alarm."
    },
    failure: {
      title: "Outcome: Caught",
      text: "He hesitates, gets spotted, and loses the advantage he had the second he entered the hallway."
    }
  }
};

class TimedChoiceGame {
  constructor(story, rootSelector = "#game") {
    this.story = story;
    this.root = document.querySelector(rootSelector) || this.createRoot(rootSelector);
    this.currentScene = story.startScene;
    this.finalOutcome = null;
    this.timer = null;
    this.timeRemaining = 0;
    this.timeLimit = 0;
    this.ui = {};
  }

  createRoot(selector) {
    const root = document.createElement("div");
    root.id = selector.replace("#", "") || "game";
    document.body.appendChild(root);
    return root;
  }

  init() {
    this.injectStyles();
    this.buildUI();
    this.renderScene();
  }

  buildUI() {
    this.root.innerHTML = `
      <div class="game-wrap">
        <div class="game-header">
          <h1>${this.story.title}</h1>
          <button id="restart-button">Restart</button>
        </div>

        <div class="game-card">
          <div id="scene-title" class="scene-title"></div>
          <div id="scene-text" class="scene-text"></div>

          <div id="timer-section">
            <div class="timer-row">
              <span>Time left</span>
              <span id="time-value">0.0s</span>
            </div>
            <div class="timer-bar">
              <div id="timer-fill" class="timer-fill"></div>
            </div>
          </div>

          <div id="result-text" class="result-text"></div>
          <div id="choices" class="choices"></div>
        </div>

        <div class="game-card">
          <h2>History</h2>
          <ul id="history" class="history"></ul>
        </div>
      </div>
    `;

    this.ui.sceneTitle = document.getElementById("scene-title");
    this.ui.sceneText = document.getElementById("scene-text");
    this.ui.timerSection = document.getElementById("timer-section");
    this.ui.timeValue = document.getElementById("time-value");
    this.ui.timerFill = document.getElementById("timer-fill");
    this.ui.resultText = document.getElementById("result-text");
    this.ui.choices = document.getElementById("choices");
    this.ui.history = document.getElementById("history");

    document.getElementById("restart-button").addEventListener("click", () => this.restart());
  }

  renderScene() {
    const scene = this.story.scenes[this.currentScene];
    if (!scene) {
      return;
    }

    this.ui.sceneTitle.textContent = scene.title || "";
    this.ui.sceneText.textContent = scene.text || "";
    this.ui.resultText.textContent = "";
    this.ui.choices.innerHTML = "";

    const hasTimer = typeof scene.timeLimit === "number";
    this.ui.timerSection.style.display = hasTimer ? "block" : "none";

    scene.choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.className = "choice-button";
      button.textContent = choice.label;
      button.addEventListener("click", () => this.selectChoice(index, false));
      this.ui.choices.appendChild(button);
    });

    if (hasTimer) {
      this.startTimer(scene.timeLimit);
    }
  }

  selectChoice(choiceIndex, timedOut) {
    const scene = this.story.scenes[this.currentScene];
    const choice = scene?.choices?.[choiceIndex];
    if (!choice) {
      return;
    }

    this.stopTimer();
    this.disableChoices();
    this.ui.resultText.textContent = timedOut
      ? `Time ran out. ${choice.result}`
      : choice.result || "";

    this.addHistory(
      timedOut
        ? `[Timeout] ${scene.title}: ${choice.label}`
        : `${scene.title}: ${choice.label}`
    );

    if (choice.nextScene === "success" || choice.nextScene === "failure") {
      this.finalOutcome = choice.nextScene;
    }

    setTimeout(() => {
      if (choice.nextScene === "END") {
        this.showEnding();
      } else {
        this.currentScene = choice.nextScene;
        this.renderScene();
      }
    }, 500);
  }

  startTimer(seconds) {
    this.stopTimer();
    this.timeLimit = seconds;
    this.timeRemaining = seconds;
    this.updateTimer();

    this.timer = setInterval(() => {
      this.timeRemaining = Math.max(0, this.timeRemaining - 0.1);
      this.updateTimer();

      if (this.timeRemaining <= 0) {
        this.stopTimer();
        this.handleTimeout();
      }
    }, 100);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  handleTimeout() {
    const scene = this.story.scenes[this.currentScene];
    const fallbackChoice = Number.isInteger(scene.timeoutChoice) ? scene.timeoutChoice : 0;
    this.selectChoice(fallbackChoice, true);
  }

  updateTimer() {
    const percent = this.timeLimit > 0 ? (this.timeRemaining / this.timeLimit) * 100 : 0;
    this.ui.timeValue.textContent = `${this.timeRemaining.toFixed(1)}s`;
    this.ui.timerFill.style.width = `${percent}%`;
  }

  disableChoices() {
    this.ui.choices.querySelectorAll("button").forEach(button => {
      button.disabled = true;
    });
  }

  addHistory(text) {
    const item = document.createElement("li");
    item.textContent = text;
    this.ui.history.appendChild(item);
  }

  showEnding() {
    const ending = this.story.endings[this.finalOutcome] || {
      title: "Ending",
      text: "No ending found."
    };

    this.ui.timerSection.style.display = "none";
    this.ui.choices.innerHTML = "";
    this.ui.sceneTitle.textContent = ending.title;
    this.ui.sceneText.textContent = ending.text;
    this.ui.resultText.textContent = "";
    this.addHistory(`Ending reached: ${ending.title}`);

    // After showing ending, go to next scene
    setTimeout(() => {
      goTo('scene-story4');
    }, 3000);
  }

  restart() {
    this.stopTimer();
    this.currentScene = this.story.startScene;
    this.finalOutcome = null;
    this.ui.history.innerHTML = "";
    this.renderScene();
  }

  injectStyles() {
    if (document.getElementById("timed-choice-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "timed-choice-styles";
    style.textContent = `
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: 'Cormorant Garamond', serif;
        background: #000;
        color: #e8e2d9;
      }
      .game-wrap {
        max-width: 600px;
        margin: 0 auto;
        padding: 80px 20px;
        text-align: center;
      }
      .game-header {
        margin-bottom: 40px;
      }
      .game-card {
        margin-bottom: 40px;
      }
      .scene-title {
        font-size: 18px;
        font-weight: 300;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: #9a9189;
        margin-bottom: 24px;
      }
      .scene-text {
        white-space: pre-line;
        line-height: 1.6;
        margin-bottom: 32px;
        font-size: 16px;
        color: #e8e2d9;
      }
      .timer-row {
        margin-bottom: 16px;
      }
      .timer-bar {
        width: 100%;
        height: 4px;
        background: #9a9189;
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 16px;
      }
      .timer-fill {
        width: 100%;
        height: 100%;
        background: #c8b89a;
        transition: width 0.1s linear;
      }
      .result-text {
        min-height: 24px;
        margin-bottom: 24px;
        color: #9a9189;
        font-style: italic;
      }
      .choices {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 32px;
      }
      .choice-button,
      #restart-button {
        border: none;
        border-radius: 0;
        padding: 16px;
        font-size: 16px;
        font-family: 'Cormorant Garamond', serif;
        background: transparent;
        color: #e8e2d9;
        border: 1px solid #9a9189;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      .choice-button:hover {
        background: #9a9189;
        color: #000;
      }
      .choice-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      #restart-button {
        background: #c8b89a;
        color: #000;
        border: 1px solid #c8b89a;
        margin-top: 40px;
      }
      #restart-button:hover {
        background: #e8e2d9;
        border-color: #e8e2d9;
      }
      .history {
        margin: 40px 0 0;
        padding-left: 0;
        text-align: left;
        font-size: 14px;
        color: #9a9189;
      }
    `;

    document.head.appendChild(style);
  }
}