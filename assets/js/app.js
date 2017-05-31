$(document).ready(function() {
  (function() {
    //DOM elements
    const starterTile = document.querySelector('#starterTile');
    const questionsTile = document.querySelector('#questionsTile');
    const startBtn = document.querySelector('#startBtn');
    const questionCount = document.querySelector('#questionCount');
    const categories = document.querySelector('#categories');
    const difficulty = document.querySelector('#difficulty');
    const type = document.querySelector('#type');
    const timer = document.querySelector('#timer');

    // Event listeners
    startBtn.addEventListener('click', () => {
      runGame(questionCount.value, categories.value, difficulty.value, type.value);
    });

    function runGame(questionCount, categories, difficulty, type) {
      // reset styles in case of reloading
      starterTile.style.display = 'none';
      questionsTile.style.display = 'block';

      // declare function scope variables
      let apiCallAddress = buildRequestURL(questionCount, categories, difficulty, type);
      let qData = {};
      let timerHandle;

      // make a request for data, validate, then create and append the DOM elements
      requestQuestions(apiCallAddress).then(function(data) {
        if (data['response_code'] !== 0) {
          questionsTile.innerHTML = 'Something went wrong with the API call. Please reload.';
        } else {
          qData = data;
          questionsTile.innerHTML = data.results
            .map(question => {
              return createQuestionTile(question);
            })
            .join('');

          startTimer(questionCount);
        }
        createSubmitButton();
      });

      // sets the timer for the game and calls endGame() if time runs out
      function startTimer(questionCount) {
        let time = questionCount * 10;
        timer.style.display = 'block';
        timer.textContent = timeConvert(time--);
        timerHandle = setInterval(function() {
          if (time > 0) {
            timer.textContent = timeConvert(time--);
          } else {
            endGame(qData, timerHandle);
          }
        }, 1000);
      }

      // creates the Submit button for the game
      function createSubmitButton() {
        let submitBtn = document.createElement('btn');
        submitBtn.textContent = 'Submit';
        submitBtn.addEventListener('click', function handleSubmit() {
          submitBtn.removeEventListener('click', handleSubmit);
          endGame(qData, timerHandle, handleSubmit);
        });
        submitBtn.id = 'submit';
        submitBtn.classList.add('btn', 'btn-primary');
        questionsTile.appendChild(submitBtn);
      }
    }

    // creates the correct URL based on the selected options
    function buildRequestURL(questionCount, categories, difficulty, type) {
      let config = {
        amount: questionCount,
        category: categories,
        difficulty: difficulty,
        type: type
      };

      let baseURL = 'https://opentdb.com/api.php?';

      for (var prop in config) {
        if (config.hasOwnProperty(prop)) {
          if (config[prop] !== 'any') {
            baseURL = baseURL.concat(`${prop}=${config[prop]}&`);
          }
        }
      }

      baseURL = baseURL.slice(0, baseURL.length - 1);
      return baseURL;
    }

    // creates the AJAX fetch request and returns JSON data
    function requestQuestions(URL) {
      return new Promise(function(resolve, reject) {
        fetch(URL)
          .then(function(response) {
            if (response.status !== 200) {
              console.log('Error with status code : ' + response.status);
            }
            response.json().then(function(data) {
              resolve(data);
            });
          })
          .catch(function(err) {
            console.log('Fetch error: ' + err);
            reject();
          });
      });
    }

    // creates a section for a question and its answers
    function createQuestionTile(question) {
      let ansArray;

      if (question.incorrect_answers.length > 1) {
        ansArray = randomizeAnswers(question);
      } else {
        ansArray = ['True', 'False'];
      }

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
        .join('');

      return `
      <form>
        <div class="question">
          <h4>${question['question']}</h4>
          <div class="radio">
            ${ansString}
          </div>
        </div>
      </form>
      `;
    }

    // shuffles the answers using the Fisher-Yates algorithm
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

    // ends the game and prepares to display final info
    function endGame(qData, timerHandle) {
      clearInterval(timerHandle);

      let missedQuestions = [];
      let questions = qData.results;
      let answers = document.querySelectorAll('input:checked');
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
      finalGameScreen({ 'Number Correct': correctlyAnswered }, missedQuestions);
    }

    function timeConvert(time) {
      let minutes = Math.floor(time / 60);
      let seconds = time % 60;
      if (seconds < 10) {
        seconds = `0${seconds}`;
      }
      if (minutes < 10) {
        minutes = `0${minutes}`;
      }
      return `${minutes}:${seconds}`;
    }

    function finalGameScreen(statsObj, missedQuestions) {
      let header = `
      <div class="page-header full-width">
       <h1>Final Results</h1>
      </div>
      `;
      timer.style.display = 'none';
      let gameStats = '';
      for (var prop in statsObj) {
        if (statsObj.hasOwnProperty(prop)) {
          gameStats = gameStats.concat(`<h3>${prop}: ${statsObj[prop]}</h3>`);
        }
      }
      questionsTile.innerHTML = header.concat(gameStats);
      missedQuestions.forEach(question => {
        let c = document.createElement('div');
        let q = document.createElement('div');
        let a = document.createElement('p');

        c.classList.add('thumbnail');
        q.classList.add('well');

        q.innerHTML = `${question.question}`;
        a.innerHTML = `Correct answer: <span class="text-danger">${question.correct_answer}</span>`;

        c.appendChild(q);
        c.appendChild(a);

        questionsTile.appendChild(c);
      });

      let replayBtn = document.createElement('btn');
      replayBtn.classList.add('btn', 'btn-primary');
      replayBtn.textContent = 'Play Again';
      questionsTile.appendChild(replayBtn);
      replayBtn.addEventListener('click', resetGame);
    }

    function resetGame() {
      questionsTile.style.display = 'none';
      starterTile.style.display = 'block';
    }
  })();
});
