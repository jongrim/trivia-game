$(document).ready(function() {
  (function() {
    //DOM elements
    const starterTile = document.querySelector("#starterTile");
    const questionsTile = document.querySelector("#questionsTile");
    const startBtn = document.querySelector("#startBtn");
    const questionCount = document.querySelector("#questionCount");
    const categories = document.querySelector("#categories");
    const difficulty = document.querySelector("#difficulty");
    const type = document.querySelector("#type");
    const timer = document.querySelector("#timer");
    let submitBtn = document.createElement("btn");

    // Event listeners
    startBtn.addEventListener("click", () => {
      runGame(
        questionCount.value,
        categories.value,
        difficulty.value,
        type.value
      );
    });

    function runGame(questionCount, categories, difficulty, type) {
      starterTile.style.display = "none";
      questionsTile.style.display = "block";
      let api = buildRequestURL(questionCount, categories, difficulty, type);
      let time = questionCount * 5;
      let qData = {};

      requestQuestions(api).then(function(data) {
        if (data["response_code"] !== 0) {
        }
        qData = data;
        questionsTile.innerHTML = data.results
          .map(question => {
            return createQuestionTile(question);
          })
          .join("");

        timer.style.display = "block";
        timer.textContent = timeConvert(time--);
        let timerHandle = setInterval(function() {
          if (time > 0) {
            timer.textContent = timeConvert(time--);
          } else {
            endGame(qData, timerHandle);
          }
        }, 1000);

        submitBtn.textContent = "Submit";
        submitBtn.addEventListener("click", function handleSubmit() {
          endGame(qData, timerHandle, handleSubmit);
        });
        submitBtn.id = "submit";
        submitBtn.classList.add("btn", "btn-primary");

        questionsTile.appendChild(submitBtn);
      });
    }

    function buildRequestURL(questionCount, categories, difficulty, type) {
      let config = {
        amount: questionCount,
        category: categories,
        difficulty: difficulty,
        type: type
      };

      let baseURL = "https://opentdb.com/api.php?";

      for (var prop in config) {
        if (config.hasOwnProperty(prop)) {
          if (config[prop] !== "any") {
            baseURL = baseURL.concat(`${prop}=${config[prop]}&`);
          }
        }
      }

      baseURL = baseURL.slice(0, baseURL.length - 1);
      return baseURL;
    }

    function requestQuestions(URL) {
      return new Promise(function(resolve, reject) {
        fetch(URL)
          .then(function(response) {
            if (response.status !== 200) {
              console.log("Error with status code : " + response.status);
            }
            response.json().then(function(data) {
              resolve(data);
            });
          })
          .catch(function(err) {
            console.log("Fetch error: " + err);
            reject();
          });
      });
    }

    function createQuestionTile(question) {
      let ansArray = randomizeAnswers(question);

      let ansString = ansArray
        .map(answer => {
          return `
          <div class="answer radio">
            <label>
                <input type="radio" name="optionsRadios" value="${answer}">
                ${answer}
            </label>
          </div>
        `;
        })
        .join("");

      return `
      <form>
        <div class="question">
          <h4>${question["question"]}</h4>
          <div class="radio">
            ${ansString}
          </div>
        </div>
      </form>
      `;
    }

    function randomizeAnswers(question) {
      let a = [question.correct_answer, ...question.incorrect_answers];
      // shuffle answers
      return shuffle(a);
      function shuffle(array) {
        let n = array.length, i, t;

        while (n) {
          i = Math.floor(Math.random() * n--);

          t = array[n];
          array[n] = array[i];
          array[i] = t;
        }
        return array;
      }
    }

    function endGame(qData, timerHandle, clickFunction) {
      clearInterval(timerHandle);
      submitBtn.removeEventListener("click", clickFunction);
      timer.textContent = "00:00";

      let missedQuestions = [];
      let questions = qData.results;
      let answers = document.querySelectorAll("input:checked");
      let correctlyAnswered = questions.reduce((acc, cur, i) => {
        if (i < answers.length) {
          if (cur.correct_answer === answers[i].value) {
            return (acc += 1);
          } else {
            missedQuestions.push({
              question: cur.question,
              correct_answer: cur.correct_answer
            });
            return acc;
          }
        } else {
          missedQuestions.push({
            question: cur.question,
            correct_answer: cur.correct_answer
          });
          return acc;
        }
      }, 0);
      console.log(missedQuestions);
      finalGameScreen({ "Number Correct": correctlyAnswered }, missedQuestions);
    }

    function timeConvert(time) {
      let minutes = Math.floor(time / 60) || "00";
      let seconds = time % 60;
      return `${minutes}:${seconds}`;
    }

    function finalGameScreen(statsObj, missedQuestions) {
      let header = `
      <div class="page-header full-width">
       <h1>Final Results</h1>
      </div>
      `;
      timer.style.display = "none";
      let gameStats = "";
      for (var prop in statsObj) {
        if (statsObj.hasOwnProperty(prop)) {
          gameStats = gameStats.concat(`<p>${prop}: ${statsObj[prop]}</p>`);
        }
      }
      questionsTile.innerHTML = header.concat(gameStats);
      debugger;
      missedQuestions.forEach(question => {
        let el = document.createElement("p");
        el.textContent = `${question.question}: ${question.correct_answer}`;
        questionsTile.appendChild(el);
      });

      let replayBtn = document.createElement("btn");
      replayBtn.classList.add("btn", "btn-primary");
      replayBtn.textContent = "Play Again";
      questionsTile.appendChild(replayBtn);
      replayBtn.addEventListener("click", resetGame);
    }

    function resetGame() {
      questionsTile.style.display = "none";
      starterTile.style.display = "block";
    }
  })();
});
