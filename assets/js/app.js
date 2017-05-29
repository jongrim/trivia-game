$(document).ready(function () {
  
  (function () {
    //DOM elements
    const tile = document.querySelector('#tile');
    const startBtn = document.querySelector('#startBtn');
    const questionCount = document.querySelector('#questionCount');
    const categories = document.querySelector('#categories');
    const difficulty = document.querySelector('#difficulty');
    const type = document.querySelector('#type');

    // Event listeners
    startBtn.addEventListener('click', () => {
      runGame(
        questionCount.value,
        categories.value,
        difficulty.value,
        type.value);
    });

    function runGame(questionCount, categories, difficulty, type) {
      let api = buildRequestURL(questionCount, categories, difficulty, type);
      
      // fetch trivia questions and hold as JSON
      requestQuestions(api)
        .then(function (data) {
          if (data["response_code"] !== 0) {
          }
          tile.innerHTML = createQuestionTile(data["results"][0]);
        });

      // for each question:
      // make the question tile
      // start a timer for the question
      // when answered or when time runs out, make a new tile
      // when done, show final stats page
    }

    function buildRequestURL(questionCount, categories, difficulty, type) {
      let config = {
        amount: questionCount,
        category: categories,
        difficulty: difficulty,
        type: type,
      }

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

    function requestQuestions(URL) {
      return new Promise(function (resolve, reject) {
        fetch(URL)
          .then(function (response) {
            if (response.status !== 200) {
              console.log('Error with status code : ' + response.status);
            }
            response.json()
              .then(function (data) {
                resolve(data);
              });
          })
          .catch(function (err) {
            console.log('Fetch error: ' + err);
            reject();
          });
      });
    }

    function createQuestionTile(question) {
      return `
      <div>
        <h1>${question["question"]}</h1>
        <div class="radio">
          <label>
            <input type="radio" name="optionsRadios" id="optionsRadios1" value="${question}" checked>
            Option one is this and that&mdash;be sure to include why it's great
          </label>
        </div>
      </div>
      `
    }

    function randomizeAnswers(question) {
      let a = [question.correct_answer, ...question.incorrect_answers];
      // shuffle answers
    }
  })();
})
