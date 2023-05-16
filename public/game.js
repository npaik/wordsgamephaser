// create a new scene
let gameScene = new Phaser.Scene("Game");

// set the configuration of the game
let config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: gameScene,
};

// create a new game, pass the configuration
let game = new Phaser.Game(config);

// initialize variables
let timer;
let planets;
let scoreText;
let highestScoreText;
let score = 0;
let planetsRemoved = 0;
let gameTimeLimit = 30;
let scoreFactor = 1;
let typedWord = "";
let timerEventAdded = false;
let gameStarted = false;
let gameOver = false;
let typedWordText;
let scoreSaved = false;
let gameOverDisplayed = false;
let top10ScoresDisplayed = false;

// Load assets
gameScene.preload = function () {
  // load images
  this.load.image("background", "assets/background.png");
  this.load.image("sun", "assets/sun.png");
  this.load.image("mercury", "assets/mercury.png");
  this.load.image("venus", "assets/venus.png");
  this.load.image("earth", "assets/earth.png");
  this.load.image("mars", "assets/mars.png");
  this.load.image("jupiter", "assets/jupiter.png");
  this.load.image("saturn", "assets/saturn.png");
  this.load.image("uranus", "assets/uranus.png");
  this.load.image("neptune", "assets/neptune.png");
  this.load.image("meteorite", "assets/meteorite.png");
  this.load.image("satellite", "assets/satellite.png");
  this.load.image("startButton", "assets/startButton.png");
};

// called once after the preload ends
gameScene.create = function () {
  const offscreenInput = document.getElementById("offscreen-input");
  offscreenInput.addEventListener("input", (event) => {
    typedWord = event.target.value;
    typedWordText.setText(typedWord);
  });

  offscreenInput.addEventListener("focus", () => {
    if (!gameStarted) {
      offscreenInput.blur();
    }
  });

  highestScoreText = this.add.text(
    this.sys.game.config.width / 2,
    0,
    "Highest Score: 0"
  );
  highestScoreText.setOrigin(0.5, 0);

  getHighestScore.call(this);

  // create bg sprite
  this.add
    .sprite(0, 0, "background")
    .setPosition(
      this.sys.game.config.width / 2,
      this.sys.game.config.height / 2
    );
  scoreText = this.add.text(0, 0, "Score: 0");
  timer = this.add.text(700, 0, `Timer: ${gameTimeLimit}`);
  timer.depth = 1;
  typedWordText = this.add.text(400, 480, "");
  typedWordText.setOrigin(0.5);

  // create satellite
  let satellite = this.add
    .sprite(0, 0, "satellite")
    .setScale(5)
    .setAngle(320)
    .setPosition(400, 550);

  // create meteorite
  let meteorite = this.add
    .sprite(0, 0, "meteorite")
    .setScale(2)
    .setAngle(220)
    .setPosition(400, 430);
  meteorite.visible = false;

  planets = this.add.group();

  // create start button
  const startButton = this.add
    .sprite(
      this.sys.game.config.width / 2,
      this.sys.game.config.height / 2,
      "startButton"
    )
    .setInteractive();

  startButton.once("pointerdown", () => {
    gameStarted = true;
    startButton.setVisible(false);

    offscreenInput.focus();

    if (!timerEventAdded) {
      this.time.addEvent({
        delay: 1000,
        callback: updateTimer,
        callbackScope: this,
        loop: true,
      });
      timerEventAdded = true;
    }
    spawnPlanets.call(this);
  });

  function handleKeyboardInput(event) {
    if (!gameOver && gameStarted) {
      if (event.key === "Enter") {
        checkWord.call(this);
      } else if (event.key === "Backspace") {
        typedWord = typedWord.slice(0, -1);
      } else if (event.key === " ") {
        typedWord += " ";
      } else if (event.key.length === 1 && event.key.match(/[a-zA-Z]/)) {
        typedWord += event.key;
      }
      typedWordText.setText(typedWord);
    }
  }

  window.addEventListener("keydown", handleKeyboardInput.bind(this));

  // check if the typed word matches any of the words in the planets
  function checkWord() {
    const targetTextContainer = planets.children.entries.find(
      (textContainer) => {
        const text = textContainer.list && textContainer.list[1];
        return text && text.text && text.text === typedWord.replace(/\s+/g, "");
      }
    );

    if (targetTextContainer) {
      // remove the planet container
      targetTextContainer.destroy();

      // Find and remove the planet associated with the targetTextContainer
      const planet = planets.children.entries.find(
        (planet) =>
          planet.x === targetTextContainer.x &&
          planet.y === targetTextContainer.y
      );
      if (planet) {
        planet.destroy();
      }

      moveMeteorite.call(this, targetTextContainer.x, targetTextContainer.y);

      // update score
      score += 1;
      scoreText.setText(`Score: ${score}`);

      planetsRemoved += 1;
      // every 3 planets removed, increase the falling speed of planets
      if (planetsRemoved % 1 === 0) {
        // increase the falling speed of planets by 30%
        scoreFactor += 0.3;
      }
    }
    const offscreenInput = document.getElementById("offscreen-input");
    offscreenInput.value = "";

    typedWord = "";
  }

  // meteorite animation
  function moveMeteorite(targetX, targetY) {
    // Calculate the angle between the satellite and the target
    let angle = Phaser.Math.Angle.Between(
      satellite.x,
      satellite.y,
      targetX,
      targetY
    );
    // Convert the angle to degrees
    let angleInDegrees = Phaser.Math.RadToDeg(angle);
    // Set the satellite angle
    satellite.setAngle(angleInDegrees + 45); // Update the angle offset to 45 degrees

    // Set the meteorite angle to match the satellite angle
    meteorite.setAngle(angleInDegrees);

    meteorite.visible = true;
    meteorite.setPosition(400, 430);

    this.tweens.add({
      targets: meteorite,
      x: targetX,
      y: targetY,
      duration: 500,
      onComplete: () => {
        meteorite.visible = false;
      },
    });
  }

  highestScoreText = this.add.text(
    this.sys.game.config.width / 2,
    0,
    "Highest Score: 0"
  );
  highestScoreText.setOrigin(0.5, 0); // This will center the text horizontally based on its position
};

gameScene.update = function () {
  if (!gameOver && gameStarted) {
    let planetsToDestroy = []; // array to hold planets that need to be destroyed
    planets.children.iterate(function (planetContainer) {
      // increase falling speed of planets
      planetContainer.y += 0.2 * scoreFactor;
      planetContainer.update(); // Update the text container position

      // check if planet has hit the bottom of the screen
      if (planetContainer.y >= this.sys.game.config.height) {
        planetsToDestroy.push(planetContainer); // add the planet to the destroy list
        score -= 0.5; // deduct one from the score
        scoreText.setText(`Score: ${score}`); // update the score display
      }
    }, this); // pass 'this' as the context for the callback

    // destroy the planets that need to be destroyed
    planetsToDestroy.forEach(function (planet) {
      planet.destroy();
    });
  } else if (gameOver && !scoreSaved) {
    planets.children.iterate(function (planetContainer) {
      // stop the planets from falling
      planetContainer.y = planetContainer.y;
    });
    // saveScore(); // Remove this line to avoid calling saveScore() twice
    scoreSaved = true;
  }
};

// send the score to the server
async function saveScore(username) {
  try {
    const response = await fetch("/api/scores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, score }),
    });
    if (response.ok) {
      const result = await response.json();
      console.log("Score saved:", result);
      // Update the highest score after saving the current score
      getHighestScore();
    } else {
      console.warn("Unable to save score:", response);
    }
  } catch (error) {
    console.warn(error);
  }
}

function handleHighScoreName(score) {
  const name = prompt(
    "Congratulations! You have reached the highest score. Please enter your name:"
  );

  if (name) {
    saveScore(name, score);
  } else {
    alert("Please enter a valid name to save your high score.");
  }
}

// function to update the timer
function updateTimer() {
  if (gameTimeLimit > 0) {
    gameTimeLimit -= 1;
    timer.setText(`Timer: ${gameTimeLimit}`);
  } else {
    gameOver = true;
    planets.clear(true, true); // Remove all planets and text from the scene
    this.time.delayedCall(
      0,
      () => {
        gameOverDisplay.call(this);
      },
      null,
      this
    );
  }
}

// function to spawn planets
function spawnPlanets() {
  if (!gameOver) {
    const planetKeys = [
      "sun",
      "mercury",
      "venus",
      "earth",
      "mars",
      "jupiter",
      "saturn",
      "uranus",
      "neptune",
    ];

    // planet related variables (scale, random index, random delay, text, text background)
    const scaleFactors = [1.5, 2, 2, 1.5, 1, 0.8, 1, 1, 1];
    const randomIndex = Math.floor(Math.random() * planetKeys.length);
    const randomX = Math.random() * (this.sys.game.config.width - 100) + 50;
    const randomDelay = Math.random() * 1000 + 1000;
    const planet = planets.create(randomX, -50, planetKeys[randomIndex]);
    planet.setScale(scaleFactors[randomIndex]);
    const textStyle = { font: "16px Arial", fill: "#ffffff" };

    // Randomize capitalization of the text
    const randomizedText = randomizeTextCapitalization(planetKeys[randomIndex]);

    const text = this.add.text(0, 0, randomizedText, textStyle);
    text.setOrigin(0.5, 0.5);
    const textBackground = this.add.graphics();
    textBackground.fillStyle(0x000000, 0.8);
    textBackground.fillRect(
      -text.width / 2 - 2,
      -text.height / 2 - 2,
      text.width + 4,
      text.height + 4
    );

    const textContainer = this.add.container(randomX, -50, [
      textBackground,
      text,
    ]);
    // text z-index
    textContainer.depth = 2;
    planets.add(textContainer);

    // Add an update function to update the text container position
    textContainer.update = function () {
      this.x = planet.x;
      this.y = planet.y;
    };

    this.time.addEvent({
      delay: randomDelay,
      callback: spawnPlanets,
      callbackScope: this,
    });
  }
}

// Randomize capitalization of a string
function randomizeTextCapitalization(text) {
  let randomizedText = text.toLowerCase();

  // select a random position in the text
  const randomPosition = Math.floor(Math.random() * text.length);

  // only capitalize the letter at the random position
  randomizedText =
    randomizedText.slice(0, randomPosition) +
    randomizedText.charAt(randomPosition).toUpperCase() +
    randomizedText.slice(randomPosition + 1);

  return randomizedText;
}

// game over display
function gameOverDisplay() {
  if (!gameOverDisplayed) {
    // Add this condition to check if the game over text has been displayed before
    // Display "Game Over" text
    const gameOverText = this.add.text(
      this.sys.game.config.width / 2,
      this.sys.game.config.height / 2 - 50,
      "Game Over",
      { fontSize: "32px", fontStyle: "bold", color: "#FFFFFF" }
    );
    gameOverText.setOrigin(0.5, 0.5);

    // Check if the user achieved the highest score
    getHighestScore().then((highestScore) => {
      if (score > highestScore) {
        handleHighScoreName(score);
      }
    });

    // Show the top 10 scores
    showTop10Scores.call(this);

    gameOverDisplayed = true;
  }
}

// reset the game
function resetGame() {
  typedWord = "";
  typedWordText.setText("");
  score = 0;
  scoreText.setText(`Score: ${score}`);
  timer.setText(`Timer: ${gameTimeLimit}`);
  gameStarted = true;
  spawnPlanets.call(this);
}

// get highest score from the server
async function getHighestScore() {
  if (getHighestScore.highestScore === undefined) {
    try {
      const response = await fetch("/api/scores");

      if (response.ok) {
        const scores = await response.json();
        const highestScoreEntry = scores[0];
        const highestScore = highestScoreEntry ? highestScoreEntry.score : 0;
        const highestUsername = highestScoreEntry
          ? highestScoreEntry.username
          : "";
        highestScoreText.setText(
          `Highest Score: ${highestScore} by ${highestUsername}`
        );
        getHighestScore.highestScore = highestScore;
      } else {
        console.log("Error getting highest score");
      }
    } catch (error) {
      console.warn(error);
    }
  }

  return getHighestScore.highestScore;
}

async function showTop10Scores() {
  try {
    const response = await fetch("/api/scores/top10");

    if (response.ok) {
      const scores = await response.json();
      let top10ScoresText = "Top 10 Scores:\n";

      scores.forEach((entry, index) => {
        top10ScoresText += `${index + 1}. ${entry.username}: ${entry.score}\n`;
      });

      const top10ScoresDisplay = this.add.text(
        this.sys.game.config.width / 2,
        this.sys.game.config.height / 2 + 50,
        top10ScoresText,
        { fontSize: "16px", fontStyle: "bold", color: "#FFFFFF" }
      );
      top10ScoresDisplay.setOrigin(0.5, 0.5);
    } else {
      console.log("Error getting top 10 scores");
    }
  } catch (error) {
    console.warn(error);
  }
}

getHighestScore();
