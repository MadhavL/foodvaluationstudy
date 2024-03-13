// By Evan Kirkiles
// January 11, 2022
// Levy Decision Neuroscience Lab @ Yale University

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

// prettier-ignore
var ROOM_SYMBOLS = [
  'ༀ',  '༁',  '༂',  '༃',  '༄',  '༅',  '༆',  '༇',  '༈',  '༉', '༊',  '།',  '༎',
  '༏',  '༐',  '༑',  '༒', '༓',  '༔',  '༕',  '༖',  '༗',  '༠',  '༡',  '༢',  '༣',  '༤',
  '༥',  '༦',  '༧',  '༨',  '༩',  '༪',  '༫',  '༬',  '༭',  '༮', '༯',  '༰',  '༱',  '༲',
  '༳',  '༴',  '༵',  '༶',  '༷',  '༸	༹',  '༺',  '༻',  '༼',  '༽',  'ཀ',  'ཁ',  'ག',
  'གྷ',  'ང', 'ཅ',  'ཆ',  'ཇ',  'ཉ',  'ཊ',  'ཋ',  'ཌ',  'ཌྷ',  'ཎ',  'ཏ',  'ཐ',  'ད',
  'དྷ',  'ན',  'པ',  'ཕ',  'བ',  'བྷ',  'མ',  'ཙ',  'ཚ',  'ཛ',  'ཛྷ',  'ཝ',  'ཞ',  'ཟ',
  'འ',  'ཡ',  'ར',  'ལ',  'ཤ',  'ཥ',  'ས',  'ཧ',  'ཨ',  'ཀྵ',  'ཪ',  'ཫ',  'ཬ', 'ྈ',
  'ྉ', 'ྊ', 'ྋ', 'ྌ',  '྾',  '྿',  '࿀',  '࿂',  '࿃',  '࿄',  '࿅',  '࿆',  '࿇',  '࿈',
  '࿉',  '࿊',  '࿋',  '࿌',  '࿎',  '࿏',  '࿐',  '࿑',  '࿒',  '࿓',  '࿔',  '࿙'];

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

// delay function
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Normal variate using Box-Muller transform.
function randn_bm(mean, std) {
  var u = 0,
    v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return (
    mean + Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * std
  );
}

/* -------------------------------------------------------------------------- */
/*                        REWARD DISTRIBUTION FUNCTIONS                       */
/* -------------------------------------------------------------------------- */

// simple normal distribution
class NormalDistribution {
  constructor(mean = 20, std = 5, tShift = 0, i = 0, iShift = 0) {
    this.mean = mean;
    this.std = std;
    this.t = 0;
    this.i = i;
    this.iShift = iShift;
    this.tShift = tShift;
  }

  // samples from the distribution
  sample() {
    const rew = Math.ceil(
      randn_bm(
        this.mean + this.t * this.tShift + this.i * this.iShift,
        this.std
      )
    );
    this.t += 1;
    return rew;
  }

  // concise summary of the reward distribution
  summary() {
    let iShiftT =
      this.iShift !== 0
        ? ` ${this.iShift > 0 ? "+" : "-"} ${this.i}*${Math.abs(this.iShift)}`
        : "";
    let tShiftT =
      this.tShift !== 0
        ? ` ${this.tShift > 0 ? "+" : "-"} ${this.t}*${Math.abs(this.tShift)}`
        : "";
    return `N(${this.mean}${tShiftT}${iShiftT}, ${this.std})`;
  }
}

// bimodal distribution
class BimodalDistribution {
  constructor(mean1 = 20, std1 = 5, mean2 = -20, std2 = 5) {
    this.mean1 = mean1;
    this.std1 = std1;
    this.mean2 = mean2;
    this.std2 = std2;
  }

  sample() {
    if (Math.random() < 0.5) {
      return Math.ceil(randn_bm(this.mean1, this.std1));
    } else {
      return Math.ceil(randn_bm(this.mean2, this.std2));
    }
  }

  summary() {
    return `50% ~ N(${this.mean1}, ${this.std1}), 50% ~ N(${this.mean2}, ${this.std2})`;
  }
}

// singleton class which generates distributions
class DistributionGenerator {
  constructor(type) {
    this.type = type;
    this.i = -1;
    this.distrCache = this._getOnly();
    this.BoWconfig = {
      center: 30,
      maxMean: 30,
      minMean: 30,
    };
  }

  // initializes a distribution if it is not based on i
  _getOnly() {
    switch (this.type) {
      case "identical":
        return new NormalDistribution(20, 5);
      case "identical_neg":
        return new NormalDistribution(-20, 5);
      case "increasing_rewards":
        return new NormalDistribution(15, 5, 1);
      case "decreasing_rewards":
        return new NormalDistribution(100, 5, -1);
      case "bimodal":
        return new BimodalDistribution(20, 5, -20, 5);
      default:
        return undefined;
    }
  }

  // gets the i'th distribution
  getNext() {
    this.i += 1;
    switch (this.type) {
      case "increasing_means":
        return new NormalDistribution(15, 5, 0, this.i, 3.5);
      case "decreasing_means":
        return new NormalDistribution(20, 5, 0, this.i, -3.5);
      case "better_or_worse":
        const prob = Math.random();
        if (prob < 0.33) {
          return new NormalDistribution(this.BoWconfig.center, 5);
        } else if (prob < 0.66) {
          this.BoWconfig.maxMean += 5;
          return new NormalDistribution(this.BoWconfig.maxMean, 5);
        } else {
          this.BoWconfig.minMean -= 5;
          return new NormalDistribution(this.BoWconfig.minMean, 5);
        }
      default:
        return this.distrCache;
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                                   CLASSES                                  */
/* -------------------------------------------------------------------------- */

// Room class defines a room with a distribution and prior memory
class ExplorationRoom {
  constructor({ x_p, y_p, distribution, character, canvas, callbacks }) {
    this.x_p = x_p;
    this.y_p = y_p;
    this.character = character;
    this.rewards = [];
    this.callbacks = callbacks;
    this.removed = false;
    this.node = this._getHTMLNode();
    this.distribution = distribution;

    // add the node to the canvas
    canvas.append(this.node);
  }

  // builds the HTML for this room and return it
  _getHTMLNode() {
    let node = $(
      `<div class="ex-house" style="top: ${this.x_p * 100}%; left: ${
        this.y_p * 100
      }%;">${this.character}</div>`
    );
    node.on("mouseenter", this.callbacks.onMouseEnter);
    node.on("mouseleave", this.callbacks.onMouseExit);
    node.on("click", this.callbacks.onClick);
    return node[0];
  }

  // sample from this room and remember its reward
  sample() {
    let reward = this.distribution.sample();
    this.rewards.push(reward);
    return reward;
  }

  // summarizes the room for the data
  summary() {
    return {
      distr: this.distribution.summary(),
      rewards: [...this.rewards],
    };
  }

  // removes the room from the map and disables its pointer events
  async remove() {
    $(this.node).removeClass("ex-state-selected");
    $(this.node).addClass("disabled invisible");
    this.removed = true;
    await delay(300);
  }
}

// Exploration manager class
class ExplorationManager {
  // initialize HTML links and other properties
  constructor({ n, max_k, rows, cols, distribution }) {
    this.n = n;
    this.max_k = max_k;
    this.rows = rows;
    this.cols = cols;
    this.distributionManager = new DistributionGenerator(distribution);
    this.occupiedRooms = [];
    this.callbacks = {};
    this.disabled = true;
    this.total_reward = 0;
    this.rewardMap = new Array(rows)
      .fill(undefined)
      .map(() => new Array(cols).fill(undefined));

    // bind to the DOM
    this._bindToDOM();

    // shuffle the room symbols
    ROOM_SYMBOLS = _.shuffle(ROOM_SYMBOLS);

    // add a room, which automatically sets it
    this._addRoom();
  }

  // initializes HTML element references and listeners
  _bindToDOM() {
    this.html = {
      selector: $("#ex-Selector"),
      selectedRoom: $("#ex-SelectedRoom"),
      priorRewards: $("#ex-PriorRewards"),
      chooseReward: $("#ex-ChooseReward"),
      chooseNewRoom: $("#ex-ChooseNewRoom"),
      canvas: $("#jsPsychCANVAS")[0],
      rewardDisplay: $("#ex-RewardDisplay"),
      totalDisplay: $("#ex-TotalDisplay"),
    };
  }

  // adds a new random reward at a free space. returns the coordinates
  async _addRoom() {
    let coords = this._getFreeSpace();
    if (!coords) return undefined;
    const [x, y] = coords;
    // TODO: Update this to reflect distributions!
    this.rewardMap[x][y] = new ExplorationRoom({
      x_p: (1 + x) / (this.rows + 1),
      y_p: (1 + y) / (this.cols + 1),
      character: ROOM_SYMBOLS[x * this.cols + y],
      canvas: this.html.canvas,
      distribution: this.distributionManager.getNext(),
      callbacks: {
        onMouseEnter: () => {
          this.viewedRoom = [x, y];
          if (this.selectedRoom[0] != x || this.selectedRoom[1] != y) {
            this._updateViewedRoom();
          }
        },
        onMouseExit: () => {
          this.viewedRoom = this.selectedRoom;
          if (this.selectedRoom[0] != x || this.selectedRoom[1] != y) {
            this._updateViewedRoom();
          }
        },
        onClick: () => {
          this._setSelectedNode(x, y);
        },
      },
    });
    this._setSelectedNode(x, y);
    this._updateViewedRoom();
    return await new Promise((res) => {
      setTimeout(() => res([x, y]), 300);
    });
  }

  // removes a room at the specified coordinates. doesn't actually delete
  // it, just updates some variables
  _removeRoom({ x, y }) {
    if (!this.rewardMap[x][y]) return;
    this.rewardMap[x][y].remove();
  }

  // sets the new selected node
  _setSelectedNode(x, y) {
    if (this.selectedRoom) {
      const [old_x, old_y] = this.selectedRoom;
      let currSelectedNode = this.rewardMap[old_x][old_y].node;
      $(currSelectedNode).removeClass("ex-state-selected");
    }
    this.selectedRoom = [x, y];
    let newSelectedNode = this.rewardMap[x][y].node;
    $(newSelectedNode).addClass("ex-state-selected");
    this.viewedRoom = [x, y];
    this._updateSelectedRoom();
  }

  // gets the coordinates of a random free space on the map
  _getFreeSpace() {
    let freeSpaces = [];
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        if (!this.rewardMap[i][j]) {
          freeSpaces.push([i, j]);
        }
      }
    }
    if (freeSpaces.length == 0) return undefined;
    return freeSpaces[Math.floor(Math.random() * freeSpaces.length)];
  }

  // gets the coordinates of a random room on the map
  _getAvailableRooms() {
    let occupiedRooms = [];
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        if (this.rewardMap[i][j] && !this.rewardMap[i][j].removed) {
          occupiedRooms.push([i, j]);
        }
      }
    }
    return occupiedRooms;
  }

  // summarizes the rooms left on a map
  _summarizeRooms() {
    let occupiedRooms = [];
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        if (this.rewardMap[i][j] && !this.rewardMap[i][j].removed) {
          occupiedRooms.push({
            pos: [i, j],
            ...this.rewardMap[i][j].summary(),
          });
        }
      }
    }
    return occupiedRooms;
  }

  // resets the selector
  async _resetSelector() {
    this.html.selector.css("opacity", "0");
    await this._updateViewedRoom();
  }

  // sets the viewing information
  async _updateViewedRoom() {
    const [x, y] = this.viewedRoom;
    this.html.priorRewards.empty();
    if (!this.rewardMap[x][y].removed) {
      if (!this.disabled) {
        this._setChooseRewardDisabled(false);
      }
      this.html.selectedRoom.css("opacity", "1");
      this.html.selectedRoom.text(this.rewardMap[x][y].character);
      if (this.rewardMap[x][y].rewards.length == 0) {
        this.html.priorRewards.append($("<div>None</div>"));
      } else {
        this.rewardMap[x][y].rewards.forEach((reward) => {
          const priorReward = $("<div>", {
            class: "ex-prior-reward",
            text: reward.toString(),
          });
          this.html.priorRewards.append(priorReward);
        });
      }
    } else {
      this._setChooseRewardDisabled(true);
      this.html.selectedRoom.css("opacity", "0");
    }
    await delay(200);
  }

  // moves the selector icon
  async _updateSelectedRoom() {
    this.html.selector.css("opacity", "1");
    this.html.selector.css(
      "top",
      `${(100 * (1 + this.selectedRoom[0])) / (this.rows + 1)}%`
    );
    this.html.selector.css(
      "left",
      `${(100 * (1 + this.selectedRoom[1])) / (this.cols + 1)}%`
    );
    await delay(300);
  }

  // sets whether pointer events are allowed or not
  _setDisabled(disabled) {
    this.disabled = disabled;
    this._setChooseRewardDisabled(disabled);
    if (disabled) {
      $(this.html.canvas).addClass("disabled");
      this.html.chooseNewRoom.addClass("disabled");
    } else {
      $(this.html.canvas).removeClass("disabled");
      this.html.chooseNewRoom.removeClass("disabled");
    }
  }

  // sets whether input buttons are allowed or not
  _setChooseRewardDisabled(disabled) {
    if (!disabled && this.viewedRoom) {
      const [x, y] = this.viewedRoom;
      if (!this.rewardMap[x][y].removed) {
        this.html.chooseReward.removeClass("disabled");
      } else {
        this.html.chooseReward.addClass("disabled");
      }
    } else {
      this.html.chooseReward.addClass("disabled");
    }
  }

  // runs the "reward" animation
  async _displayReward(reward) {
    this.html.selector.removeClass("pulse");
    this.html.rewardDisplay.text(`Reward: ${reward}`);
    this.html.rewardDisplay.removeClass("invisible");
    await delay(800);
    this.total_reward += reward;
    this.html.totalDisplay.text(this.total_reward.toString());
    this.html.rewardDisplay.addClass("invisible");
    this.html.selector.addClass("pulse");
    await delay(300);
    this.html.rewardDisplay.text(``);
  }

  // waits for a choice to be made, resolving with the x/y coords of the choice
  // and the reward.
  async CHOICE() {
    return new Promise((resolve) => {
      // allow pointer events on the container
      this._setDisabled(false);
      // begin timer
      const startTime = new Date();
      const rooms = this._summarizeRooms();

      // function to remove listeners
      const removeListeners = () => {
        this._setDisabled(true);
        this.html.chooseReward.unbind("click");
        this.html.chooseNewRoom.unbind("click");
      };

      // function to resolve
      const selectChoice = async (explored, rt) => {
        const [x, y] = this.selectedRoom;
        const summary = this.rewardMap[x][y].summary();
        let reward = this.rewardMap[x][y].sample();
        await this._displayReward(reward);
        await this._updateViewedRoom();
        resolve({
          x: x,
          y: y,
          rt: rt,
          summary: summary,
          reward: reward,
          explored: explored,
          rooms: rooms,
        });
      };

      // wait for click on the options
      this.html.chooseReward.on("click", async () => {
        const [x, y] = this.selectedRoom;
        if (this.rewardMap[x][y].removed) return;
        removeListeners();
        const rt = (new Date() - startTime) / 1000;
        selectChoice(false, rt);
      });
      this.html.chooseNewRoom.on("click", async () => {
        removeListeners();
        const rt = (new Date() - startTime) / 1000;
        await this._addRoom();
        await delay(100);
        selectChoice(true, rt);
      });
    });
  }

  // randomly removes a room based on the current rooms available. returns
  // true if a room was removed.
  async REMOVEROOM() {
    // get the available rooms
    const availableRooms = this._getAvailableRooms();
    // if no rooms left, instantly return
    if (availableRooms.length == 0) return false;
    // randomly sample a single room from the available rooms
    const [x, y] =
      availableRooms[Math.floor(Math.random() * availableRooms.length)];
    // construct probability of removal based on number of current rooms
    const removeProbability = (availableRooms.length - 1) / this.max_k;
    // now run the probability sample
    if (Math.random() < removeProbability) {
      // REMOVE THE ROOM
      await this.rewardMap[x][y].remove();
      // if that was the currently selected room, hide the selector
      if (this.selectedRoom[0] == x && this.selectedRoom[1] == y) {
        this._resetSelector();
        this._setChooseRewardDisabled(true);
      }
      return { pos: [x, y], ...this.rewardMap[x][y].summary() };
    } else {
      // otherwise do nothing
      return undefined;
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                              PLUGIN DEFINITION                             */
/* -------------------------------------------------------------------------- */

var levyLabExploration = (function (jsPsych) {
  "use strict";

  const info = {
    name: "plugin-exploration-block",
    description: "Exploration experiment for Levy Decision Lab.",
    parameters: {
      callbacks: {
        type: jsPsych.ParameterType.OBJECT,
        array: false,
        pretty_name: "Callbacks",
        default: {},
        description:
          "Callbacks: saveTrialData saves a single trial in the block",
      },
      n: {
        type: jsPsych.ParameterType.INT,
        pretty_name: "n",
        default: 10,
        description: "How many trials will be run?",
      },
      max_k: {
        type: jsPsych.ParameterType.INT,
        pretty_name: "Maximum Available Rooms",
        default: 7,
        description: "Maximum number of available rooms?",
      },
      rows: {
        type: jsPsych.ParameterType.INT,
        pretty_name: "Rows",
        default: 10,
        description: "How many rows in the map?",
      },
      cols: {
        type: jsPsych.ParameterType.INT,
        pretty_name: "Columns",
        default: 10,
        description: "How many columns in the map?",
      },
      distribution: {
        type: jsPsych.ParameterType.SELECT,
        pretty_name: "Reward Distribution",
        options: [
          "identical",
          "identical_neg",
          "increasing_means",
          "decreasing_means",
          "increasing_rewards",
          "decreasing_rewards",
          "bimodal",
          "better_or_worse",
        ],
        default: "identical",
        description: "The distribution for choosing rewards.",
      },
    },
  };

  class LevyLabExplorationPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    async trial(display_element, trial) {
      const trial_data = {
        data: [],
        n: trial.n,
        max_k: trial.max_k,
        rows: trial.rows,
        cols: trial.cols,
        distribution: trial.distribution
      };

      // Build the display structure
      display_element.innerHTML = `
        <div class="ex-container">
          <div id="jsPsychCANVAS" style="background-size: ${
            100 / (trial.cols + 1)
          }% ${100 / (trial.rows + 1)}%" class="disabled">
            <div id="ex-Selector" class="ex-selector pulse" style="top: 50%; left: 50%; opacity: 0;"></div>
            <div id="ex-RewardDisplay" class="ex-rewardDisplay invisible">HI</div>
          </div>
          <div class="ex-control-container">
            <div class="ex-mini-canvas">
              <div class="ex-selected-room float" id="ex-SelectedRoom">a</div>
            </div>
            <div class="ex-button-row">
              <div class="ex-button disabled" id="ex-ChooseReward">Choose This Room</div>
              <div class="ex-button disabled" id="ex-ChooseNewRoom">Explore New Room</div>
            </div>
            <div class="ex-prior-reward-row">
              <div>Prior Rewards:</div>
              <div class="ex-prior-row-container">
                <div class="ex-prior-row" id="ex-PriorRewards" style="flex: 1;"></div>
              </div>
            </div>
          </div>
          <div class="ex-total-display">
            <div class="ex-total-inner">
              TOTAL: <span id="ex-TotalDisplay">0</span>
            </div>
          </div>
        </div>`;

      // Construct the manager class, which reads in the above HTML
      const explorationManager = new ExplorationManager(trial);

      /* --------------------------- EXECUTION DESK --------------------------- */

      // determine how to execute the block
      const execute = async () => {
        // iterate for the number of trials
        for (let i = 0; i < trial.n; i++) {
          // get the user's choice
          const choice = await explorationManager.CHOICE();
          const removed = await explorationManager.REMOVEROOM();
          // build the trial data item
          const data = {
            blockTrialN: i + 1,
            blockType: trial.distribution,
            absTime: new Date(),
            RT: choice.rt,
            actionType: choice.explored ? "EXPLORE" : "CHOICE",
            reward: choice.reward,
            chosenRoom: { pos: [choice.x, choice.y], ...choice.summary },
            chosenRoomT: choice.summary.rewards.length,
            removedRoom: removed,
            allRooms: choice.rooms,
          };
          // add to the trial data
          trial_data.data.push({
            time: Date.now(),
            cues: data
          });
          // pass the trial data back to the handler, if specified
          if (trial.callbacks["saveTrialData"]) {
            trial.callbacks["saveTrialData"](data);
          }
        }
        // finish the trial once done
        this.jsPsych.finishTrial(trial_data);
      };
      execute(); // <--- RUNS THE PLUGIN
    }
  }

  LevyLabExplorationPlugin.info = info;
  return LevyLabExplorationPlugin;
})(jsPsychModule);
